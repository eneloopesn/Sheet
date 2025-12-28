import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hashPassword } from '@/lib/auth'
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
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: '請輸入新密碼' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    await prisma.admin.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: '密碼修改成功' })
  } catch (error) {
    console.error('Failed to update password:', error)
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    )
  }
}

