'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  type: 'member' | 'admin'
  account?: string
  username?: string
}

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15分鐘

export function useMemberAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // 檢查認證狀態
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/member/dashboard')
      if (response.ok) {
        const data = await response.json()
        setUser({ id: data.id, type: 'member', account: data.account })
        setLastActivity(Date.now())
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // 活動追蹤
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [])

  // 檢查超時
  useEffect(() => {
    if (!user) return

    const checkTimeout = () => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        handleLogout()
      }
    }

    const interval = setInterval(checkTimeout, 1000) // 每秒檢查一次
    return () => clearInterval(interval)
  }, [user, lastActivity])

  // 登出
  const handleLogout = useCallback(() => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    router.push('/member/login')
  }, [router])

  // 初始化檢查
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return { user, loading, checkAuth, logout: handleLogout }
}

export function useAdminAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        // 從 token 獲取用戶信息（實際應該從 API 返回）
        setUser({ id: 'admin', type: 'admin', username: 'admin' })
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogout = useCallback(() => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    router.push('/admin/login')
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return { user, loading, checkAuth, logout: handleLogout }
}

