import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

export function getDaysOfWeek() {
    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
}

export function getDayName(day: string): string {
    const days: Record<string, string> = {
        MONDAY: 'Monday',
        TUESDAY: 'Tuesday',
        WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday',
        FRIDAY: 'Friday',
        SATURDAY: 'Saturday'
    }
    return days[day] || day
}

export function getModuleCategoryPriority(category: string): number {
    const priorities: Record<string, number> = {
        SPECIFIC: 1,
        GENERAL: 2,
        COMPLEMENTARY: 3
    }
    return priorities[category] || 4
}

export function isMorningPeriod(period: number, totalPeriods: number = 8): boolean {
    return period <= Math.ceil(totalPeriods * 0.6) // First 60% of periods are morning
}

export function generateTimeSlots(startHour: number = 8, periods: number = 8, duration: number = 45): Array<{ startTime: Date, endTime: Date }> {
    const slots = []
    for (let i = 0; i < periods; i++) {
        const startTime = new Date()
        startTime.setHours(startHour + Math.floor((i * (duration + 15)) / 60), (i * (duration + 15)) % 60, 0)

        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + duration)

        slots.push({ startTime, endTime })
    }
    return slots
}

export function calculateWeeklyHours(periods: number, duration: number = 45, daysPerWeek: number = 6): number {
    return Math.round((periods * duration * daysPerWeek) / 60 * 100) / 100
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' }
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' }
    }

    if (!/(?=.*\d)/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' }
    }

    return { isValid: true }
}