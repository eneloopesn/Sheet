import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { classId } = body

    if (!classId) {
      return NextResponse.json({ error: '請選擇課程' }, { status: 400 })
    }

    // 檢查課程是否存在且可預約
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classItem) {
      return NextResponse.json({ error: '課程不存在' }, { status: 404 })
    }

    if (classItem.status !== 'active') {
      return NextResponse.json({ error: '課程不可預約' }, { status: 400 })
    }

    if (classItem.enrolled >= classItem.capacity) {
      return NextResponse.json({ error: '課程已額滿' }, { status: 400 })
    }

    // 檢查是否已經預約過
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        memberId_classId: {
          memberId: user.id,
          classId: classId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: '您已經預約過此課程' }, { status: 400 })
    }

    // 創建預約
    await prisma.classEnrollment.create({
      data: {
        memberId: user.id,
        classId: classId,
      },
    })

    // 更新課程人數
    await prisma.class.update({
      where: { id: classId },
      data: {
        enrolled: {
          increment: 1,
        },
        status: classItem.enrolled + 1 >= classItem.capacity ? 'full' : 'active',
      },
    })

    return NextResponse.json({ success: true, message: '預約成功' })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: '預約失敗' },
      { status: 500 }
    )
  }
}

