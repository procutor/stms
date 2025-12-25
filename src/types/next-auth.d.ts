import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      schoolId: string | null
      schoolName: string | null
      schoolType?: string | null
      teachingStreams?: string | null
      maxWeeklyHours?: number | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    schoolId: string | null
    schoolName: string | null
    teachingStreams?: string | null
    maxWeeklyHours?: number | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    schoolId: string | null
    schoolName: string | null
    teachingStreams?: string | null
    maxWeeklyHours?: number | null
  }
}