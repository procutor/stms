import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// @ts-ignore - Temporarily bypassing type checking for auth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      // @ts-ignore
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
            where: {
                email: credentials.email
            },
            include: {
                school: true
            }
        })

        if (!user || !user.isActive) {
            return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school?.name || '',
          teachingStreams: user.teachingStreams,
          maxWeeklyHours: user.maxWeeklyHours
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    // @ts-ignore
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.schoolId = user.schoolId
        token.schoolName = user.schoolName
        token.teachingStreams = user.teachingStreams
        token.maxWeeklyHours = user.maxWeeklyHours
      }
      return token
    },
    // @ts-ignore
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.schoolId = token.schoolId
        session.user.schoolName = token.schoolName
        // @ts-ignore
        session.user.teachingStreams = token.teachingStreams
        // @ts-ignore
        session.user.maxWeeklyHours = token.maxWeeklyHours
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}