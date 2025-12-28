import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [leaves, makeups] = await Promise.all([
      prisma.leave.findMany({
        where: { memberId: user.id },
        orderBy: { classDate: 'desc' },
        include: {
          makeups: true,
        },
      }),
      prisma.makeup.findMany({
        where: { memberId: user.id },
        orderBy: { classDate: 'desc' },
        include: {
          leave: true,
        },
      }),
    ])

    const member = await prisma.member.findUnique({
      where: { id: user.id },
      select: {
        remainingClasses: true,
        planType: true,
        planStartDate: true,
        planEndDate: true,
      },
    })

    return NextResponse.json({
      leaves,
      makeups,
      memberInfo: member,
    })
  } catch (error) {
    console.error('Failed to fetch records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}


