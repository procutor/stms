import { DefaultSession } from 'next-auth'

// Define the types based on the schema
export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'TRAINER'
export type SchoolType = 'PRIMARY' | 'SECONDARY' | 'TSS'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            role: UserRole
            schoolId: string | null
            schoolName: string | null
            schoolType: SchoolType | null
        } & DefaultSession['user']
    }

    interface User {
        role: UserRole
        schoolId: string | null
        schoolName: string | null
        schoolType: SchoolType | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: UserRole
        schoolId: string | null
        schoolName: string | null
        schoolType: SchoolType | null
    }
}

// Extended types for the application
export interface SchoolWithDetails {
    id: string
    name: string
    type: SchoolType
    status: string
    email: string
    phone?: string
    address?: string
    approvedAt?: Date
    createdAt: Date
    _count?: {
        users: number
        classes: number
        timetables: number
    }
}

export interface TeacherWithAssignments {
    id: string
    name: string
    email: string
    maxWeeklyHours?: number
    teacherSubjects: {
        subject: {
            id: string
            name: string
            periodsPerWeek: number
        }
    }[]
    trainerModules: {
        module: {
            id: string
            name: string
            totalHours: number
            category: string
        }
    }[]
}

export interface TimetableEntry {
    id: string
    day: string
    period: number
    startTime: string
    endTime: string
    class: {
        name: string
        grade: string
    }
    teacher: {
        name: string
    }
    subject?: {
        name: string
    }
    module?: {
        name: string
        category: string
    }
}

export interface ConflictResolution {
    type: 'teacher_conflict' | 'class_conflict' | 'unassigned'
    message: string
    suggestions?: string[]
}

export interface TimetableGenerationOptions {
    schoolId: string
    classId?: string
    regenerate?: boolean
    prioritizeTSS?: boolean
}