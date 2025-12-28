'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useMemberAuth } from '@/hooks/useAuth'
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

interface MemberClass {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
  type: string
  isRecurring: boolean
  recurringPattern?: string
  recurringEndDate?: string
}

interface Week {
  index: number
  startDate: string
  endDate: string
  label: string
}

interface WeekClass {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
  availableSlots: number
}

interface LeaveForm {
  classId: string
  classDate: string
  reason?: string
}

interface MakeupForm {
  classId: string
  leaveId?: string
  classDate: string
}

export default function AbsentMakeupPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useMemberAuth()
  const [activeTab, setActiveTab] = useState<'leave' | 'makeup'>('leave')
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [makeups, setMakeups] = useState<Makeup[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // 請假相關狀態
  const [memberClasses, setMemberClasses] = useState<MemberClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  
  // 補課相關狀態
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<string>('')
  const [weekClasses, setWeekClasses] = useState<WeekClass[]>([])

  const leaveForm = useForm<LeaveForm>()
  const makeupForm = useForm<MakeupForm>()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/member/login')
      return
    }
    if (user) {
      fetchData()
      fetchMemberClasses()
      fetchWeeks()
    }
  }, [user, authLoading, router])

  // 當選擇課程時，獲取可請假的日期
  useEffect(() => {
    if (selectedClassId) {
      fetchClassDates(selectedClassId)
    } else {
      setAvailableDates([])
    }
  }, [selectedClassId])

  // 當選擇週時，獲取當週可補課的課程
  useEffect(() => {
    if (selectedWeekIndex !== '') {
      fetchWeekClasses(selectedWeekIndex)
    } else {
      setWeekClasses([])
    }
  }, [selectedWeekIndex])

  const fetchData = async () => {
    try {
      const [leavesRes, makeupsRes] = await Promise.all([
        fetch('/api/member/leaves'),
        fetch('/api/member/makeups'),
      ])

      if (leavesRes.status === 401 || makeupsRes.status === 401) {
        router.push('/member/login')
        return
      }

      const leavesData = await leavesRes.json()
      const makeupsData = await makeupsRes.json()

      setLeaves(leavesData)
      setMakeups(makeupsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberClasses = async () => {
    try {
      const response = await fetch('/api/member/my-classes')
      if (response.ok) {
        const data = await response.json()
        setMemberClasses(data)
      }
    } catch (error) {
      console.error('Failed to fetch member classes:', error)
    }
  }

  const fetchClassDates = async (classId: string) => {
    try {
      const response = await fetch(`/api/member/class-dates?classId=${classId}&limit=20`)
      if (response.ok) {
        const dates = await response.json()
        setAvailableDates(dates)
      }
    } catch (error) {
      console.error('Failed to fetch class dates:', error)
      setAvailableDates([])
    }
  }

  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/member/week-classes')
      if (response.ok) {
        const data = await response.json()
        setWeeks(data)
      }
    } catch (error) {
      console.error('Failed to fetch weeks:', error)
    }
  }

  const fetchWeekClasses = async (weekIndex: string) => {
    try {
      const response = await fetch(`/api/member/week-classes?weekIndex=${weekIndex}`)
      if (response.ok) {
        const classes = await response.json()
        setWeekClasses(classes)
      }
    } catch (error) {
      console.error('Failed to fetch week classes:', error)
      setWeekClasses([])
    }
  }

  const onSubmitLeave = async (data: LeaveForm) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/member/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: data.classId,
          classDate: data.classDate,
          reason: data.reason,
        }),
      })

      if (response.ok) {
        alert('請假申請成功！')
        leaveForm.reset()
        setSelectedClassId('')
        setAvailableDates([])
        fetchData()
      } else {
        const result = await response.json()
        alert(result.error || '申請失敗')
      }
    } catch (error) {
      alert('申請失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitMakeup = async (data: MakeupForm) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/member/makeups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: data.classId,
          leaveId: data.leaveId,
          classDate: data.classDate,
        }),
      })

      if (response.ok) {
        alert('補課申請成功！')
        makeupForm.reset()
        setSelectedWeekIndex('')
        setWeekClasses([])
        fetchData()
      } else {
        const result = await response.json()
        alert(result.error || '申請失敗')
      }
    } catch (error) {
      alert('申請失敗，請稍後再試')
    } finally {
      setSubmitting(false)
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
        fetchData()
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
        fetchData()
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

  const availableLeaves = leaves.filter(l => l.status === 'approved')

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
        <h1 className="text-3xl font-bold mb-6">請假/補課管理</h1>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('leave')}
                className={`py-4 px-6 text-center border-b-2 font-medium ${
                  activeTab === 'leave'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                請假申請
              </button>
              <button
                onClick={() => setActiveTab('makeup')}
                className={`py-4 px-6 text-center border-b-2 font-medium ${
                  activeTab === 'makeup'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                補課申請
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'leave' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">申請請假</h2>
                  <form onSubmit={leaveForm.handleSubmit(onSubmitLeave)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          選擇課程 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => {
                            setSelectedClassId(e.target.value)
                            leaveForm.setValue('classId', e.target.value)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="">請選擇課程</option>
                          {memberClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.type} - {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          請假日期 <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...leaveForm.register('classDate', { required: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          disabled={!selectedClassId || availableDates.length === 0}
                        >
                          <option value="">{selectedClassId && availableDates.length === 0 ? '載入中...' : '請選擇日期'}</option>
                          {availableDates.map((date) => (
                            <option key={date} value={date}>
                              {format(new Date(date), 'yyyy-MM-dd HH:mm')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          原因（選填）
                        </label>
                        <input
                          {...leaveForm.register('reason')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="請輸入請假原因"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !selectedClassId}
                      className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      {submitting ? '提交中...' : '提交申請'}
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">請假紀錄</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
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
                                    className="text-red-600 hover:text-red-800"
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
            )}

            {activeTab === 'makeup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">申請補課</h2>
                  {availableLeaves.length === 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ 需先請假才能補課，請先申請並等待請假核准後再申請補課。
                      </p>
                    </div>
                  )}
                  <form onSubmit={makeupForm.handleSubmit(onSubmitMakeup)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          選擇週 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedWeekIndex}
                          onChange={(e) => {
                            setSelectedWeekIndex(e.target.value)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="">請選擇週</option>
                          {weeks.map((week) => (
                            <option key={week.index} value={week.index.toString()}>
                              {week.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          關聯請假（選填）
                        </label>
                        <select
                          {...makeupForm.register('leaveId')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">無</option>
                          {availableLeaves.map((leave) => (
                            <option key={leave.id} value={leave.id}>
                              {format(new Date(leave.classDate), 'yyyy-MM-dd')} - {leave.className}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {selectedWeekIndex !== '' && weekClasses.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          選擇補課課程 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {weekClasses.map((cls) => {
                            // 處理週期性課程的 ID（可能是 classId_date 格式）
                            const actualClassId = cls.id.includes('_') ? cls.id.split('_')[0] : cls.id
                            return (
                            <div
                              key={cls.id}
                              className={`border rounded-md p-3 cursor-pointer ${
                                makeupForm.watch('classId') === actualClassId
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-300 hover:border-purple-300'
                              }`}
                              onClick={() => {
                                makeupForm.setValue('classId', actualClassId)
                                makeupForm.setValue('classDate', cls.date)
                              }}
                            >
                              <div className="font-medium">{cls.name}</div>
                              <div className="text-sm text-gray-600">
                                {format(new Date(cls.date), 'yyyy-MM-dd')} {cls.startTime}
                              </div>
                              <div className="text-sm text-gray-500">
                                教練：{cls.instructor} | 剩餘名額：{cls.availableSlots}
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedWeekIndex !== '' && weekClasses.length === 0 && (
                      <div className="text-center text-gray-400 py-4">
                        該週無可補課的課程
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !makeupForm.watch('classId') || availableLeaves.length === 0}
                      className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      {submitting ? '提交中...' : '提交申請'}
                    </button>
                    {availableLeaves.length === 0 && (
                      <p className="text-sm text-gray-500">
                        請先申請請假並等待核准後才能申請補課
                      </p>
                    )}
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">補課紀錄</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
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
                                    className="text-red-600 hover:text-red-800"
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
            )}
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


