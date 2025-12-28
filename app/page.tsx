'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Member {
  id: string
  name: string
  phone?: string
  account: string
  types?: string[]
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
  allMembers: Member[]
}

interface DailyClassMembers {
  date: string
  classes: Class[]
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'members' | 'checkin'>('home')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dailyMembers, setDailyMembers] = useState<DailyClassMembers | null>(null)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [accountInput, setAccountInput] = useState('')
  const [memberInfo, setMemberInfo] = useState<{ name: string; remainingClasses: number } | null>(null)
  const [loadingMember, setLoadingMember] = useState(false)

  const fetchDailyMembers = async () => {
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/daily-class-members?date=${selectedDate}`)
      const data = await response.json()
      setDailyMembers(data)
    } catch (error) {
      console.error('Failed to fetch daily members:', error)
      alert('載入會員列表失敗')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleCheckin = async () => {
    if (!accountInput.trim()) {
      setMemberInfo(null)
      return
    }

    setLoadingMember(true)
    try {
      const response = await fetch('/api/member-by-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: accountInput.trim() }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setMemberInfo(data.member)
        alert(`簽到成功！${data.member.name} 剩餘 ${data.member.remainingClasses} 堂`)
        setAccountInput('') // 清空輸入框
      } else {
        const error = await response.json()
        setMemberInfo(null)
        alert(error.error || '簽到失敗')
      }
    } catch (error) {
      console.error('Failed to check in member:', error)
      alert('簽到失敗')
      setMemberInfo(null)
    } finally {
      setLoadingMember(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'members' && selectedDate) {
      fetchDailyMembers()
    }
  }, [activeTab, selectedDate])

  const getMemberTypeLabel = (types?: string[]) => {
    if (!types || types.length === 0) return ''
    const labels: { [key: string]: string } = {
      enrollment: '報名',
      makeup: '補課',
      regular: '固定課程',
    }
    return types.map(t => labels[t] || t).join('、')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-400 to-pink-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              歡迎來到瑜珈教室
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              專業瑜珈課程，身心靈平衡的起點
            </p>
            <div className="space-x-4">
              <Link
                href="/trial-booking"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                預約體驗課程
              </Link>
              <Link
                href="/schedule"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition"
              >
                查看課程表
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'home'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              首頁
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'members'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              查詢每天各班會員列表
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-6 py-4 font-semibold transition ${
                activeTab === 'checkin'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              簽到
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'home' && (
        <>
          {/* Features Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">為什麼選擇我們</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">專業師資</h3>
                  <p className="text-gray-600">
                    擁有多年教學經驗的專業瑜珈導師，為您量身打造適合的課程。
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">彈性課程</h3>
                  <p className="text-gray-600">
                    提供多種課程方案，靈活的請假補課機制，讓您隨時調整上課時間。
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-3">舒適環境</h3>
                  <p className="text-gray-600">
                    寬敞明亮的教室空間，完善的設備，讓您享受最佳的練習體驗。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* News Section */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">最新消息</h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold mb-2">新課程開設</h3>
                  <p className="text-gray-600 mb-2">
                    本週新增熱瑜珈課程，歡迎會員預約體驗！
                  </p>
                  <p className="text-sm text-gray-400">2024-01-15</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-500">
                  <h3 className="text-xl font-semibold mb-2">春節營業時間調整</h3>
                  <p className="text-gray-600 mb-2">
                    春節期間（2/10-2/14）營業時間調整為 10:00-18:00，敬請見諒。
                  </p>
                  <p className="text-sm text-gray-400">2024-01-10</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-purple-600 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">準備開始您的瑜珈之旅嗎？</h2>
              <p className="text-xl mb-6">立即預約體驗課程，感受專業瑜珈的魅力</p>
              <Link
                href="/trial-booking"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
              >
                立即預約
              </Link>
            </div>
          </section>
        </>
      )}

      {activeTab === 'members' && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="font-semibold">選擇日期：</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={fetchDailyMembers}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  查詢
                </button>
              </div>
            </div>

            {loadingMembers ? (
              <div className="text-center py-12">載入中...</div>
            ) : dailyMembers && dailyMembers.classes.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">
                  {format(parseISO(dailyMembers.date), 'yyyy年MM月dd日 (E)', { locale: zhTW })} 各班會員列表
                </h2>
                {dailyMembers.classes.map((classItem) => (
                  <div key={classItem.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{classItem.name}</h3>
                      <p className="text-gray-600">
                        {classItem.startTime} - {classItem.endTime} | {classItem.instructor} | {classItem.room || 'A教室'}
                      </p>
                      <p className="text-sm text-gray-500">
                        學員數：{classItem.allMembers.length} / {classItem.capacity}
                      </p>
                    </div>
                    {classItem.allMembers.length > 0 ? (
                      <div className="overflow-x-auto">
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
                                  {member.types && member.types.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {getMemberTypeLabel(member.types)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">尚無學員報名</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-400">
                該日期尚無課程或會員
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'checkin' && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">會員簽到</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">會員帳號：</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={accountInput}
                      onChange={(e) => {
                        setAccountInput(e.target.value)
                        setMemberInfo(null)
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCheckin()
                        }
                      }}
                      placeholder="請輸入會員帳號"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <button
                      onClick={handleCheckin}
                      disabled={loadingMember || !accountInput.trim()}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loadingMember ? '簽到中...' : '簽到'}
                    </button>
                  </div>
                </div>

                {memberInfo && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">會員資訊</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">姓名：</span>{memberInfo.name}</p>
                      <p><span className="font-medium">剩餘堂數：</span>{memberInfo.remainingClasses} 堂</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}


