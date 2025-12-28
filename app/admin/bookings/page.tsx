'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Booking {
  id: string
  name: string
  phone: string
  email?: string
  classDate: string
  className?: string
  notes?: string
  status: string
  createdAt: string
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchBookings()
    }
  }, [user, authLoading, router, filter])

  const fetchBookings = async () => {
    try {
      const url = filter !== 'all' ? `/api/bookings?status=${filter}` : '/api/bookings'
      const response = await fetch(url)
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        alert('狀態更新成功')
        fetchBookings()
      } else {
        alert('狀態更新失敗')
      }
    } catch (error) {
      alert('狀態更新失敗，請稍後再試')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">預約管理</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">全部</option>
            <option value="pending">待處理</option>
            <option value="confirmed">已確認</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">姓名</th>
                  <th className="border p-2 text-left">電話</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">預約日期</th>
                  <th className="border p-2 text-left">課程</th>
                  <th className="border p-2 text-left">狀態</th>
                  <th className="border p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border p-4 text-center">載入中...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border p-4 text-center text-gray-400">尚無預約資料</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="border p-2">{booking.name}</td>
                      <td className="border p-2">{booking.phone}</td>
                      <td className="border p-2">{booking.email || '-'}</td>
                      <td className="border p-2">
                        {format(new Date(booking.classDate), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="border p-2">{booking.className || '-'}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status === 'pending' ? '待處理' :
                           booking.status === 'confirmed' ? '已確認' : '已取消'}
                        </span>
                      </td>
                      <td className="border p-2">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">待處理</option>
                          <option value="confirmed">已確認</option>
                          <option value="cancelled">已取消</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


