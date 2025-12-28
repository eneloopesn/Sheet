'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
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
  capacity: number
  enrolled: number
  status: string
  isRecurring?: boolean
  recurringPattern?: string
  recurringEndDate?: string
}

interface ClassForm {
  name: string
  instructor: string
  date: string
  startTime: string
  endTime: string
  room?: string
  capacity: number
  isRecurring: boolean
  recurringPattern?: string
  recurringEndDate?: string
}

export default function AdminSchedulePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ClassForm>()
  const isRecurring = watch('isRecurring')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchClasses()
    }
  }, [user, authLoading, router])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
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

  const onSubmit = async (data: ClassForm) => {
    try {
      const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes'
      const method = editingClass ? 'PUT' : 'POST'

      // 確保 capacity 有值，並清理空字符串
      const submitData = {
        ...data,
        capacity: data.capacity || 20,
        room: data.room || null,
        recurringPattern: data.isRecurring && data.recurringPattern ? data.recurringPattern : null,
        recurringEndDate: data.isRecurring && data.recurringEndDate ? data.recurringEndDate : null,
      }
      
      console.log('Submitting class data:', submitData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        alert(editingClass ? '更新成功' : '新增成功')
        reset()
        setShowForm(false)
        setEditingClass(null)
        fetchClasses()
      } else {
        console.error('API Error:', result)
        const errorMsg = result.error || result.details || (editingClass ? '更新失敗' : '新增失敗')
        alert(`錯誤: ${errorMsg}${result.details ? ` (${result.details})` : ''}`)
      }
    } catch (error: any) {
      console.error('Submit Error:', error)
      alert(`操作失敗: ${error.message || '請稍後再試'}`)
    }
  }

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem)
    reset({
      name: classItem.name,
      instructor: classItem.instructor,
      date: format(new Date(classItem.date), 'yyyy-MM-dd'),
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      room: classItem.room || '',
      capacity: classItem.capacity || 20,
      isRecurring: classItem.isRecurring || false,
      recurringPattern: classItem.recurringPattern || '',
      recurringEndDate: classItem.recurringEndDate ? format(new Date(classItem.recurringEndDate), 'yyyy-MM-dd') : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此課程嗎？')) return

    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('刪除成功')
        fetchClasses()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      alert('刪除失敗，請稍後再試')
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
          <h1 className="text-3xl font-bold">課程/課表管理</h1>
          <button
            onClick={() => {
              setEditingClass(null)
              reset({
                isRecurring: false,
                capacity: 20,
              })
              setShowForm(!showForm)
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            {showForm ? '取消' : '新增課程'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingClass ? '編輯課程' : '新增課程'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    課程名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name', { required: '請輸入課程名稱' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教練 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('instructor', { required: '請輸入教練姓名' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.instructor && (
                    <p className="mt-1 text-sm text-red-600">{errors.instructor.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('date', { required: '請選擇日期' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('startTime', { required: '請輸入開始時間' })}
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('endTime', { required: '請輸入結束時間' })}
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教室
                  </label>
                  <input
                    {...register('room')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    容量
                  </label>
                  <input
                    {...register('capacity', { 
                      valueAsNumber: true,
                      min: 1
                    })}
                    type="number"
                    defaultValue={20}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('isRecurring')}
                      type="checkbox"
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">週期性課程</span>
                  </label>
                </div>
                {isRecurring && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        週期模式
                      </label>
                      <select
                        {...register('recurringPattern')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">每日</option>
                        <option value="weekly">每週</option>
                        <option value="monthly">每月</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        結束日期
                      </label>
                      <input
                        {...register('recurringEndDate')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                >
                  {editingClass ? '更新' : '新增'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingClass(null)
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
                  <th className="border p-2 text-left">日期</th>
                  <th className="border p-2 text-left">時間</th>
                  <th className="border p-2 text-left">課程名稱</th>
                  <th className="border p-2 text-left">教練</th>
                  <th className="border p-2 text-left">教室</th>
                  <th className="border p-2 text-left">人數</th>
                  <th className="border p-2 text-left">狀態</th>
                  <th className="border p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(classes) || classes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border p-4 text-center text-gray-400">尚無課程資料</td>
                  </tr>
                ) : (
                  (Array.isArray(classes) ? classes : []).map((classItem) => (
                    <tr key={classItem.id}>
                      <td className="border p-2">
                        {format(new Date(classItem.date), 'yyyy-MM-dd')}
                      </td>
                      <td className="border p-2">
                        {classItem.startTime} - {classItem.endTime}
                      </td>
                      <td className="border p-2">{classItem.name}</td>
                      <td className="border p-2">{classItem.instructor}</td>
                      <td className="border p-2">{classItem.room || '-'}</td>
                      <td className="border p-2">
                        {classItem.enrolled}/{classItem.capacity}
                      </td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          classItem.status === 'active' ? 'bg-green-100 text-green-800' :
                          classItem.status === 'full' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {classItem.status === 'active' ? '進行中' :
                           classItem.status === 'full' ? '額滿' : '已取消'}
                        </span>
                      </td>
                      <td className="border p-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id)}
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
