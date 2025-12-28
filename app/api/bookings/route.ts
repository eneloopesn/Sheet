import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, classDate, className, notes } = body

    const booking = await prisma.booking.create({
      data: {
        name,
        phone,
        email,
        classDate: new Date(classDate),
        className,
        notes,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const bookings = await prisma.booking.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            account: true,
          },
        },
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}


