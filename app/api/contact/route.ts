import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let contact = await prisma.contact.findFirst()

    // 如果沒有資料，建立預設資料
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          studioName: '伽苑瑜伽律動生活館',
          address: '基隆市仁愛區仁二路253號3樓',
          businessHours: '週一至週五：09:00 - 21:00\n星期二、12:00–15:00、17:30–22:00',
          mapUrl: 'https://www.google.com/maps/place/%E4%BC%BD%E8%8B%91%E7%91%9C%E4%BC%BD%E5%BE%8B%E5%8B%95%E7%94%9F%E6%B4%BB%E9%A4%A8/@25.1299047,121.742822,17z/data=!4m6!3m5!1s0x345d4f562b30b4b7:0x478a38022a6b8af4!8m2!3d25.129668!4d121.742671!16s%2Fg%2F11shn2jxjm?authuser=0&entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D',
          facebookUrl: 'https://www.facebook.com/gayuanyogakeelung?locale=zh_TW',
          instagramUrl: 'https://www.instagram.com/gayuan_yoga_keelung/?fbclid=IwY2xjawOiEbtleHRuA2FlbQIxMABicmlkETFzcmdvNDlON3h5bFA4bHQ3c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHlCLMaP8UMzuRp-j_hSKFljClkfMyePbc1YeM_COFwq9sLZoAb7y6ZTyLydW_aem_HNigxKCr8I2JjNwjLCgkQQ#',
        } as any,
      })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to fetch contact info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioName, address, phone, email, businessHours, parkingInfo, mapUrl, facebookUrl, instagramUrl } = body

    // 檢查是否已有資料，如果有則更新，否則建立
    let contact = await prisma.contact.findFirst()

    if (contact) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          studioName,
          address,
          //phone,
          //email,
          //businessHours,
          //parkingInfo,
          mapUrl,
          facebookUrl,
          instagramUrl,
        } as any,
      })
    } else {
      contact = await prisma.contact.create({
        data: {
          studioName,
          address,
          //phone,
          //email,
          //businessHours,
          //parkingInfo,
          mapUrl,
          facebookUrl,
          instagramUrl,
        } as any,
      })
    }

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.error('Failed to update contact info:', error)
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    )
  }
}


