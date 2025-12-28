import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, addDays, addWeeks, addMonths, isBefore, isAfter, format, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStartParam = searchParams.get('weekStart')
    
    // 計算週的開始和結束日期
    const weekStart = weekStartParam 
      ? startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
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
              gte: weekStart,
              lte: weekEnd,
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
              gte: weekStart,
              lte: weekEnd,
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

    // 處理週期性課程，生成該週的實例
    const weekClasses: any[] = []
    for (const classItem of classes) {
      if (classItem.isRecurring && classItem.recurringPattern) {
        const baseDate = new Date(classItem.date)
        const endRecurringDate = classItem.recurringEndDate 
          ? new Date(classItem.recurringEndDate) 
          : weekEnd
        const actualEndDate = isBefore(endRecurringDate, weekEnd) ? endRecurringDate : weekEnd

        let currentDate = new Date(baseDate)
        
        // 如果基礎日期在查詢範圍之前，需要找到第一個符合範圍的日期
        if (isBefore(currentDate, weekStart)) {
          switch (classItem.recurringPattern) {
            case 'daily':
              const daysDiff = Math.ceil((weekStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              currentDate = addDays(currentDate, daysDiff)
              break
            case 'weekly':
              const weeksDiff = Math.ceil((weekStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
              currentDate = addWeeks(currentDate, weeksDiff)
              break
            case 'monthly':
              let tempDate = new Date(currentDate)
              while (isBefore(tempDate, weekStart)) {
                tempDate = addMonths(tempDate, 1)
              }
              currentDate = tempDate
              break
          }
        }

        // 生成所有符合範圍的實例
        while (isBefore(currentDate, actualEndDate) || format(currentDate, 'yyyy-MM-dd') === format(actualEndDate, 'yyyy-MM-dd')) {
          if (isAfter(currentDate, weekEnd)) break
          
          if (isAfter(currentDate, weekStart) || format(currentDate, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')) {
            // 獲取該日期實例的補課學員和請假學員
            const dateStr = format(currentDate, 'yyyy-MM-dd')
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

            weekClasses.push({
              ...classItem,
              id: `${classItem.id}_${format(currentDate, 'yyyyMMdd')}`,
              date: currentDate.toISOString(),
              allMembers,
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
        // 非週期性課程：獲取該日期的請假學員ID（需要排除）
        const classDateStr = format(new Date(classItem.date), 'yyyy-MM-dd')
        const leaveMemberIds = new Set(
          classItem.leaves
            .filter(l => format(new Date(l.classDate), 'yyyy-MM-dd') === classDateStr)
            .map(l => l.memberId)
        )

        // 排除請假的學員
        const allMembers = [
          ...classItem.enrollments
            .filter(e => !leaveMemberIds.has(e.member.id))
            .map(e => ({ ...e.member, type: 'enrollment' })),
          ...classItem.makeups.map(m => ({ ...m.member, type: 'makeup' })),
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

        weekClasses.push({
          ...classItem,
          allMembers,
        })
      }
    }

    // 去重學員（同一學員可能通過多種方式報名）
    const processedClasses = weekClasses.map(cls => {
      const memberMap = new Map()
      cls.allMembers.forEach((member: any) => {
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
      return {
        ...cls,
        allMembers: Array.from(memberMap.values()),
      }
    })

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      classes: processedClasses,
    })
  } catch (error) {
    console.error('Failed to fetch weekly attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly attendance' },
      { status: 500 }
    )
  }
}

