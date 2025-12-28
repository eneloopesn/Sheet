import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, addWeeks, addMonths, isBefore, format, startOfWeek, endOfWeek } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!classId) {
      return NextResponse.json({ error: '請提供課程ID' }, { status: 400 })
    }

    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classItem) {
      return NextResponse.json({ error: '課程不存在' }, { status: 404 })
    }

    // 檢查會員是否有此課程
    const member = await prisma.member.findUnique({
      where: { id: user.id },
      select: {
        classId1: true,
        classId2: true,
        classId3: true,
      },
    })

    if (!member || (member.classId1 !== classId && member.classId2 !== classId && member.classId3 !== classId)) {
      return NextResponse.json({ error: '您沒有此課程' }, { status: 403 })
    }

    const dates: string[] = []
    const now = new Date()
    const baseDate = new Date(classItem.date)

    if (classItem.isRecurring && classItem.recurringPattern) {
      // 週期性課程：生成未來的日期
      let currentDate = new Date(baseDate)
      
      // 如果基礎日期在現在之前，需要找到第一個未來的日期
      if (isBefore(currentDate, now)) {
        switch (classItem.recurringPattern) {
          case 'daily':
            const daysDiff = Math.ceil((now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
            currentDate = addDays(currentDate, daysDiff)
            break
          case 'weekly':
            const weeksDiff = Math.ceil((now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
            currentDate = addWeeks(currentDate, weeksDiff)
            break
          case 'monthly':
            let tempDate = new Date(currentDate)
            while (isBefore(tempDate, now)) {
              tempDate = addMonths(tempDate, 1)
            }
            currentDate = tempDate
            break
        }
      }

      const endDate = classItem.recurringEndDate ? new Date(classItem.recurringEndDate) : addMonths(now, 3)

      while (dates.length < limit && (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd'))) {
        if (isBefore(currentDate, now)) {
          // 跳過過去的日期
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
          continue
        }

        // 組合日期和時間
        const dateTime = new Date(currentDate)
        const [hours, minutes] = classItem.startTime.split(':').map(Number)
        dateTime.setHours(hours, minutes, 0, 0)
        
        dates.push(dateTime.toISOString())

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
      // 非週期性課程：只返回未來的單一日期
      const dateTime = new Date(baseDate)
      const [hours, minutes] = classItem.startTime.split(':').map(Number)
      dateTime.setHours(hours, minutes, 0, 0)
      
      if (isBefore(dateTime, now)) {
        return NextResponse.json([])
      }
      
      dates.push(dateTime.toISOString())
    }

    return NextResponse.json(dates)
  } catch (error) {
    console.error('Failed to fetch class dates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class dates' },
      { status: 500 }
    )
  }
}




