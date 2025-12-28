import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
  id: string
  type: 'member' | 'admin'
  account?: string
  username?: string
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function authenticateMember(account: string, password: string) {
  const member = await prisma.member.findUnique({
    where: { account },
  })

  if (!member) return null

  const isValid = await verifyPassword(password, member.password)
  if (!isValid) return null

  return {
    id: member.id,
    type: 'member' as const,
    account: member.account,
  }
}

export async function authenticateAdmin(username: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { username },
  })

  if (!admin) return null

  const isValid = await verifyPassword(password, admin.password)
  if (!isValid) return null

  return {
    id: admin.id,
    type: 'admin' as const,
    username: admin.username,
  }
}


