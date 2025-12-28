import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '瑜珈教室 - 專業瑜珈課程',
  description: '提供專業瑜珈課程，會員專屬服務，請假補課管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center px-4 py-2 text-xl font-bold text-gray-800">
                  伽苑
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                    首頁
                  </Link>
                  <Link href="/schedule" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                    上課時間表
                  </Link>
                  <Link href="/trial-booking" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                    預約體驗
                  </Link>
                  <Link href="/contact" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                    聯絡方式
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/member/login" className="text-sm text-gray-700 hover:text-gray-900">
                  會員登入
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="bg-gray-800 text-white mt-12">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <p className="text-center">© 2025 伽苑瑜珈. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}


