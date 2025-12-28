'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, addDays, addWeeks, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Member {
  id: string
  name: string
  phone?: string
  account: string
  types: string[]
}

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
  allMembers: Member[]
}

interface WeeklyAttendance {
  weekStart: string
  weekEnd: string
  classes: Class[]
}

export default function WeeklyAttendancePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [attendance, setAttendance] = useState<WeeklyAttendance | null>(null)
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchAttendance()
    }
  }, [user, authLoading, router, currentWeek])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')
      const response = await fetch(`/api/admin/weekly-attendance?weekStart=${weekStartStr}`)
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      setAttendance(data)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, -1))
  }

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getClassesForDay = (date: Date) => {
    if (!attendance) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendance.classes.filter(c => {
      const classDate = format(parseISO(c.date), 'yyyy-MM-dd')
      return classDate === dateStr
    })
  }

  const getMemberTypeLabel = (types: string[]) => {
    const labels: { [key: string]: string } = {
      enrollment: '報名',
      makeup: '補課',
      regular: '固定課程',
    }
    return types.map(t => labels[t] || t).join('、')
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
        <h1 className="text-3xl font-bold mb-6">每週上課學員列表</h1>

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

          <div className="space-y-6">
            {weekDays.map((day) => {
              const dayClasses = getClassesForDay(day)
              if (dayClasses.length === 0) {
                return (
                  <div key={format(day, 'yyyy-MM-dd')} className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {format(day, 'MM/dd (E)', { locale: zhTW })}
                    </h3>
                    <p className="text-gray-400">無課程</p>
                  </div>
                )
              }
              return (
                <div key={format(day, 'yyyy-MM-dd')} className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3">
                    {format(day, 'MM/dd (E)', { locale: zhTW })}
                  </h3>
                  {dayClasses.map((classItem) => (
                    <div key={classItem.id} className="mb-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{classItem.name}</h4>
                          <p className="text-sm text-gray-600">
                            {classItem.startTime} - {classItem.endTime} | {classItem.instructor} | {classItem.room || 'A教室'}
                          </p>
                          <p className="text-sm text-gray-500">
                            學員數：{classItem.allMembers.length} / {classItem.capacity}
                          </p>
                        </div>
                      </div>
                      {classItem.allMembers.length > 0 ? (
                        <div className="mt-3">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-200">
                                <th className="border p-2 text-left">姓名</th>
                                <th className="border p-2 text-left">帳號</th>
                                <th className="border p-2 text-left">電話</th>
                                <th className="border p-2 text-left">報名方式</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classItem.allMembers.map((member) => (
                                <tr key={member.id}>
                                  <td className="border p-2">{member.name}</td>
                                  <td className="border p-2">{member.account}</td>
                                  <td className="border p-2">{member.phone || '-'}</td>
                                  <td className="border p-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {getMemberTypeLabel(member.types)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-2">尚無學員報名</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  )
}



