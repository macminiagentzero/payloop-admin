import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Validate required environment variables at startup
function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in your deployment platform.`)
  }
  return value
}

// Read environment variables at request time, not at build time
// WARNING: These must be set in Render environment variables
function getEnvVar(name: string): string {
  return process.env[name] || ''
}

// Simple token generation
export function generateToken(): string {
  const authSecret = getRequiredEnvVar('AUTH_SECRET')
  return Buffer.from(`${Date.now()}:${authSecret}`).toString('base64')
}

// Verify token
export function verifyToken(token: string): boolean {
  try {
    const authSecret = getRequiredEnvVar('AUTH_SECRET')
    const decoded = Buffer.from(token, 'base64').toString()
    const [timestamp, secret] = decoded.split(':')
    return secret === authSecret && parseInt(timestamp) > Date.now() - 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

// Check credentials
export function checkCredentials(email: string, password: string): boolean {
  const adminEmail = getRequiredEnvVar('ADMIN_EMAIL')
  const adminPassword = getRequiredEnvVar('ADMIN_PASSWORD')
  
  return email === adminEmail && password === adminPassword
}

// Server-side auth check (for pages - redirects to login)
export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token || !verifyToken(token)) {
    redirect('/login')
  }
  
  const adminEmail = getRequiredEnvVar('ADMIN_EMAIL')
  return { email: adminEmail }
}

// API auth check (returns null if unauthorized, user info if authorized)
export async function getAuthUser(): Promise<{ email: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token || !verifyToken(token)) {
      return null
    }
    
    const adminEmail = getRequiredEnvVar('ADMIN_EMAIL')
    return { email: adminEmail }
  } catch {
    return null
  }
}

// Check if request is authenticated (for API routes)
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser()
  return user !== null
}