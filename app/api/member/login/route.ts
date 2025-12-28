import { NextRequest, NextResponse } from 'next/server'
import { authenticateMember, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { account, password } = await request.json()

    if (!account || !password) {
      return NextResponse.json(
        { error: '請輸入帳號和密碼' },
        { status: 400 }
      )
    }

    const user = await authenticateMember(account, password)

    if (!user) {
      return NextResponse.json(
        { error: '帳號或密碼錯誤' },
        { status: 401 }
      )
    }

    const token = generateToken(user)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        account: user.account,
        type: user.type,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登入失敗' },
      { status: 500 }
    )
  }
}


