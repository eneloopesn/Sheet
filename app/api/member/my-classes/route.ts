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
        class1: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
            isRecurring: true,
            recurringPattern: true,
            recurringEndDate: true,
          },
        },
        class2: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
            isRecurring: true,
            recurringPattern: true,
            recurringEndDate: true,
          },
        },
        class3: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
            isRecurring: true,
            recurringPattern: true,
            recurringEndDate: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const classes = []
    if (member.class1) classes.push({ ...member.class1, type: '第一堂課' })
    if (member.class2) classes.push({ ...member.class2, type: '第二堂課' })
    if (member.class3) classes.push({ ...member.class3, type: '第三堂課' })

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Failed to fetch member classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member classes' },
      { status: 500 }
    )
  }
}




