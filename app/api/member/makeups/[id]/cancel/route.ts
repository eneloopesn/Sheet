import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const makeup = await prisma.makeup.findUnique({
      where: { id: params.id },
    })

    if (!makeup || makeup.memberId !== user.id) {
      return NextResponse.json({ error: 'Makeup not found' }, { status: 404 })
    }

    // 檢查是否可以取消（課程開始前2小時）
    const now = new Date()
    const classDateTime = new Date(makeup.classDate)
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilClass < 2) {
      return NextResponse.json(
        { error: '取消申請需在課程開始前2小時以上提出' },
        { status: 400 }
      )
    }

    // 檢查原始狀態是否為已核准（只有已核准的補課才需要減少人數）
    const wasApproved = makeup.status === 'approved'

    // 更新補課狀態為已取消
    const updatedMakeup = await prisma.makeup.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    // 如果原始狀態為已核准，恢復會員剩餘課堂數（加1，因為取消補課）
    if (wasApproved) {
      await prisma.member.update({
        where: { id: user.id },
        data: {
          remainingClasses: {
            increment: 1,
          },
        },
      })
    }

    // 如果補課有關聯的課程，且原始狀態為已核准，減少課程人數
    // 週期性課程也需要減少enrolled
    if (updatedMakeup.classId && wasApproved) {
      const classItem = await prisma.class.findUnique({
        where: { id: updatedMakeup.classId },
      })

      if (classItem) {
        await prisma.class.update({
          where: { id: updatedMakeup.classId },
          data: {
            enrolled: {
              decrement: 1,
            },
            status: classItem.enrolled > 0 && classItem.enrolled - 1 < classItem.capacity ? 'active' : 'full',
          },
        })
      }
    }

    return NextResponse.json({ success: true, makeup: updatedMakeup })
  } catch (error) {
    console.error('Makeup cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel makeup' },
      { status: 500 }
    )
  }
}


