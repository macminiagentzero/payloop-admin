import { NextRequest, NextResponse } from 'next/server'
import { checkCredentials, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Debug logging
    console.log('Login attempt:', { 
      email, 
      passwordProvided: !!password,
      envEmail: process.env.ADMIN_EMAIL,
      envPasswordSet: !!process.env.ADMIN_PASSWORD
    })

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    if (!checkCredentials(email, password)) {
      console.log('Credentials check failed')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Login successful')
    const token = generateToken()
    
    const response = NextResponse.json({ 
      success: true, 
      email 
    })

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}