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

    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
    })

    if (!leave || leave.memberId !== user.id) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
    }

    // 檢查是否可以取消（課程開始前2小時）
    const now = new Date()
    const classDateTime = new Date(leave.classDate)
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilClass < 2) {
      return NextResponse.json(
        { error: '取消申請需在課程開始前2小時以上提出' },
        { status: 400 }
      )
    }

    // 檢查原始狀態是否為已核准（只有已核准的請假才需要恢復人數）
    const wasApproved = leave.status === 'approved'

    // 更新請假狀態為已取消
    const updatedLeave = await prisma.leave.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    // 如果原始狀態為已核准，恢復會員剩餘課堂數（減1，因為取消請假）
    if (wasApproved) {
      await prisma.member.update({
        where: { id: user.id },
        data: {
          remainingClasses: {
            decrement: 1,
          },
        },
      })
    }

    // 如果請假有關聯的課程，且原始狀態為已核准，恢復課程人數
    // 週期性課程也需要恢復enrolled
    if (updatedLeave.classId && wasApproved) {
      const classItem = await prisma.class.findUnique({
        where: { id: updatedLeave.classId },
      })

      if (classItem) {
        await prisma.class.update({
          where: { id: updatedLeave.classId },
          data: {
            enrolled: {
              increment: 1,
            },
            status: classItem.enrolled + 1 < classItem.capacity ? 'active' : 'full',
          },
        })
      }
    }

    return NextResponse.json({ success: true, leave: updatedLeave })
  } catch (error) {
    console.error('Leave cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel leave' },
      { status: 500 }
    )
  }
}


