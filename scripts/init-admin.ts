// 初始化管理員帳號的腳本
// 執行方式: npx ts-node scripts/init-admin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'admin'
  const password = 'admin234'
  const name = '系統管理員'
  const email = 'admin@yoga-studio.com'

  // 檢查是否已存在管理員
  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  })

  // 加密密碼
  const hashedPassword = await bcrypt.hash(password, 10)

  if (existingAdmin) {
    // 更新現有管理員的密碼
    const admin = await prisma.admin.update({
      where: { username },
      data: {
        password: hashedPassword,
        name,
        email,
      },
    })
    console.log(`管理員帳號更新成功！`)
    console.log(`帳號: ${admin.username}`)
    console.log(`密碼: ${password}`)
  } else {
    // 建立新管理員
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
      },
    })
    console.log(`管理員帳號建立成功！`)
    console.log(`帳號: ${admin.username}`)
    console.log(`密碼: ${password}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


