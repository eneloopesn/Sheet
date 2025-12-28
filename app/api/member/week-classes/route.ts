import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, addWeeks, addDays, addMonths, format, startOfMonth, endOfMonth, eachWeekOfInterval, isBefore } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekIndex = searchParams.get('weekIndex') // 0 = 第一週, 1 = 第二週, etc.

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // 獲取當月的所有週
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } // 週一開始
    )

    if (!weekIndex) {
      // 返回當月的週列表
      const weekList = weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        return {
          index,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          label: `${format(weekStart, 'MM/dd')} - ${format(weekEnd, 'MM/dd')}`,
        }
      })
      return NextResponse.json(weekList)
    }

    // 獲取指定週的課程
    const weekIdx = parseInt(weekIndex)
    if (weekIdx < 0 || weekIdx >= weeks.length) {
      return NextResponse.json({ error: '無效的週索引' }, { status: 400 })
    }

    const weekStart = weeks[weekIdx]
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    // 獲取該週的所有課程
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          // 非週期性課程：日期在週範圍內
          {
            isRecurring: false,
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
            status: 'active',
          },
          // 週期性課程：可能在此週有課程
          {
            isRecurring: true,
            date: {
              lte: weekEnd,
            },
            OR: [
              { recurringEndDate: null },
              { recurringEndDate: { gte: weekStart } },
            ],
            status: 'active',
          },
        ],
      },
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
        isRecurring: true,
        recurringPattern: true,
        recurringEndDate: true,
      },
    })

    // 處理週期性課程，生成該週的實例
    const weekClasses: any[] = []
    for (const classItem of classes) {
      if (classItem.isRecurring && classItem.recurringPattern) {
        // 計算該週是否有此課程
        const baseDate = new Date(classItem.date)
        let currentDate = new Date(baseDate)

        // 找到該週的第一個可能的日期
        while (isBefore(currentDate, weekStart)) {
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

        // 檢查該週內是否有此課程
        while (isBefore(currentDate, weekEnd) || format(currentDate, 'yyyy-MM-dd') === format(weekEnd, 'yyyy-MM-dd')) {
          if (isBefore(currentDate, weekStart)) {
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

          const dateTime = new Date(currentDate)
          const [hours, minutes] = classItem.startTime.split(':').map(Number)
          dateTime.setHours(hours, minutes, 0, 0)

          weekClasses.push({
            ...classItem,
            id: `${classItem.id}_${format(currentDate, 'yyyyMMdd')}`,
            date: dateTime.toISOString(),
            availableSlots: classItem.capacity - classItem.enrolled,
          })

          // 週期性課程在該週只會出現一次
          break
        }
      } else {
        // 非週期性課程
        const dateTime = new Date(classItem.date)
        const [hours, minutes] = classItem.startTime.split(':').map(Number)
        dateTime.setHours(hours, minutes, 0, 0)

        weekClasses.push({
          ...classItem,
          date: dateTime.toISOString(),
          availableSlots: classItem.capacity - classItem.enrolled,
        })
      }
    }

    return NextResponse.json(weekClasses)
  } catch (error) {
    console.error('Failed to fetch week classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week classes' },
      { status: 500 }
    )
  }
}

