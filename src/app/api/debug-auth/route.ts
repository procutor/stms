import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Debug auth - Email:', email)

    // First check if we can find any users
    const allUsers = await db.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    })
    console.log('Debug auth - Total users in DB:', allUsers.length)
    allUsers.forEach(u => console.log('  -', u.email, u.role))

    const user = await db.user.findUnique({
      where: {
        email: email
      },
      include: {
        school: true
      }
    })

    console.log('Debug auth - User found:', !!user)
    if (user) {
      console.log('Debug auth - User email:', user.email)
      console.log('Debug auth - User active:', user.isActive)
      console.log('Debug auth - Password hash exists:', !!user.password)

      const isPasswordValid = await bcrypt.compare(password, user.password)
      console.log('Debug auth - Password valid:', isPasswordValid)

      if (isPasswordValid) {
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        })
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}