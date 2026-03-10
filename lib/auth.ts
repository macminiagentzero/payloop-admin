import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Read environment variables at request time, not at build time
function getEnvVar(name: string, defaultValue: string): string {
  // In Next.js, process.env is available at runtime on the server
  return process.env[name] || defaultValue
}

// Simple token generation
export function generateToken(): string {
  const authSecret = getEnvVar('AUTH_SECRET', 'payloop-admin-secret')
  return Buffer.from(`${Date.now()}:${authSecret}`).toString('base64')
}

// Verify token
export function verifyToken(token: string): boolean {
  try {
    const authSecret = getEnvVar('AUTH_SECRET', 'payloop-admin-secret')
    const decoded = Buffer.from(token, 'base64').toString()
    const [timestamp, secret] = decoded.split(':')
    return secret === authSecret && parseInt(timestamp) > Date.now() - 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

// Check credentials
export function checkCredentials(email: string, password: string): boolean {
  const adminEmail = getEnvVar('ADMIN_EMAIL', 'admin@mellone.co')
  const adminPassword = getEnvVar('ADMIN_PASSWORD', 'PayLoop2024!')
  
  console.log('Checking credentials:', { 
    providedEmail: email, 
    adminEmail,
    passwordMatch: password === adminPassword 
  })
  
  return email === adminEmail && password === adminPassword
}

// Server-side auth check (for pages - redirects to login)
export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token || !verifyToken(token)) {
    redirect('/login')
  }
  
  const adminEmail = getEnvVar('ADMIN_EMAIL', 'admin@mellone.co')
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
    
    const adminEmail = getEnvVar('ADMIN_EMAIL', 'admin@mellone.co')
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