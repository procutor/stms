// TypeScript declaration for 'nextauth' as an alias for 'next-auth'
// This allows imports like: import { getServerSession } from 'nextauth'

import NextAuth from 'next-auth'

// Re-export everything from next-auth
declare const nextauth: typeof NextAuth

export = nextauth
export as namespace nextauth

// Re-export all named exports from NextAuth
export const getServerSession: typeof NextAuth
export const handlers: typeof NextAuth.handlers
export const auth: typeof NextAuth.auth
export const signIn: typeof NextAuth.signIn
export const signOut: typeof NextAuth.signOut
export const update: typeof NextAuth.update
