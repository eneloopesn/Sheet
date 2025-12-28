import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.member.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        account: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        planType: true,
        remainingClasses: true,
        planStartDate: true,
        planEndDate: true,
        classId1: true,
        classId2: true,
        classId3: true,
        class1: true,
        class2: true,
        class3: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // 取得請假和補課統計
    const [leaves, makeups] = await Promise.all([
      prisma.leave.count({
        where: {
          memberId: user.id,
          status: { in: ['pending', 'approved'] },
          classDate: { gte: new Date() },
        },
      }),
      prisma.makeup.count({
        where: {
          memberId: user.id,
          status: { in: ['pending', 'approved'] },
          classDate: { gte: new Date() },
        },
      }),
    ])

    return NextResponse.json({
      member,
      stats: {
        upcomingLeaves: leaves,
        upcomingMakeups: makeups,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}


