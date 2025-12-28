'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useMemberAuth } from '@/hooks/useAuth'
import BackButton from '@/components/BackButton'

interface ProfileForm {
  name: string
  phone: string
  email?: string
  currentPassword: string
  newPassword?: string
  confirmPassword?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useMemberAuth()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileForm>()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/member/login')
      return
    }
    if (user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/member/dashboard')
      if (response.status === 401) {
        router.push('/member/login')
        return
      }
      const data = await response.json()
      // 這裡可以預填表單，但為了簡化，我們先不實作
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      alert('新密碼與確認密碼不一致')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        alert('更新成功！')
      } else {
        const result = await response.json()
        alert(result.error || '更新失敗')
      }
    } catch (error) {
      alert('更新失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">個人資料設定</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">基本資料</h2>
              <div className="space-y-4">
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
                    電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone', { required: '請輸入電話' })}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
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
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">修改密碼</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目前密碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('currentPassword', { required: '請輸入目前密碼' })}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密碼（選填）
                  </label>
                  <input
                    {...register('newPassword')}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    確認新密碼
                  </label>
                  <input
                    {...register('confirmPassword', {
                      validate: (value) => {
                        const newPassword = watch('newPassword')
                        if (newPassword && value !== newPassword) {
                          return '新密碼與確認密碼不一致'
                        }
                      },
                    })}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? '更新中...' : '更新資料'}
            </button>
          </form>
        </div>
      </div>
      <BackButton />
    </div>
  )
}


