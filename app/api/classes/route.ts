import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, addWeeks, addMonths, isBefore, isAfter, format } from 'date-fns'

// 計算課程在特定日期的實際學員人數
async function calculateActualEnrolled(classId: string, dateStr: string): Promise<number> {
  // 固定課程學員數（classId1, classId2, classId3）
  const regularMembersCount = await prisma.member.count({
    where: {
      OR: [
        { classId1: classId },
        { classId2: classId },
        { classId3: classId },
      ],
    },
  })
  
  // 一般報名學員數（ClassEnrollment）
  const enrollmentCount = await prisma.classEnrollment.count({
    where: { classId: classId },
  })
  
  // 該日期補課的學員數（已核准和待審核）
  const makeupCount = await prisma.makeup.count({
    where: {
      classId: classId,
      status: { in: ['approved', 'pending'] },
      classDate: {
        gte: new Date(dateStr + 'T00:00:00'),
        lt: new Date(dateStr + 'T23:59:59'),
      },
    },
  })
  
  // 該日期請假的學員數（需要減去，已核准和待審核）
  const leaveCount = await prisma.leave.count({
    where: {
      classId: classId,
      status: { in: ['approved', 'pending'] },
      classDate: {
        gte: new Date(dateStr + 'T00:00:00'),
        lt: new Date(dateStr + 'T23:59:59'),
      },
    },
  })
  
  return regularMembersCount + enrollmentCount + makeupCount - leaveCount
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (startDate && endDate) {
      where.OR = [
        // 非週期性課程：日期在範圍內
        {
          isRecurring: false,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        },
        // 週期性課程：基礎日期在結束日期之前，且結束日期在開始日期之後
        {
          isRecurring: true,
          date: {
            lte: new Date(endDate),
          },
          OR: [
            { recurringEndDate: null },
            { recurringEndDate: { gte: new Date(startDate) } }
          ]
        }
      ]
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        instructor: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        capacity: true,
        enrolled: true,
        status: true,
        isRecurring: true,
        recurringPattern: true,
        recurringEndDate: true,
      },
    })

    // 處理週期性課程，生成所有符合日期範圍的實例
    const expandedClasses: any[] = []
    const queryStartDate = startDate ? new Date(startDate) : null
    const queryEndDate = endDate ? new Date(endDate) : null

    for (const classItem of classes) {
      if (classItem.isRecurring && classItem.recurringPattern && queryStartDate && queryEndDate) {
        const baseDate = new Date(classItem.date)
        const endRecurringDate = classItem.recurringEndDate ? new Date(classItem.recurringEndDate) : queryEndDate
        const actualEndDate = isBefore(endRecurringDate, queryEndDate) ? endRecurringDate : queryEndDate

        let currentDate = new Date(baseDate)
        
        // 如果基礎日期在查詢範圍之前，需要找到第一個符合範圍的日期
        if (isBefore(currentDate, queryStartDate)) {
          switch (classItem.recurringPattern) {
            case 'daily':
              const daysDiff = Math.ceil((queryStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              currentDate = addDays(currentDate, daysDiff)
              break
            case 'weekly':
              const weeksDiff = Math.ceil((queryStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
              currentDate = addWeeks(currentDate, weeksDiff)
              break
            case 'monthly':
              let monthsDiff = 0
              let tempDate = new Date(currentDate)
              while (isBefore(tempDate, queryStartDate)) {
                tempDate = addMonths(tempDate, 1)
                monthsDiff++
              }
              currentDate = tempDate
              break
          }
        }

        // 生成所有符合範圍的實例
        while (isBefore(currentDate, actualEndDate) || format(currentDate, 'yyyy-MM-dd') === format(actualEndDate, 'yyyy-MM-dd')) {
          if (isAfter(currentDate, queryEndDate)) break
          
          if (isAfter(currentDate, queryStartDate) || format(currentDate, 'yyyy-MM-dd') === format(queryStartDate, 'yyyy-MM-dd')) {
            // 計算該特定日期實例的實際學員人數
            const dateStr = format(currentDate, 'yyyy-MM-dd')
            const actualEnrolled = await calculateActualEnrolled(classItem.id, dateStr)
            
            expandedClasses.push({
              ...classItem,
              id: `${classItem.id}_${format(currentDate, 'yyyyMMdd')}`,
              date: currentDate.toISOString(),
              enrolled: actualEnrolled,
            })
          }

          // 移動到下一個週期
          switch (classItem.recurringPattern) {
            case 'daily':
              currentDate = addDays(currentDate, 1)
              break
            case 'weekly':
              currentDate = addWeeks(currentDate, 1)
              break
            case 'monthly':
              currentDate = addMonths(currentDate, 1)
              break
          }
        }
      } else {
        // 非週期性課程：計算實際學員人數
        const dateStr = format(new Date(classItem.date), 'yyyy-MM-dd')
        const actualEnrolled = await calculateActualEnrolled(classItem.id, dateStr)
        
        expandedClasses.push({
          ...classItem,
          enrolled: actualEnrolled,
        })
      }
    }

    return NextResponse.json(expandedClasses)
  } catch (error) {
    console.error('Failed to fetch classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    console.log('POST /api/classes - User:', user)
    
    if (!user || user.type !== 'admin') {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('POST /api/classes - Body:', body)
    
    const { name, instructor, date, startTime, endTime, room, capacity, isRecurring, recurringPattern, recurringEndDate } = body

    // 驗證必填字段
    if (!name || !instructor || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      )
    }

    const classData: any = {
      name,
      instructor,
      date: new Date(date),
      startTime,
      endTime,
      room: room || null,
      capacity: capacity ? parseInt(capacity) : 20,
      enrolled: 0,
      status: 'active',
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring && recurringPattern ? recurringPattern : null,
      recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
    }

    console.log('POST /api/classes - ClassData:', classData)

    const classItem = await prisma.class.create({
      data: classData,
    })

    console.log('POST /api/classes - Created:', classItem.id)
    return NextResponse.json({ success: true, class: classItem })
  } catch (error: any) {
    console.error('Failed to create class:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create class', details: error.code || 'UNKNOWN' },
      { status: 500 }
    )
  }
}


