'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Stats {
  totalMembers: number
  totalClasses: number
  pendingBookings: number
  pendingLeaves: number
  pendingMakeups: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchDashboard()
    }
  }, [user, authLoading, router])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">管理中心</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            登出
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">總會員數</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalMembers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">總課程數</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalClasses || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">待處理預約</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingBookings || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">待審核請假</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.pendingLeaves || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">待審核補課</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.pendingMakeups || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/members"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">會員管理</h2>
            <p className="text-gray-600">新增、修改、刪除會員資料</p>
          </Link>
          <Link
            href="/admin/schedule"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">課程/課表管理</h2>
            <p className="text-gray-600">管理課程內容、時間、教練</p>
          </Link>
          <Link
            href="/admin/bookings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">預約管理</h2>
            <p className="text-gray-600">管理體驗預約申請</p>
          </Link>
          <Link
            href="/admin/absent-make-up"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">請假/補課審核</h2>
            <p className="text-gray-600">查詢、修改會員請假/補課紀錄</p>
          </Link>
          <Link
            href="/admin/admins"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">管理者管理</h2>
            <p className="text-gray-600">新增、修改管理者帳號</p>
          </Link>
          <Link
            href="/admin/weekly-attendance"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">每週上課學員</h2>
            <p className="text-gray-600">查看每週各班的上課學員列表</p>
          </Link>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


