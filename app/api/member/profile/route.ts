import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, currentPassword, newPassword } = body

    // 驗證目前密碼
    const member = await prisma.member.findUnique({
      where: { id: user.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const isValidPassword = await verifyPassword(currentPassword, member.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '目前密碼錯誤' },
        { status: 400 }
      )
    }

    // 準備更新資料
    const updateData: any = {
      name,
      phone,
      email,
    }

    // 如果有新密碼，則更新
    if (newPassword) {
      updateData.password = await hashPassword(newPassword)
    }

    const updatedMember = await prisma.member.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        account: true,
        name: true,
        phone: true,
        email: true,
      },
    })

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}


