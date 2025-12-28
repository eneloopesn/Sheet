import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        leaves: {
          orderBy: { classDate: 'desc' },
        },
        makeups: {
          orderBy: { classDate: 'desc' },
        },
        class1: true,
        class2: true,
        class3: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Failed to fetch member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

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
    const {
      account,
      password,
      name,
      phone,
      email,
      status,
      planType,
      classId1,
      classId2,
      classId3,
      remainingClasses,
      planStartDate,
      planEndDate,
    } = body

    // 先取得舊的會員資料，以便比較 classId 的變化
    const oldMember = await prisma.member.findUnique({
      where: { id: params.id },
      select: {
        classId1: true,
        classId2: true,
        classId3: true,
      },
    })

    if (!oldMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const newClassId1 = classId1 || null
    const newClassId2 = classId2 || null
    const newClassId3 = classId3 || null

    const updateData: any = {
      name,
      phone,
      email,
      status,
      planType,
      classId1: newClassId1,
      classId2: newClassId2,
      classId3: newClassId3,
      remainingClasses,
      planStartDate: planStartDate ? new Date(planStartDate) : null,
      planEndDate: planEndDate ? new Date(planEndDate) : null,
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    const updatedMember = await prisma.member.update({
      where: { id: params.id },
      data: updateData,
    })

    // 更新課程人數：處理 classId 的變化
    const classUpdates = []

    // 處理第一堂課
    if (oldMember.classId1 !== newClassId1) {
      if (oldMember.classId1) {
        // 移除舊的課程，人數 -1
        classUpdates.push(
          prisma.class.update({
            where: { id: oldMember.classId1 },
            data: { enrolled: { decrement: 1 } },
          })
        )
      }
      if (newClassId1) {
        // 新增新的課程，人數 +1
        classUpdates.push(
          prisma.class.update({
            where: { id: newClassId1 },
            data: { enrolled: { increment: 1 } },
          })
        )
      }
    }

    // 處理第二堂課
    if (oldMember.classId2 !== newClassId2) {
      if (oldMember.classId2) {
        classUpdates.push(
          prisma.class.update({
            where: { id: oldMember.classId2 },
            data: { enrolled: { decrement: 1 } },
          })
        )
      }
      if (newClassId2) {
        classUpdates.push(
          prisma.class.update({
            where: { id: newClassId2 },
            data: { enrolled: { increment: 1 } },
          })
        )
      }
    }

    // 處理第三堂課
    if (oldMember.classId3 !== newClassId3) {
      if (oldMember.classId3) {
        classUpdates.push(
          prisma.class.update({
            where: { id: oldMember.classId3 },
            data: { enrolled: { decrement: 1 } },
          })
        )
      }
      if (newClassId3) {
        classUpdates.push(
          prisma.class.update({
            where: { id: newClassId3 },
            data: { enrolled: { increment: 1 } },
          })
        )
      }
    }

    if (classUpdates.length > 0) {
      await Promise.all(classUpdates)
    }

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
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

    await prisma.member.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete member:', error)
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}


