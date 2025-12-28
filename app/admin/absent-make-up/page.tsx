'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Leave {
  id: string
  classDate: string
  className: string
  instructor?: string
  status: string
  reason?: string
  member: {
    id: string
    name: string
    account: string
    phone: string
  }
}

interface Makeup {
  id: string
  classDate: string
  className: string
  instructor?: string
  status: string
  member: {
    id: string
    name: string
    account: string
    phone: string
  }
}

export default function AdminAbsentMakeupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<'leave' | 'makeup'>('leave')
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [makeups, setMakeups] = useState<Makeup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchData()
    }
  }, [user, authLoading, router, filter, activeTab])

  const fetchData = async () => {
    try {
      if (activeTab === 'leave') {
        const url = filter !== 'all' ? `/api/admin/leaves?status=${filter}` : '/api/admin/leaves'
        const response = await fetch(url)
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()
        setLeaves(data)
      } else {
        const url = filter !== 'all' ? `/api/admin/makeups?status=${filter}` : '/api/admin/makeups'
        const response = await fetch(url)
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()
        setMakeups(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (type: 'leave' | 'makeup', id: string, status: string) => {
    try {
      const endpoint = type === 'leave' ? '/api/admin/leaves' : '/api/admin/makeups'
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        alert('狀態更新成功')
        fetchData()
      } else {
        alert('狀態更新失敗')
      }
    } catch (error) {
      alert('狀態更新失敗，請稍後再試')
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">請假/補課審核</h1>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center">
              <nav className="flex -mb-px">
                <button
                  onClick={() => {
                    setActiveTab('leave')
                    setLoading(true)
                  }}
                  className={`py-4 px-6 text-center border-b-2 font-medium ${
                    activeTab === 'leave'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  請假管理
                </button>
                <button
                  onClick={() => {
                    setActiveTab('makeup')
                    setLoading(true)
                  }}
                  className={`py-4 px-6 text-center border-b-2 font-medium ${
                    activeTab === 'makeup'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  補課管理
                </button>
              </nav>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setLoading(true)
                }}
                className="mr-6 px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">全部</option>
                <option value="pending">待審核</option>
                <option value="approved">已核准</option>
                <option value="rejected">已拒絕</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'leave' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">會員</th>
                      <th className="border p-2 text-left">日期</th>
                      <th className="border p-2 text-left">課程</th>
                      <th className="border p-2 text-left">狀態</th>
                      <th className="border p-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center">載入中...</td>
                      </tr>
                    ) : leaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center text-gray-400">
                          尚無請假紀錄
                        </td>
                      </tr>
                    ) : (
                      leaves.map((leave) => (
                        <tr key={leave.id}>
                          <td className="border p-2">
                            <div>
                              <div className="font-medium">{leave.member.name}</div>
                              <div className="text-sm text-gray-500">{leave.member.phone}</div>
                            </div>
                          </td>
                          <td className="border p-2">
                            {format(new Date(leave.classDate), 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="border p-2">{leave.className}</td>
                          <td className="border p-2">{getStatusBadge(leave.status)}</td>
                          <td className="border p-2">
                            <select
                              value={leave.status}
                              onChange={(e) => handleStatusChange('leave', leave.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">待審核</option>
                              <option value="approved">已核准</option>
                              <option value="rejected">已拒絕</option>
                              <option value="cancelled">已取消</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'makeup' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">會員</th>
                      <th className="border p-2 text-left">日期</th>
                      <th className="border p-2 text-left">課程</th>
                      <th className="border p-2 text-left">狀態</th>
                      <th className="border p-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center">載入中...</td>
                      </tr>
                    ) : makeups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center text-gray-400">
                          尚無補課紀錄
                        </td>
                      </tr>
                    ) : (
                      makeups.map((makeup) => (
                        <tr key={makeup.id}>
                          <td className="border p-2">
                            <div>
                              <div className="font-medium">{makeup.member.name}</div>
                              <div className="text-sm text-gray-500">{makeup.member.phone}</div>
                            </div>
                          </td>
                          <td className="border p-2">
                            {format(new Date(makeup.classDate), 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="border p-2">{makeup.className}</td>
                          <td className="border p-2">{getStatusBadge(makeup.status)}</td>
                          <td className="border p-2">
                            <select
                              value={makeup.status}
                              onChange={(e) => handleStatusChange('makeup', makeup.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">待審核</option>
                              <option value="approved">已核准</option>
                              <option value="rejected">已拒絕</option>
                              <option value="cancelled">已取消</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


