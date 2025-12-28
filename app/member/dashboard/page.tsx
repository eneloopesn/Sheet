'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { useMemberAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface MemberInfo {
  id: string
  account: string
  name: string
  phone: string
  email?: string
  status: string
  planType?: string
  remainingClasses: number
  planStartDate?: string
  planEndDate?: string
  classId1?: string | null
  classId2?: string | null
  classId3?: string | null
  class1?: Class | null
  class2?: Class | null
  class3?: Class | null
}

interface Class {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
}

interface Stats {
  upcomingLeaves: number
  upcomingMakeups: number
}

export default function MemberDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useMemberAuth()
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/member/login')
      return
    }
    if (user) {
      fetchDashboard()
    }
  }, [user, authLoading, router])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/member/dashboard')
      if (response.status === 401) {
        router.push('/member/login')
        return
      }
      const data = await response.json()
      setMember(data.member)
      setStats(data.stats)
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
          <h1 className="text-3xl font-bold">會員中心</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            登出
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">會員資訊</h2>
            <div className="space-y-2">
              <p><span className="font-medium">姓名：</span>{member?.name}</p>
              <p><span className="font-medium">帳號：</span>{member?.account}</p>
              <p><span className="font-medium">電話：</span>{member?.phone}</p>
              {member?.email && (
                <p><span className="font-medium">Email：</span>{member.email}</p>
              )}
              <p><span className="font-medium">狀態：</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  member?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {member?.status === 'active' ? '啟用' : '停用'}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">方案資訊</h2>
            <div className="space-y-2">
              <p><span className="font-medium">方案類型：</span>
                {(() => {
                  const classTimes = []
                  if (member?.class1) {
                    classTimes.push(
                      `${member.class1.name} - ${format(new Date(member.class1.date), 'yyyy-MM-dd')} ${member.class1.startTime}`
                    )
                  }
                  if (member?.class2) {
                    classTimes.push(
                      `${member.class2.name} - ${format(new Date(member.class2.date), 'yyyy-MM-dd')} ${member.class2.startTime}`
                    )
                  }
                  if (member?.class3) {
                    classTimes.push(
                      `${member.class3.name} - ${format(new Date(member.class3.date), 'yyyy-MM-dd')} ${member.class3.startTime}`
                    )
                  }
                  return classTimes.length > 0 ? classTimes.join(' / ') : '未設定'
                })()}
              </p>
              <p><span className="font-medium">剩餘堂數：</span>
                <span className="text-2xl font-bold text-purple-600 ml-2">
                  {member?.remainingClasses || 0}
                </span>
              </p>
              {member?.planStartDate && (
                <p><span className="font-medium">開始日期：</span>
                  {new Date(member.planStartDate).toLocaleDateString('zh-TW')}
                </p>
              )}
              {member?.planEndDate && (
                <p><span className="font-medium">結束日期：</span>
                  {new Date(member.planEndDate).toLocaleDateString('zh-TW')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">快速功能</h2>
            <div className="space-y-3">
              <Link
                href="/member/absent-make-up"
                className="block w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 text-center"
              >
                請假/補課管理
              </Link>
              <Link
                href="/member/records"
                className="block w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 text-center"
              >
                查詢紀錄
              </Link>
              <Link
                href="/member/profile"
                className="block w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 text-center"
              >
                個人資料設定
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">統計資訊</h2>
            <div className="space-y-2">
              <p><span className="font-medium">待處理請假：</span>{stats?.upcomingLeaves || 0} 筆</p>
              <p><span className="font-medium">待處理補課：</span>{stats?.upcomingMakeups || 0} 筆</p>
            </div>
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


