import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      schoolId: string | null
      schoolName: string
      teachingStreams: string[] | null
      maxWeeklyHours: number | null
    } & DefaultSession['user']
  }

  interface User {
    role: string
    schoolId: string | null
    teachingStreams: string[] | null
    maxWeeklyHours: number | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    schoolId: string | null
    schoolName: string
    teachingStreams: string[] | null
    maxWeeklyHours: number | null
  }
}
