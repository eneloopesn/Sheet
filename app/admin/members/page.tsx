'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Class {
  id: string
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
}

interface Member {
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

interface MemberForm {
  account: string
  password: string
  name: string
  phone?: string
  email?: string
  classId1?: string
  classId2?: string
  classId3?: string
  remainingClasses: number
  planStartDate?: string
  planEndDate?: string
}

export default function AdminMembersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberForm>()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchMembers()
      fetchClasses()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchMembers()
    }
  }, [search])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      // 確保 data 是數組
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      setClasses([])
    }
  }

  const fetchMembers = async () => {
    try {
      const url = search
        ? `/api/admin/members?search=${encodeURIComponent(search)}`
        : '/api/admin/members'
      const response = await fetch(url)
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      // 確保 data 是數組
      setMembers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: MemberForm) => {
    try {
      if (editingMember) {
        const response = await fetch(`/api/admin/members/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          alert('更新成功')
          reset()
          setShowForm(false)
          setEditingMember(null)
          fetchMembers()
        } else {
          const result = await response.json()
          alert(result.error || '更新失敗')
        }
      } else {
        // 清理空字符串，轉換為 null
        const submitData = {
          ...data,
          email: data.email || null,
          planType: data.planType || null,
          classId1: data.classId1 || null,
          classId2: data.classId2 || null,
          classId3: data.classId3 || null,
          remainingClasses: data.remainingClasses || 0,
        }
        
        console.log('Submitting member data:', { ...submitData, password: '***' })
        
        const response = await fetch('/api/admin/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })
        const result = await response.json()
        if (response.ok) {
          alert('新增成功')
          reset()
          setShowForm(false)
          fetchMembers()
        } else {
          console.error('API Error:', result)
          const errorMsg = result.error || result.details || '新增失敗'
          alert(`錯誤: ${errorMsg}${result.details ? ` (${result.details})` : ''}`)
        }
      }
    } catch (error: any) {
      console.error('Submit Error:', error)
      alert(`操作失敗: ${error.message || '請稍後再試'}`)
    }
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    reset({
      account: member.account,
      name: member.name,
      phone: member.phone,
      email: member.email,
      classId1: (member as any).classId1 || '',
      classId2: (member as any).classId2 || '',
      classId3: (member as any).classId3 || '',
      remainingClasses: member.remainingClasses,
      planStartDate: member.planStartDate ? new Date(member.planStartDate).toISOString().split('T')[0] : '',
      planEndDate: member.planEndDate ? new Date(member.planEndDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此會員嗎？')) return

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        alert('刪除成功')
        fetchMembers()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      alert('刪除失敗，請稍後再試')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">會員管理</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="搜尋會員..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => {
                setEditingMember(null)
                reset()
                setShowForm(!showForm)
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              {showForm ? '取消' : '新增會員'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingMember ? '編輯會員' : '新增會員'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    帳號 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('account', { required: '請輸入帳號' })}
                    type="text"
                    disabled={!!editingMember}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  />
                  {errors.account && (
                    <p className="mt-1 text-sm text-red-600">{errors.account.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingMember ? '新密碼（留空則不修改）' : '密碼'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('password', { required: !editingMember })}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name', { required: '請輸入姓名' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    第一堂課
                  </label>
                  <select
                    {...register('classId1')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">請選擇課程</option>
                    {(Array.isArray(classes) ? classes : []).map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    第二堂課（選填）
                  </label>
                  <select
                    {...register('classId2')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">無</option>
                    {(Array.isArray(classes) ? classes : []).map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    第三堂課（選填）
                  </label>
                  <select
                    {...register('classId3')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">無</option>
                    {(Array.isArray(classes) ? classes : []).map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    剩餘堂數
                  </label>
                  <input
                    {...register('remainingClasses', { valueAsNumber: true })}
                    type="number"
                    defaultValue={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    方案開始日期
                  </label>
                  <input
                    {...register('planStartDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    方案結束日期
                  </label>
                  <input
                    {...register('planEndDate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                >
                  {editingMember ? '更新' : '新增'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingMember(null)
                    reset()
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">帳號</th>
                  <th className="border p-2 text-left">姓名</th>
                  <th className="border p-2 text-left">電話</th>
                  <th className="border p-2 text-left">方案</th>
                  <th className="border p-2 text-left">剩餘堂數</th>
                  <th className="border p-2 text-left">狀態</th>
                  <th className="border p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border p-4 text-center">載入中...</td>
                  </tr>
                ) : !Array.isArray(members) || members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border p-4 text-center text-gray-400">尚無會員資料</td>
                  </tr>
                ) : (
                  (Array.isArray(members) ? members : []).map((member) => (
                    <tr key={member.id}>
                      <td className="border p-2">{member.account}</td>
                      <td className="border p-2">{member.name}</td>
                      <td className="border p-2">{member.phone}</td>
                      <td className="border p-2">
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
                          return classTimes.length > 0 ? classTimes.join(' / ') : '-'
                        })()}
                      </td>
                      <td className="border p-2">{member.remainingClasses}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="border p-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            查看
                          </Link>
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            刪除
                          </button>
                        </div>
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


