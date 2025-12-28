'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface BookingForm {
  name: string
  phone: string
  email?: string
  classDate: string
  className?: string
  notes?: string
}

export default function TrialBookingPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookingForm>()

  const onSubmit = async (data: BookingForm) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess(true)
        reset()
        setTimeout(() => setSuccess(false), 5000)
      } else {
        alert('預約失敗，請稍後再試')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('預約失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">預約體驗課程</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              預約成功！我們會盡快與您聯繫確認。
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: '請輸入姓名' })}
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                聯絡電話 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone', {
                  required: '請輸入聯絡電話',
                  pattern: {
                    value: /^[0-9]{8,10}$/,
                    message: '請輸入有效的電話號碼',
                  },
                })}
                type="tel"
                id="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的Email',
                  },
                })}
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="classDate" className="block text-sm font-medium text-gray-700 mb-1">
                預約課程日期 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('classDate', { required: '請選擇預約日期' })}
                type="date"
                id="classDate"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.classDate && (
                <p className="mt-1 text-sm text-red-600">{errors.classDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                課程名稱（選填）
              </label>
              <input
                {...register('className')}
                type="text"
                id="className"
                placeholder="例如：基礎瑜珈、熱瑜珈"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                備註
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={4}
                placeholder="其他需求或問題..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? '提交中...' : '提交預約'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


