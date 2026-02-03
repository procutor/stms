import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update the existing user's password
      const updatedUser = await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name || existingUser.name,
          role: 'SUPER_ADMIN',
          isActive: true,
        }
      });

      return NextResponse.json({
        message: 'Super admin password updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    }

    // Create new user
    const user = await db.user.create({
      data: {
        email,
        name: name || 'Super Administrator',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });

    return NextResponse.json({
      message: 'Super admin created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      { error: 'Failed to create super admin', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use POST to create or update a super admin',
    example: {
      email: 'damscenetugireye@gmail.com',
      password: 'sEkamana@123',
      name: 'Your Name'
    }
  });
}
