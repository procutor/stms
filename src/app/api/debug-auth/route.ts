import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const testConnection = searchParams.get('test') === 'true'

  // Test database connection first
  if (testConnection) {
    try {
      await db.$queryRaw`SELECT 1`
      return NextResponse.json({
        status: 'connected',
        message: 'Database connection successful',
        database: 'Supabase PostgreSQL (Session Pooler)'
      })
    } catch (error: any) {
      return NextResponse.json({
        status: 'connection_failed',
        error: error.message,
        possibleCauses: [
          'Supabase session pooler not accessible from Vercel (IPv4 issue)',
          'DATABASE_URL is incorrect or expired',
          'Network firewall blocking connection',
          'Supabase project suspended or deleted'
        ],
        solutions: [
          'Purchase Supabase IPv4 add-on for direct connections',
          'Use Supabase connection builder to get correct URL',
          'Check Supabase project status and billing'
        ]
      }, { status: 500 })
    }
  }

  if (!email) {
    return NextResponse.json({ 
      error: 'Email parameter required',
      usage: '?email=user@example.com',
      testMode: '?test=true to test database connection'
    }, { status: 400 })
  }

  try {
    // Test database connection and user lookup
    const user = await db.user.findUnique({
      where: { email },
      include: { school: true }
    })

    if (!user) {
      return NextResponse.json({
        status: 'user_not_found',
        email,
        message: 'User does not exist in database',
        possibleCauses: [
          'DATABASE_URL on Vercel points to different database',
          'User was created locally but not on production database',
          'Database migration not applied on production'
        ]
      })
    }

    // Test if we can verify a password
    const testPassword = 'test123'
    const isPasswordValid = await bcrypt.compare(testPassword, user.password)

    return NextResponse.json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        schoolId: user.schoolId,
        schoolName: user.school?.name
      },
      passwordTest: {
        testedWith: testPassword,
        isValid: isPasswordValid,
        note: 'If isValid is false, passwords were likely hashed with different bcrypt settings'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      possibleCauses: [
        'DATABASE_URL is invalid or unreachable',
        'Database connection failed',
        'Environment variables not set correctly on Vercel'
      ],
      checkList: [
        'Verify DATABASE_URL on Vercel matches local .env',
        'Ensure database is accessible from Vercel IP ranges',
        'Check that all migrations are applied'
      ]
    }, { status: 500 })
  }
}
