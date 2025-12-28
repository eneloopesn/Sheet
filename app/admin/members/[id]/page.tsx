'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'

interface MemberDetail {
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
  leaves: Leave[]
  makeups: Makeup[]
  class1?: Class | null
  class2?: Class | null
  class3?: Class | null
}

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

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMember()
    }
  }, [params.id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/admin/members/${params.id}`)
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setMember(data)
      }
    } catch (error) {
      console.error('Failed to fetch member:', error)
    } finally {
      setLoading(false)
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

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">找不到會員資料</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← 返回
          </button>
          <h1 className="text-3xl font-bold">會員詳細資料</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">基本資料</h2>
            <div className="space-y-2">
              <p><span className="font-medium">帳號：</span>{member.account}</p>
              <p><span className="font-medium">姓名：</span>{member.name}</p>
              <p><span className="font-medium">電話：</span>{member.phone}</p>
              {member.email && <p><span className="font-medium">Email：</span>{member.email}</p>}
              <p><span className="font-medium">狀態：</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {member.status === 'active' ? '啟用' : '停用'}
                </span>
              </p>
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-3">QR Code</h3>
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={`/api/admin/members/${member.id}/qrcode`}
                    alt="QR Code"
                    className="border border-gray-300 rounded-lg"
                    style={{ maxWidth: '250px', height: 'auto' }}
                  />
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/admin/members/${member.id}/qrcode`)
                        if (response.ok) {
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `qrcode-${member.account}-${member.name}.png`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } else {
                          alert('下載失敗')
                        }
                      } catch (error) {
                        console.error('Failed to download QR code:', error)
                        alert('下載失敗')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    下載 QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">方案資訊</h2>
            <div className="space-y-2">
              <p><span className="font-medium">方案類型：</span>
                {(() => {
                  const classTimes = []
                  if (member.class1) {
                    classTimes.push(
                      `${member.class1.name} - ${format(new Date(member.class1.date), 'yyyy-MM-dd')} ${member.class1.startTime}`
                    )
                  }
                  if (member.class2) {
                    classTimes.push(
                      `${member.class2.name} - ${format(new Date(member.class2.date), 'yyyy-MM-dd')} ${member.class2.startTime}`
                    )
                  }
                  if (member.class3) {
                    classTimes.push(
                      `${member.class3.name} - ${format(new Date(member.class3.date), 'yyyy-MM-dd')} ${member.class3.startTime}`
                    )
                  }
                  return classTimes.length > 0 ? classTimes.join(' / ') : '未設定'
                })()}
              </p>
              <p><span className="font-medium">剩餘堂數：</span>{member.remainingClasses}</p>
              {member.planStartDate && (
                <p><span className="font-medium">開始日期：</span>
                  {new Date(member.planStartDate).toLocaleDateString('zh-TW')}
                </p>
              )}
              {member.planEndDate && (
                <p><span className="font-medium">結束日期：</span>
                  {new Date(member.planEndDate).toLocaleDateString('zh-TW')}
                </p>
              )}
              <div className="mt-4 pt-4 border-t">
                <p className="font-medium mb-2">固定課程：</p>
                {member.class1 && (
                  <p className="text-sm text-gray-600 ml-4">
                    第一堂：{member.class1.name} - {member.class1.instructor} 
                    ({format(new Date(member.class1.date), 'yyyy-MM-dd')} {member.class1.startTime})
                  </p>
                )}
                {member.class2 && (
                  <p className="text-sm text-gray-600 ml-4">
                    第二堂：{member.class2.name} - {member.class2.instructor} 
                    ({format(new Date(member.class2.date), 'yyyy-MM-dd')} {member.class2.startTime})
                  </p>
                )}
                {member.class3 && (
                  <p className="text-sm text-gray-600 ml-4">
                    第三堂：{member.class3.name} - {member.class3.instructor} 
                    ({format(new Date(member.class3.date), 'yyyy-MM-dd')} {member.class3.startTime})
                  </p>
                )}
                {!member.class1 && !member.class2 && !member.class3 && (
                  <p className="text-sm text-gray-400 ml-4">未設定固定課程</p>
                )}
              </div>
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
                  </tr>
                </thead>
                <tbody>
                  {member.leaves.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border p-4 text-center text-gray-400">
                        尚無請假紀錄
                      </td>
                    </tr>
                  ) : (
                    member.leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="border p-2">
                          {format(new Date(leave.classDate), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="border p-2">{leave.className}</td>
                        <td className="border p-2">{getStatusBadge(leave.status)}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {member.makeups.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border p-4 text-center text-gray-400">
                        尚無補課紀錄
                      </td>
                    </tr>
                  ) : (
                    member.makeups.map((makeup) => (
                      <tr key={makeup.id}>
                        <td className="border p-2">
                          {format(new Date(makeup.classDate), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="border p-2">{makeup.className}</td>
                        <td className="border p-2">{getStatusBadge(makeup.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


