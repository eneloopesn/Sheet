'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAdminAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface Admin {
  id: string
  username: string
  name: string
  email?: string
}

interface AdminForm {
  username: string
  password: string
  name: string
  email?: string
}

interface PasswordForm {
  adminId: string
  newPassword: string
  confirmPassword: string
}

export default function AdminAdminsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAdminAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminForm>()
  const passwordForm = useForm<PasswordForm>()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }
    if (user) {
      fetchAdmins()
    }
  }, [user, authLoading, router])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: AdminForm) => {
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        alert('新增成功')
        reset()
        setShowForm(false)
        fetchAdmins()
      } else {
        const result = await response.json()
        alert(result.error || '新增失敗')
      }
    } catch (error) {
      alert('新增失敗，請稍後再試')
    }
  }

  const onSubmitPassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('新密碼與確認密碼不一致')
      return
    }

    try {
      const response = await fetch(`/api/admin/admins/${data.adminId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.newPassword }),
      })

      if (response.ok) {
        alert('密碼修改成功')
        passwordForm.reset()
        setShowPasswordForm(false)
        setEditingAdmin(null)
      } else {
        const result = await response.json()
        alert(result.error || '修改失敗')
      }
    } catch (error) {
      alert('修改失敗，請稍後再試')
    }
  }

  const handleEditPassword = (admin: Admin) => {
    setEditingAdmin(admin)
    passwordForm.reset({ adminId: admin.id })
    setShowPasswordForm(true)
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`確定要刪除管理者 "${username}" 嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        alert('刪除成功')
        fetchAdmins()
      } else {
        console.error('API Error:', result)
        alert(result.error || '刪除失敗')
      }
    } catch (error) {
      console.error('Delete Error:', error)
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
          <h1 className="text-3xl font-bold">管理者管理</h1>
          <button
            onClick={() => {
              reset()
              setShowForm(!showForm)
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            {showForm ? '取消' : '新增管理者'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">新增管理者</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    帳號 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('username', { required: '請輸入帳號' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('password', { required: '請輸入密碼' })}
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
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                >
                  新增
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
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

        {showPasswordForm && editingAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">修改密碼 - {editingAdmin.username}</h2>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  {...passwordForm.register('newPassword', { required: '請輸入新密碼' })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  {...passwordForm.register('confirmPassword', { required: '請確認密碼' })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                >
                  修改
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setEditingAdmin(null)
                    passwordForm.reset()
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
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border p-4 text-center text-gray-400">尚無管理者資料</td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="border p-2">{admin.username}</td>
                      <td className="border p-2">{admin.name}</td>
                      <td className="border p-2">{admin.email || '-'}</td>
                      <td className="border p-2">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditPassword(admin)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            修改密碼
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id, admin.username)}
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

