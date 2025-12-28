import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status')

    const where: any = {}
    if (memberId) where.memberId = memberId
    if (status) where.status = status

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            account: true,
            phone: true,
          },
        },
      },
      orderBy: { classDate: 'desc' },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('Failed to fetch leaves:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaves' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    const leave = await prisma.leave.update({
      where: { id },
      data: { status },
      include: {
        member: true,
      },
    })

    return NextResponse.json({ success: true, leave })
  } catch (error) {
    console.error('Failed to update leave:', error)
    return NextResponse.json(
      { error: 'Failed to update leave' },
      { status: 500 }
    )
  }
}


