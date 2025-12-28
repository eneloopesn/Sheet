import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { account: { contains: search } },
      ]
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        account: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        planType: true,
        classId1: true,
        classId2: true,
        classId3: true,
        remainingClasses: true,
        planStartDate: true,
        planEndDate: true,
        createdAt: true,
        class1: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
        class2: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
        class3: {
          select: {
            id: true,
            name: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    console.log('POST /api/admin/members - User:', user)
    
    if (!user || user.type !== 'admin') {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('POST /api/admin/members - Body:', { ...body, password: '***' })
    
    const {
      account,
      password,
      name,
      phone,
      email,
      planType,
      classId1,
      classId2,
      classId3,
      remainingClasses,
      planStartDate,
      planEndDate,
    } = body

    if (!account || !password || !name) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const memberData: any = {
      account,
      password: hashedPassword,
      name,
      phone: phone || null,
      email: email || null,
      planType: planType || null,
      classId1: classId1 || null,
      classId2: classId2 || null,
      classId3: classId3 || null,
      remainingClasses: remainingClasses ? parseInt(remainingClasses) : 0,
      planStartDate: planStartDate ? new Date(planStartDate) : null,
      planEndDate: planEndDate ? new Date(planEndDate) : null,
      status: 'active',
    }

    console.log('POST /api/admin/members - MemberData:', { ...memberData, password: '***' })

    const member = await prisma.member.create({
      data: memberData,
    })

    // 更新課程人數：如果選擇了堂課，則該課程人數 +1
    const classUpdates = []
    if (classId1) {
      classUpdates.push(
        prisma.class.update({
          where: { id: classId1 },
          data: { enrolled: { increment: 1 } },
        })
      )
    }
    if (classId2) {
      classUpdates.push(
        prisma.class.update({
          where: { id: classId2 },
          data: { enrolled: { increment: 1 } },
        })
      )
    }
    if (classId3) {
      classUpdates.push(
        prisma.class.update({
          where: { id: classId3 },
          data: { enrolled: { increment: 1 } },
        })
      )
    }
    if (classUpdates.length > 0) {
      await Promise.all(classUpdates)
    }

    console.log('POST /api/admin/members - Created:', member.id)
    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    console.error('Failed to create member:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '帳號已存在' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create member', details: error.code || 'UNKNOWN' },
      { status: 500 }
    )
  }
}


