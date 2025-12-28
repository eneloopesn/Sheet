'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useMemberAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Class {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
  capacity: number
  enrolled: number
  status: string
}

export default function SchedulePage() {
  const { user } = useMemberAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [hasApprovedLeave, setHasApprovedLeave] = useState(false)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // 週一開始
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    fetchClasses()
    if (user) {
      checkApprovedLeaves()
    }
  }, [currentWeek, user])

  const fetchClasses = async () => {
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')
      const response = await fetch(`/api/classes?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()
      // 確保 data 是數組
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const checkApprovedLeaves = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/member/leaves')
      if (response.ok) {
        const leaves = await response.json()
        const hasApproved = leaves.some((leave: any) => leave.status === 'approved')
        setHasApprovedLeave(hasApproved)
      }
    } catch (error) {
      console.error('Failed to check approved leaves:', error)
    }
  }

  const getClassesForDay = (date: Date) => {
    if (!Array.isArray(classes)) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return classes.filter(c => {
      if (!c || !c.date) return false
      const classDate = format(parseISO(c.date), 'yyyy-MM-dd')
      return classDate === dateStr
    })
  }

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const handleEnroll = async (classItem: Class) => {
    if (!user) {
      alert('請先登入會員')
      return
    }

    // 檢查是否有已核准的請假紀錄
    if (!hasApprovedLeave) {
      alert('需先申請請假並等待核准後才能申請補課')
      return
    }

    // 處理週期性課程的 ID（可能是 classId_date 格式）
    const actualClassId = classItem.id.includes('_') ? classItem.id.split('_')[0] : classItem.id
    
    // 構建完整的課程日期時間
    let classDate: Date
    if (typeof classItem.date === 'string') {
      classDate = parseISO(classItem.date)
    } else {
      classDate = new Date(classItem.date)
    }
    const [startHour, startMinute] = classItem.startTime.split(':').map(Number)
    classDate.setHours(startHour, startMinute, 0, 0)

    if (!confirm('確定要申請補課此課程嗎？')) {
      return
    }

    setEnrolling(classItem.id)
    try {
      const response = await fetch('/api/member/makeups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: actualClassId,
          classDate: classDate.toISOString(),
          className: classItem.name,
          instructor: classItem.instructor,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('補課申請成功！')
        fetchClasses() // 重新載入課程列表
        checkApprovedLeaves() // 重新檢查請假狀態
      } else {
        alert(result.error || '補課申請失敗')
      }
    } catch (error) {
      alert('補課申請失敗，請稍後再試')
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">上課時間表</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={goToPreviousWeek}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              上週
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(weekStart, 'yyyy年MM月dd日')} - {format(addDays(weekStart, 6), 'yyyy年MM月dd日')}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-purple-600 hover:underline mt-1"
              >
                回到本週
              </button>
            </div>
            <button
              onClick={goToNextWeek}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              下週
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">日期</th>
                    <th className="border p-2 text-left">時間</th>
                    <th className="border p-2 text-left">課程名稱</th>
                    <th className="border p-2 text-left">教練</th>
                    <th className="border p-2 text-left">教室</th>
                    <th className="border p-2 text-left">狀態</th>
                    {user && <th className="border p-2 text-left">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {weekDays.map((day) => {
                    const dayClasses = getClassesForDay(day)
                    if (dayClasses.length === 0) {
                      return (
                        <tr key={format(day, 'yyyy-MM-dd')}>
                          <td className="border p-2 font-semibold">
                            {format(day, 'MM/dd (E)')}
                          </td>
                          <td colSpan={5} className="border p-2 text-gray-400 text-center">
                            無課程
                          </td>
                        </tr>
                      )
                    }
                    return dayClasses.map((classItem, idx) => (
                      <tr key={classItem.id}>
                        {idx === 0 && (
                          <td
                            rowSpan={dayClasses.length}
                            className="border p-2 font-semibold align-top"
                          >
                            {format(day, 'MM/dd (E)', { locale: zhTW })}
                          </td>
                        )}
                        <td className="border p-2">
                          {classItem.startTime} - {classItem.endTime}
                        </td>
                        <td className="border p-2">{classItem.name}</td>
                        <td className="border p-2">{classItem.instructor}</td>
                        <td className="border p-2">{classItem.room || 'A教室'}</td>
                        <td className="border p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              classItem.status === 'full' || classItem.enrolled === classItem.capacity
                                ? 'bg-red-100 text-red-800'
                                : classItem.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {classItem.status === 'full' || classItem.enrolled === classItem.capacity
                              ? '不可預約'
                              : classItem.status === 'active'
                              ? `可預約 (${classItem.enrolled}/${classItem.capacity})`
                              : '已取消'}
                          </span>
                        </td>
                        {user && (
                          <td className="border p-2">
                            {classItem.status === 'active' && classItem.enrolled < classItem.capacity && (
                              <button
                                onClick={() => handleEnroll(classItem)}
                                disabled={enrolling === classItem.id || !hasApprovedLeave}
                                className={`px-3 py-1 rounded text-sm ${
                                  hasApprovedLeave
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={!hasApprovedLeave ? '需先申請請假並等待核准後才能申請補課' : ''}
                              >
                                {enrolling === classItem.id ? '申請中...' : '可預約'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <BackButton />
    </div>
  )
}

