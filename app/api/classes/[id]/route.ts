import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, instructor, date, startTime, endTime, room, capacity, isRecurring, recurringPattern, recurringEndDate } = body

    const updateData: any = {
      name,
      instructor,
      date: new Date(date),
      startTime,
      endTime,
      room,
      capacity: capacity || 20,
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring ? recurringPattern : null,
      recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
    }

    const classItem = await prisma.class.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, class: classItem })
  } catch (error) {
    console.error('Failed to update class:', error)
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.class.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: '課程已刪除' })
  } catch (error) {
    console.error('Failed to delete class:', error)
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    )
  }
}

