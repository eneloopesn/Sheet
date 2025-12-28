import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, parseISO, addDays, addWeeks, addMonths, isBefore, isAfter } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    // 如果沒有提供日期，使用今天
    const queryDate = dateParam ? new Date(dateParam) : new Date()
    const dateStr = format(queryDate, 'yyyy-MM-dd')
    const dateStart = new Date(dateStr + 'T00:00:00')
    const dateEnd = new Date(dateStr + 'T23:59:59')

    // 獲取該日的所有課程
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          // 非週期性課程：日期在查詢日期
          {
            isRecurring: false,
            date: {
              gte: dateStart,
              lte: dateEnd,
            },
            status: 'active',
          },
          // 週期性課程：可能在此日期有課程
          {
            isRecurring: true,
            date: {
              lte: dateEnd,
            },
            OR: [
              { recurringEndDate: null },
              { recurringEndDate: { gte: dateStart } },
            ],
            status: 'active',
          },
        ],
      },
      orderBy: [
        { startTime: 'asc' },
      ],
      include: {
        enrollments: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                phone: true,
                account: true,
              },
            },
          },
        },
        makeups: {
          where: {
            status: { in: ['approved', 'pending'] },
            classDate: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                phone: true,
                account: true,
              },
            },
          },
        },
        leaves: {
          where: {
            status: { in: ['approved', 'pending'] },
            classDate: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
          select: {
            memberId: true,
            classDate: true,
          },
        },
        members1: {
          select: {
            id: true,
            name: true,
            phone: true,
            account: true,
          },
        },
        members2: {
          select: {
            id: true,
            name: true,
            phone: true,
            account: true,
          },
        },
        members3: {
          select: {
            id: true,
            name: true,
            phone: true,
            account: true,
          },
        },
      },
    })

    // 處理週期性課程，檢查該日期是否有課程實例
    const dayClasses: any[] = []
    for (const classItem of classes) {
      let shouldInclude = false
      let classInstanceDate = new Date(classItem.date)

      if (classItem.isRecurring && classItem.recurringPattern) {
        const baseDate = new Date(classItem.date)
        const endRecurringDate = classItem.recurringEndDate 
          ? new Date(classItem.recurringEndDate) 
          : queryDate
        const actualEndDate = isBefore(endRecurringDate, queryDate) ? endRecurringDate : queryDate

        let currentDate = new Date(baseDate)
        
        // 如果基礎日期在查詢範圍之前，需要找到第一個符合範圍的日期
        if (isBefore(currentDate, dateStart)) {
          switch (classItem.recurringPattern) {
            case 'daily':
              const daysDiff = Math.ceil((dateStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              currentDate = addDays(currentDate, daysDiff)
              break
            case 'weekly':
              const weeksDiff = Math.ceil((dateStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
              currentDate = addWeeks(currentDate, weeksDiff)
              break
            case 'monthly':
              let tempDate = new Date(currentDate)
              while (isBefore(tempDate, dateStart)) {
                tempDate = addMonths(tempDate, 1)
              }
              currentDate = tempDate
              break
          }
        }

        // 檢查該日期是否有課程實例
        while (isBefore(currentDate, actualEndDate) || format(currentDate, 'yyyy-MM-dd') === format(actualEndDate, 'yyyy-MM-dd')) {
          if (isAfter(currentDate, dateEnd)) break
          
          if (format(currentDate, 'yyyy-MM-dd') === dateStr) {
            shouldInclude = true
            classInstanceDate = currentDate
            break
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
        // 非週期性課程：檢查日期是否匹配
        if (format(new Date(classItem.date), 'yyyy-MM-dd') === dateStr) {
          shouldInclude = true
        }
      }

      if (shouldInclude) {
        // 獲取該日期實例的補課學員
        const makeupMembers = classItem.makeups
          .filter(m => format(new Date(m.classDate), 'yyyy-MM-dd') === dateStr)
          .map(m => m.member)
        
        // 獲取該日期實例的請假學員ID（需要排除）
        const leaveMemberIds = new Set(
          classItem.leaves
            .filter(l => format(new Date(l.classDate), 'yyyy-MM-dd') === dateStr)
            .map(l => l.memberId)
        )

        // 排除請假的學員
        const allMembers = [
          ...classItem.enrollments
            .filter(e => !leaveMemberIds.has(e.member.id))
            .map(e => ({ ...e.member, type: 'enrollment' })),
          ...makeupMembers.map(m => ({ ...m, type: 'makeup' })),
          ...classItem.members1
            .filter(m => !leaveMemberIds.has(m.id))
            .map(m => ({ ...m, type: 'regular' })),
          ...classItem.members2
            .filter(m => !leaveMemberIds.has(m.id))
            .map(m => ({ ...m, type: 'regular' })),
          ...classItem.members3
            .filter(m => !leaveMemberIds.has(m.id))
            .map(m => ({ ...m, type: 'regular' })),
        ]

        // 去重學員（同一學員可能通過多種方式報名）
        const memberMap = new Map()
        allMembers.forEach((member: any) => {
          if (!memberMap.has(member.id)) {
            memberMap.set(member.id, {
              ...member,
              types: [member.type],
            })
          } else {
            const existing = memberMap.get(member.id)
            if (!existing.types.includes(member.type)) {
              existing.types.push(member.type)
            }
          }
        })

        dayClasses.push({
          id: classItem.isRecurring ? `${classItem.id}_${format(classInstanceDate, 'yyyyMMdd')}` : classItem.id,
          name: classItem.name,
          instructor: classItem.instructor,
          date: classInstanceDate.toISOString(),
          startTime: classItem.startTime,
          endTime: classItem.endTime,
          room: classItem.room,
          capacity: classItem.capacity,
          allMembers: Array.from(memberMap.values()),
        })
      }
    }

    return NextResponse.json({
      date: dateStr,
      classes: dayClasses,
    })
  } catch (error) {
    console.error('Failed to fetch daily class members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily class members' },
      { status: 500 }
    )
  }
}











