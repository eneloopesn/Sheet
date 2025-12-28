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

    const makeups = await prisma.makeup.findMany({
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
        leave: true,
      },
      orderBy: { classDate: 'desc' },
    })

    return NextResponse.json(makeups)
  } catch (error) {
    console.error('Failed to fetch makeups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch makeups' },
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

    const makeup = await prisma.makeup.update({
      where: { id },
      data: { status },
      include: {
        member: true,
      },
    })

    return NextResponse.json({ success: true, makeup })
  } catch (error) {
    console.error('Failed to update makeup:', error)
    return NextResponse.json(
      { error: 'Failed to update makeup' },
      { status: 500 }
    )
  }
}


