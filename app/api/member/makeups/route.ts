import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS, formatMakeupSMS } from '@/lib/sms'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { classId, leaveId, classDate, className, instructor } = body

    if (!classId) {
      return NextResponse.json(
        { error: '請選擇課程' },
        { status: 400 }
      )
    }

    // 檢查課程是否存在且可預約
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: '課程不存在' },
        { status: 404 }
      )
    }

    if (classItem.status !== 'active') {
      return NextResponse.json(
        { error: '課程不可預約' },
        { status: 400 }
      )
    }

    // 解析課程日期時間（需要在檢查額滿之前定義）
    const classDateTime = new Date(classDate)

    // 對於週期性課程，需要計算該特定日期實例的實際人數
    // 對於非週期性課程，使用enrolled字段
    let actualEnrolled = classItem.enrolled
    
    if (classItem.isRecurring) {
      // 計算該特定日期實例的實際人數
      const dateStr = format(classDateTime, 'yyyy-MM-dd')
      
      // 固定課程學員數（classId1, classId2, classId3）
      const regularMembersCount = await prisma.member.count({
        where: {
          OR: [
            { classId1: classId },
            { classId2: classId },
            { classId3: classId },
          ],
        },
      })
      
      // 一般報名學員數（ClassEnrollment）
      const enrollmentCount = await prisma.classEnrollment.count({
        where: { classId: classId },
      })
      
      // 該日期補課的學員數
      const makeupCount = await prisma.makeup.count({
        where: {
          classId: classId,
          status: { in: ['approved', 'pending'] },
          classDate: {
            gte: new Date(dateStr + 'T00:00:00'),
            lt: new Date(dateStr + 'T23:59:59'),
          },
        },
      })
      
      // 該日期請假的學員數（需要減去）
      const leaveCount = await prisma.leave.count({
        where: {
          classId: classId,
          status: { in: ['approved', 'pending'] },
          classDate: {
            gte: new Date(dateStr + 'T00:00:00'),
            lt: new Date(dateStr + 'T23:59:59'),
          },
        },
      })
      
      actualEnrolled = regularMembersCount + enrollmentCount + makeupCount - leaveCount
    }
    
    if (actualEnrolled >= classItem.capacity) {
      return NextResponse.json(
        { error: '課程已額滿' },
        { status: 400 }
      )
    }

    // 檢查會員是否有已核准的請假紀錄
    const approvedLeaves = await prisma.leave.findMany({
      where: {
        memberId: user.id,
        status: 'approved',
      },
    })

    if (approvedLeaves.length === 0) {
      return NextResponse.json(
        { error: '需先請假才能補課' },
        { status: 400 }
      )
    }

    // 如果有 leaveId，檢查請假是否存在且已核准
    if (leaveId) {
      const leave = await prisma.leave.findUnique({
        where: { id: leaveId },
      })

      if (!leave || leave.memberId !== user.id || leave.status !== 'approved') {
        return NextResponse.json(
          { error: '無效的請假紀錄' },
          { status: 400 }
        )
      }
    }

    // 檢查是否在課程開始前2小時以上
    const now = new Date()
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilClass < 2) {
      return NextResponse.json(
        { error: '補課申請需在課程開始前2小時以上提出' },
        { status: 400 }
      )
    }

    // 建立補課申請（立即生效，狀態為已核准）
    const makeup = await prisma.makeup.create({
      data: {
        memberId: user.id,
        classId: classId,
        leaveId: leaveId || null,
        classDate: classDateTime,
        className: className || classItem.name,
        instructor: instructor || classItem.instructor,
        status: 'approved',
      },
    })

    // 更新會員剩餘課堂數：補課時減1
    await prisma.member.update({
      where: { id: user.id },
      data: {
        remainingClasses: {
          decrement: 1,
        },
      },
    })

    // 更新課程人數：補課時增加1
    // 週期性課程也需要更新enrolled（用於統計目的）
    await prisma.class.update({
      where: { id: classId },
      data: {
        enrolled: {
          increment: 1,
        },
        status: classItem.enrolled + 1 >= classItem.capacity ? 'full' : 'active',
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
      const message = formatMakeupSMS(member.name, classDateStr, className || classItem.name)
      await sendSMS({ to: member.phone, message })
    }

    return NextResponse.json({ success: true, makeup })
  } catch (error) {
    console.error('Makeup creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create makeup request' },
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

    const makeups = await prisma.makeup.findMany({
      where: { memberId: user.id },
      orderBy: { classDate: 'desc' },
      include: {
        leave: true,
      },
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

