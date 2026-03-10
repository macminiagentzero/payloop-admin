import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mellone.co'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'PayLoop2024!'
const AUTH_SECRET = process.env.AUTH_SECRET || 'payloop-admin-secret'

// Simple token generation
export function generateToken(): string {
  return Buffer.from(`${Date.now()}:${AUTH_SECRET}`).toString('base64')
}

// Verify token
export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [timestamp, secret] = decoded.split(':')
    return secret === AUTH_SECRET && parseInt(timestamp) > Date.now() - 24 * 60 * 60 * 1000 // 24h expiry
  } catch {
    return false
  }
}

// Check credentials
export function checkCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

// Server-side auth check
export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token || !verifyToken(token)) {
    redirect('/login')
  }
  
  return { email: ADMIN_EMAIL }
}