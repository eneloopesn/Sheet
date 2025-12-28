import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username, password, name, email } = body

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      )
    }

    // 檢查帳號是否已存在
    const existing = await prisma.admin.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { error: '帳號已存在' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({ success: true, admin })
  } catch (error) {
    console.error('Failed to create admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}

