import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const account = searchParams.get('account')

    if (!account) {
      return NextResponse.json(
        { error: '請提供會員帳號' },
        { status: 400 }
      )
    }

    const member = await prisma.member.findUnique({
      where: { account },
      select: {
        id: true,
        account: true,
        name: true,
        phone: true,
        remainingClasses: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: '找不到該會員' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Failed to fetch member by account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account } = await request.json()

    if (!account) {
      return NextResponse.json(
        { error: '請提供會員帳號' },
        { status: 400 }
      )
    }

    // 先查詢會員
    const member = await prisma.member.findUnique({
      where: { account },
      select: {
        id: true,
        name: true,
        remainingClasses: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: '找不到該會員' },
        { status: 404 }
      )
    }

    // 檢查剩餘堂數
    if (member.remainingClasses <= 0) {
      return NextResponse.json(
        { error: '會員剩餘堂數不足，無法簽到' },
        { status: 400 }
      )
    }

    // 減少剩餘堂數
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        remainingClasses: {
          decrement: 1,
        },
      },
      select: {
        id: true,
        name: true,
        remainingClasses: true,
      },
    })

    return NextResponse.json({
      success: true,
      member: {
        name: updatedMember.name,
        remainingClasses: updatedMember.remainingClasses,
      },
    })
  } catch (error) {
    console.error('Failed to check in member:', error)
    return NextResponse.json(
      { error: '簽到失敗' },
      { status: 500 }
    )
  }
}




