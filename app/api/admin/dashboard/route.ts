import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalMembers,
      totalClasses,
      pendingBookings,
      pendingLeaves,
      pendingMakeups,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.class.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.leave.count({ where: { status: 'pending' } }),
      prisma.makeup.count({ where: { status: 'pending' } }),
    ])

    return NextResponse.json({
      totalMembers,
      totalClasses,
      pendingBookings,
      pendingLeaves,
      pendingMakeups,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}


