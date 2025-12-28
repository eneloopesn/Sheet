import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS, formatLeaveSMS } from '@/lib/sms'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { classId, classDate, className, instructor, reason } = body

    if (!classId) {
      return NextResponse.json(
        { error: '請選擇課程' },
        { status: 400 }
      )
    }

    // 檢查課程是否存在
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: '課程不存在' },
        { status: 404 }
      )
    }

    // 檢查會員是否有此課程
    const memberCheck = await prisma.member.findUnique({
      where: { id: user.id },
      select: {
        classId1: true,
        classId2: true,
        classId3: true,
      },
    })

    if (!memberCheck || (memberCheck.classId1 !== classId && memberCheck.classId2 !== classId && memberCheck.classId3 !== classId)) {
      return NextResponse.json(
        { error: '您沒有此課程' },
        { status: 403 }
      )
    }

    // 檢查是否在課程開始前2小時以上
    const now = new Date()
    const classDateTime = new Date(classDate)
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilClass < 2) {
      return NextResponse.json(
        { error: '請假申請需在課程開始前2小時以上提出' },
        { status: 400 }
      )
    }

    // 建立請假申請（立即生效，狀態為已核准）
    const leave = await prisma.leave.create({
      data: {
        memberId: user.id,
        classId: classId,
        classDate: classDateTime,
        className: className || classItem.name,
        instructor: instructor || classItem.instructor,
        reason,
        status: 'approved',
      },
    })

    // 更新會員剩餘課堂數：請假時加1
    await prisma.member.update({
      where: { id: user.id },
      data: {
        remainingClasses: {
          increment: 1,
        },
      },
    })

    // 更新課程人數：請假時減少1
    // 週期性課程也需要更新enrolled（用於統計目的）
    await prisma.class.update({
      where: { id: classId },
      data: {
        enrolled: {
          decrement: 1,
        },
        status: classItem.enrolled > 0 && classItem.enrolled - 1 < classItem.capacity ? 'active' : classItem.status,
      },
    })

    // 發送 SMS 通知
    const member = await prisma.member.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        phone: true,
      },
    })

    if (member && member.phone) {
      const classDateStr = format(classDateTime, 'yyyy年MM月dd日 HH:mm')
      const message = formatLeaveSMS(member.name, classDateStr, className || classItem.name)
      await sendSMS({ to: member.phone, message })
    }

    return NextResponse.json({ success: true, leave })
  } catch (error) {
    console.error('Leave creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leaves = await prisma.leave.findMany({
      where: { memberId: user.id },
      orderBy: { classDate: 'desc' },
      include: {
        makeups: true,
      },
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

