import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 防止刪除自己
    if (user.id === params.id) {
      return NextResponse.json(
        { error: '無法刪除自己的帳號' },
        { status: 400 }
      )
    }

    await prisma.admin.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: '管理者已刪除' })
  } catch (error: any) {
    console.error('Failed to delete admin:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete admin' },
      { status: 500 }
    )
  }
}

