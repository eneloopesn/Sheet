'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import BackButton from '@/components/BackButton'

interface Leave {
  id: string
  classDate: string
  className: string
  instructor?: string
  status: string
  reason?: string
}

interface Makeup {
  id: string
  classDate: string
  className: string
  instructor?: string
  status: string
  leaveId?: string
}

interface MemberInfo {
  remainingClasses: number
  planType?: string
  planStartDate?: string
  planEndDate?: string
}

export default function RecordsPage() {
  const router = useRouter()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [makeups, setMakeups] = useState<Makeup[]>([])
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/member/records')
      if (response.status === 401) {
        router.push('/member/login')
        return
      }
      const data = await response.json()
      setLeaves(data.leaves)
      setMakeups(data.makeups)
      setMemberInfo(data.memberInfo)
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLeave = async (id: string) => {
    if (!confirm('確定要取消此請假申請嗎？')) return

    try {
      const response = await fetch(`/api/member/leaves/${id}/cancel`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('取消成功')
        fetchRecords()
      } else {
        const result = await response.json()
        alert(result.error || '取消失敗')
      }
    } catch (error) {
      alert('取消失敗，請稍後再試')
    }
  }

  const handleCancelMakeup = async (id: string) => {
    if (!confirm('確定要取消此補課申請嗎？')) return

    try {
      const response = await fetch(`/api/member/makeups/${id}/cancel`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('取消成功')
        fetchRecords()
      } else {
        const result = await response.json()
        alert(result.error || '取消失敗')
      }
    } catch (error) {
      alert('取消失敗，請稍後再試')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      pending: '待審核',
      approved: '已核准',
      rejected: '已拒絕',
      cancelled: '已取消',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
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
        <h1 className="text-3xl font-bold mb-6">查詢紀錄</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">剩餘堂數</h2>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {memberInfo?.remainingClasses || 0}
              </div>
              <p className="text-gray-600">堂</p>
              {memberInfo?.planType && (
                <p className="text-sm text-gray-500 mt-2">方案：{memberInfo.planType}</p>
              )}
              {memberInfo?.planEndDate && (
                <p className="text-sm text-gray-500">
                  效期至：{new Date(memberInfo.planEndDate).toLocaleDateString('zh-TW')}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">統計資訊</h2>
            <div className="space-y-2">
              <p><span className="font-medium">請假紀錄：</span>{leaves.length} 筆</p>
              <p><span className="font-medium">補課紀錄：</span>{makeups.length} 筆</p>
              <p><span className="font-medium">待審核請假：</span>
                {leaves.filter(l => l.status === 'pending').length} 筆
              </p>
              <p><span className="font-medium">待審核補課：</span>
                {makeups.filter(m => m.status === 'pending').length} 筆
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">請假紀錄</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">日期</th>
                    <th className="border p-2 text-left">課程</th>
                    <th className="border p-2 text-left">狀態</th>
                    <th className="border p-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border p-4 text-center text-gray-400">
                        尚無請假紀錄
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="border p-2">
                          {format(new Date(leave.classDate), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="border p-2">{leave.className}</td>
                        <td className="border p-2">{getStatusBadge(leave.status)}</td>
                        <td className="border p-2">
                          {leave.status === 'pending' || leave.status === 'approved' ? (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              取消
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">補課紀錄</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">日期</th>
                    <th className="border p-2 text-left">課程</th>
                    <th className="border p-2 text-left">狀態</th>
                    <th className="border p-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {makeups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border p-4 text-center text-gray-400">
                        尚無補課紀錄
                      </td>
                    </tr>
                  ) : (
                    makeups.map((makeup) => (
                      <tr key={makeup.id}>
                        <td className="border p-2">
                          {format(new Date(makeup.classDate), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="border p-2">{makeup.className}</td>
                        <td className="border p-2">{getStatusBadge(makeup.status)}</td>
                        <td className="border p-2">
                          {makeup.status === 'pending' || makeup.status === 'approved' ? (
                            <button
                              onClick={() => handleCancelMakeup(makeup.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              取消
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


