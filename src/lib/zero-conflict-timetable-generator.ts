import { db } from '@/lib/db'
import { getModuleCategoryPriority, isMorningPeriod } from '@/lib/utils'
import { TimetableGenerationOptions, ConflictResolution } from '@/types'
import { PreparedLesson, prepareLessonsForSchool } from '@/lib/lesson-preparation'

interface ScheduleSlot {
    day: string
    period: number
    timeSlotId: string
}

interface ScheduledLesson {
    teacherId: string
    subjectId?: string
    moduleId?: string
    classId: string
    slot: ScheduleSlot
    priority: number
}

interface TeacherAvailability {
    [key: string]: Set<string> // teacherId -> Set of "day-period" keys
}

interface ClassAvailability {
    [key: string]: Set<string> // classId -> Set of "day-period" keys
}

interface GenerationOptions {
    incremental?: boolean
    regenerate?: boolean
}

export type SchoolScope = 'all-classes' | 'all-teachers' | 'both'

/**
 * ZERO-CONFLICT TIMETABLE GENERATOR
 * 
 * Key Features:
 * 1. Pre-generation feasibility check
 * 2. Backtracking mechanism for conflict resolution
 * 3. Enhanced teacher/class availability tracking
 * 4. Real-time conflict detection
 * 5. Constraint validation before scheduling
 */
export class ZeroConflictTimetableGenerator {
    private schoolId: string
    private scheduledLessons: ScheduledLesson[] = []
    private teacherAvailability: TeacherAvailability = {}
    private classAvailability: ClassAvailability = {}
    private conflicts: ConflictResolution[] = []
    private timeSlotsCache: any[] = []
    private backupState: Map<string, { teacher: Set<string>, class: Set<string>, lessons: ScheduledLesson[] }> = new Map()

    constructor(schoolId: string) {
        this.schoolId = schoolId
    }

    /**
     * ZERO-CONFLICT GENERATION
     * Main entry point for conflict-free timetable generation
     */
    async generate(): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
        try {
            console.log('🚀 STARTING ZERO-CONFLICT TIMETABLE GENERATION')
            console.log('='.repeat(60))

            // Step 1: Clear existing timetables
            await db.timetable.deleteMany({
                where: { schoolId: this.schoolId }
            })

            // Step 2: Initialize availability maps
            await this.initializeAvailability()

            // Step 3: Load and validate prepared lessons
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)
            
            if (preparedLessons.length === 0) {
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: 'No lessons found to schedule. Please set up teacher-class assignments first.'
                    }]
                }
            }

            // Step 4: Load time slots
            const timeSlots = await db.timeSlot.findMany({
                where: {
                    schoolId: this.schoolId,
                    isActive: true
                },
                orderBy: [
                    { day: 'asc' },
                    { period: 'asc' }
                ]
            })

            const validTimeSlots = this.getValidTimeSlots(timeSlots)
            console.log(`📊 Valid time slots: ${validTimeSlots.length}`)

            // Step 5: PRE-GENERATION FEASIBILITY CHECK
            const feasibilityResult = await this.checkFeasibility(preparedLessons, validTimeSlots)
            if (!feasibilityResult.feasible) {
                console.log('❌ FEASIBILITY CHECK FAILED:', feasibilityResult.reason)
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: feasibilityResult.reason,
                        suggestions: feasibilityResult.suggestions
                    }]
                }
            }
            console.log('✅ FEASIBILITY CHECK PASSED')

            // Step 6: Sort lessons by priority for optimal scheduling
            const sortedLessons = this.sortLessonsByPriority(preparedLessons)

            // Step 7: Track scheduling progress
            let scheduled = 0
            let failed = 0

            // Step 8: Schedule each lesson with backtracking
            for (const lesson of sortedLessons) {
                console.log(`📝 Scheduling: ${lesson.subjectName || lesson.moduleName} (${lesson.className}) - ${lesson.periodsPerWeek} periods/week`)

                // Try to schedule with backtracking
                const result = await this.scheduleWithBacktracking(lesson, validTimeSlots, 3) // 3 retry attempts

                if (result.success) {
                    scheduled++
                    console.log(`✅ Scheduled: ${lesson.subjectName || lesson.moduleName}`)
                } else {
                    failed++
                    this.conflicts.push(...result.conflicts)
                    console.log(`❌ Failed: ${lesson.subjectName || lesson.moduleName} - ${result.conflicts[0]?.message}`)
                }
            }

            console.log('='.repeat(60))
            console.log(`📈 SCHEDULING COMPLETE: ${scheduled} success, ${failed} failed`)

            // Step 9: Save to database
            if (scheduled > 0) {
                await this.saveToDatabase()
            }

            return {
                success: failed === 0,
                conflicts: this.conflicts
            }

        } catch (error) {
            console.error('❌ Timetable generation failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: `Timetable generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            }
        }
    }

    /**
     * PRE-GENERATION FEASIBILITY CHECK
     * Verifies that all lessons can be scheduled with available time slots
     */
    private async checkFeasibility(
        lessons: PreparedLesson[],
        validTimeSlots: any[]
    ): Promise<{ feasible: boolean; reason?: string; suggestions?: string[] }> {
        console.log('🔍 Running feasibility check...')

        // Count total periods needed
        const totalPeriodsNeeded = lessons.reduce((sum, lesson) => {
            return sum + (lesson.blockSize || 1) * (lesson.periodsPerWeek || 1)
        }, 0)

        // Count available slots per day
        const slotsPerDay = new Map<string, number>()
        validTimeSlots.forEach(slot => {
            const count = slotsPerDay.get(slot.day) || 0
            slotsPerDay.set(slot.day, count + 1)
        })

        const totalSlotsAvailable = validTimeSlots.length

        console.log(`   Total periods needed: ${totalPeriodsNeeded}`)
        console.log(`   Total slots available: ${totalSlotsAvailable}`)

        // Check if enough slots exist
        if (totalSlotsAvailable < totalPeriodsNeeded) {
            return {
                feasible: false,
                reason: `Not enough time slots. Required: ${totalPeriodsNeeded} periods, Available: ${totalSlotsAvailable} slots.`,
                suggestions: [
                    'Add more time slots to the schedule',
                    'Reduce the number of lessons/periods per week',
                    'Ensure all time slots are marked as active'
                ]
            }
        }

        // Check per-day capacity for each class
        const classRequirements = new Map<string, number>()
        lessons.forEach(lesson => {
            const current = classRequirements.get(lesson.classId) || 0
            classRequirements.set(lesson.classId, current + (lesson.blockSize || 1))
        })

        for (const [classId, periodsNeeded] of classRequirements) {
            let maxSlotsPerDay = 0
            slotsPerDay.forEach(count => {
                maxSlotsPerDay = Math.max(maxSlotsPerDay, count)
            })

            // Each class can have at most one lesson per period
            // Total slots per week / 5 days = max slots per day per class
            const maxSlotsPerDayPerClass = Math.floor(totalSlotsAvailable / 5)

            if (periodsNeeded > maxSlotsPerDayPerClass * 5) {
                return {
                    feasible: false,
                    reason: `Class requires ${periodsNeeded} periods but max possible is ${maxSlotsPerDayPerClass * 5}`,
                    suggestions: [
                        'Reduce the number of subjects/periods for this class',
                        'Add more time slots to accommodate the schedule'
                    ]
                }
            }
        }

        // Check teacher workload
        const teacherRequirements = new Map<string, number>()
        lessons.forEach(lesson => {
            const current = teacherRequirements.get(lesson.teacherId) || 0
            teacherRequirements.set(lesson.teacherId, current + (lesson.blockSize || 1))
        })

        for (const [teacherId, periodsNeeded] of teacherRequirements) {
            if (periodsNeeded > totalSlotsAvailable) {
                return {
                    feasible: false,
                    reason: `Teacher has ${periodsNeeded} periods to teach but only ${totalSlotsAvailable} slots available`,
                    suggestions: [
                        'Reduce teacher workload',
                        'Add more teachers for these subjects',
                        'Spread lessons across more time slots'
                    ]
                }
            }
        }

        return { feasible: true }
    }

    /**
     * SCHEDULE WITH BACKTRACKING
     * Tries to schedule a lesson, retrying with different strategies if conflicts occur
     */
    private async scheduleWithBacktracking(
        lesson: PreparedLesson,
        validTimeSlots: any[],
        maxRetries: number
    ): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
        let attempts = 0
        let lastError: ConflictResolution | null = null

        while (attempts < maxRetries) {
            attempts++
            console.log(`   Attempt ${attempts}/${maxRetries}`)

            // Create backup state for potential backup = this.create rollback
            constBackup()

            // Try to schedule
            const result = await this.tryScheduleLesson(lesson, validTimeSlots)

            if (result.success) {
                return { success: true, conflicts: [] }
            } else {
                // Restore backup and try different strategy
                this.restoreBackup(backup)
                lastError = result.conflicts[0] || null

                // Try different slot sorting strategy on retry
                if (attempts < maxRetries) {
                    // Shuffle or re-sort slots for next attempt
                    validTimeSlots = this.shuffleSlots(validTimeSlots)
                }
            }
        }

        return {
            success: false,
            conflicts: lastError ? [lastError] : [{
                type: 'unassigned',
                message: `Could not schedule ${lesson.subjectName || lesson.moduleName} after ${maxRetries} attempts`
            }]
        }
    }

    /**
     * TRY SCHEDULE LESSON
     * Attempts to schedule a single lesson
     */
    private async tryScheduleLesson(
        lesson: PreparedLesson,
        validTimeSlots: any[]
    ): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
        const { periodsPerWeek = 2, blockSize = 1 } = lesson

        // Validate inputs
        if (!blockSize || blockSize <= 0) {
            return {
                success: false,
                conflicts: [{
                    type: 'unassigned',
                    message: `Invalid block size: ${blockSize}`
                }]
            }
        }

        // Get teacher constraints
        const teacherConstraints = await this.getTeacherConstraints(lesson.teacherId)

        // Sort slots for optimal distribution
        const sortedSlots = this.sortSlotsForOptimalFit(lesson, validTimeSlots)

        for (const timeSlot of sortedSlots) {
            const slotKey = `${timeSlot.day}-${timeSlot.period}`

            // Skip if teacher unavailable on this day
            if (teacherConstraints.unavailableDays?.includes(timeSlot.day)) continue

            // Skip if teacher unavailable in this period
            const ts = timeSlot as any
            if (teacherConstraints.unavailablePeriods?.includes(ts.period.toString())) continue

            // Check if slot is available for teacher
            if (this.teacherAvailability[lesson.teacherId]?.has(slotKey)) continue

            // Check if slot is available for class
            if (this.classAvailability[lesson.classId]?.has(slotKey)) continue

            // Check consecutive periods constraint
            if (!this.canScheduleConsecutivePeriods(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, blockSize, lesson.subjectId || lesson.moduleId)) {
                continue
            }

            // Check if block can be scheduled
            if (!this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, blockSize)) {
                continue
            }

            // Found a valid slot - schedule it
            for (let i = 0; i < blockSize; i++) {
                const currentPeriod = timeSlot.period + i
                const currentSlotKey = `${timeSlot.day}-${currentPeriod}`
                const currentTimeSlot = validTimeSlots.find((ts: any) => ts.day === timeSlot.day && ts.period === currentPeriod)

                if (!currentTimeSlot || (currentTimeSlot as any).isBreak) {
                    continue
                }

                this.scheduledLessons.push({
                    teacherId: lesson.teacherId,
                    subjectId: lesson.subjectId,
                    moduleId: lesson.moduleId,
                    classId: lesson.classId,
                    slot: {
                        day: timeSlot.day,
                        period: currentPeriod,
                        timeSlotId: currentTimeSlot.id
                    },
                    priority: lesson.priority
                })

                // Mark as occupied
                if (!this.teacherAvailability[lesson.teacherId]) {
                    this.teacherAvailability[lesson.teacherId] = new Set()
                }
                if (!this.classAvailability[lesson.classId]) {
                    this.classAvailability[lesson.classId] = new Set()
                }
                this.teacherAvailability[lesson.teacherId].add(currentSlotKey)
                this.classAvailability[lesson.classId].add(currentSlotKey)
            }

            console.log(`   ✅ Scheduled at ${slotKey}`)
            return { success: true, conflicts: [] }
        }

        // No slot found
        return {
            success: false,
            conflicts: [{
                type: 'unassigned',
                message: `No available slot found for ${lesson.subjectName || lesson.moduleName} in ${lesson.className}`,
                suggestions: [
                    'Check if teacher has availability constraints',
                    'Verify class schedule has free periods',
                    'Consider reducing consecutive period requirements'
                ]
            }]
        }
    }

    /**
     * GET VALID TIME SLOTS
     * Filters time slots to only include valid lesson periods
     */
    private getValidTimeSlots(timeSlots: any[]): any[] {
        return timeSlots.filter((ts: any) => {
            const period = ts.period
            const day = ts.day
            const isValidPeriod = period >= 1 && period <= 13
            const isValidDay = day !== 'SATURDAY' && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day)
            const isNotBreak = !ts.isBreak
            return isValidPeriod && isValidDay && isNotBreak
        })
    }

    /**
     * SORT LESSONS BY PRIORITY
     * Sorts lessons for optimal scheduling order
     */
    private sortLessonsByPriority(lessons: PreparedLesson[]): PreparedLesson[] {
        return lessons.sort((a, b) => {
            // High priority subjects first (more periods per week)
            const periodsA = a.periodsPerWeek || 2
            const periodsB = b.periodsPerWeek || 2
            if (periodsB !== periodsA) {
                return periodsB - periodsA
            }

            // Then by priority field
            if (a.priority !== b.priority) {
                return b.priority - a.priority
            }

            // Then by block size (larger blocks first)
            if ((b.blockSize || 1) !== (a.blockSize || 1)) {
                return (b.blockSize || 1) - (a.blockSize || 1)
            }

            return 0
        })
    }

    /**
     * SORT SLOTS FOR OPTIMAL FIT
     * Sorts time slots for optimal lesson placement
     */
    private sortSlotsForOptimalFit(lesson: PreparedLesson, slots: any[]): any[] {
        const teacherId = lesson.teacherId
        const classId = lesson.classId

        // Count current lessons per day
        const teacherLessonsByDay = new Map<string, number>()
        const classLessonsByDay = new Map<string, number>()

        this.scheduledLessons.forEach(lesson => {
            if (lesson.teacherId === teacherId) {
                teacherLessonsByDay.set(lesson.slot.day, (teacherLessonsByDay.get(lesson.slot.day) || 0) + 1)
            }
            if (lesson.classId === classId) {
                classLessonsByDay.set(lesson.slot.day, (classLessonsByDay.get(lesson.slot.day) || 0) + 1)
            }
        })

        // Sort by: fewer lessons first (distribute evenly)
        return [...slots].sort((a, b) => {
            const teacherA = teacherLessonsByDay.get(a.day) || 0
            const teacherB = teacherLessonsByDay.get(b.day) || 0
            const classA = classLessonsByDay.get(a.day) || 0
            const classB = classLessonsByDay.get(b.day) || 0

            const scoreA = teacherA + classA
            const scoreB = teacherB + classB

            // Prefer days with fewer lessons
            if (scoreA !== scoreB) {
                return scoreA - scoreB
            }

            // Then prefer morning slots
            const isMorningA = (a as any).session === 'MORNING'
            const isMorningB = (b as any).session === 'MORNING'
            if (isMorningA !== isMorningB) {
                return isMorningA ? -1 : 1
            }

            return 0
        })
    }

    /**
     * SHUFFLE SLOTS
     * Randomizes slot order for retry attempts
     */
    private shuffleSlots(slots: any[]): any[] {
        const shuffled = [...slots]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    /**
     * CREATE BACKUP
     * Creates a backup of current state for potential rollback
     */
    private createBackup(): string {
        const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const teacherBackup: TeacherAvailability = {}
        const classBackup: ClassAvailability = {}
        
        for (const [teacherId, slots] of Object.entries(this.teacherAvailability)) {
            teacherBackup[teacherId] = new Set(slots)
        }
        for (const [classId, slots] of Object.entries(this.classAvailability)) {
            classBackup[classId] = new Set(slots)
        }

        this.backupState.set(backupId, {
            teacher: teacherBackup,
            class: classBackup,
            lessons: [...this.scheduledLessons]
        })

        return backupId
    }

    /**
     * RESTORE BACKUP
     * Restores state from backup
     */
    private restoreBackup(backupId: string): void {
        const backup = this.backupState.get(backupId)
        if (backup) {
            this.teacherAvailability = backup.teacher
            this.classAvailability = backup.class
            this.scheduledLessons = [...backup.lessons]
            this.backupState.delete(backupId)
        }
    }

    /**
     * CAN SCHEDULE CONSECUTIVE PERIODS
     * Checks if consecutive periods can be scheduled without violating constraints
     */
    private canScheduleConsecutivePeriods(
        teacherId: string,
        classId: string,
        day: string,
        period: number,
        blockSize: number,
        subjectId: string
    ): boolean {
        // Check if consecutive periods are available
        for (let i = 0; i < blockSize; i++) {
            const currentPeriod = period + i
            const slotKey = `${day}-${currentPeriod}`

            // Check if slot is already taken
            if (this.teacherAvailability[teacherId]?.has(slotKey)) {
                return false
            }
            if (this.classAvailability[classId]?.has(slotKey)) {
                return false
            }
        }
        return true
    }

    /**
     * CAN SCHEDULE BLOCK
     * Checks if a block of periods can be scheduled
     */
    private canScheduleBlock(
        teacherId: string,
        classId: string,
        day: string,
        period: number,
        blockSize: number
    ): boolean {
        for (let i = 0; i < blockSize; i++) {
            const currentPeriod = period + i
            const slotKey = `${day}-${currentPeriod}`

            if (this.teacherAvailability[teacherId]?.has(slotKey)) {
                return false
            }
            if (this.classAvailability[classId]?.has(slotKey)) {
                return false
            }
        }
        return true
    }

    /**
     * INITIALIZE AVAILABILITY
     * Initializes availability maps for all teachers and classes
     */
    private async initializeAvailability(): Promise<void> {
        // Load time slots
        const timeSlots = await db.timeSlot.findMany({
            where: {
                schoolId: this.schoolId,
                isActive: true
            }
        })
        this.timeSlotsCache = timeSlots

        // Initialize teacher availability
        const teachers = await db.user.findMany({
            where: {
                schoolId: this.schoolId,
                role: { in: ['TEACHER', 'TRAINER'] },
                isActive: true
            }
        })

        teachers.forEach((person: any) => {
            this.teacherAvailability[person.id] = new Set()
        })

        // Initialize class availability
        const classes = await db.class.findMany({
            where: { schoolId: this.schoolId }
        })

        classes.forEach((cls: any) => {
            this.classAvailability[cls.id] = new Set()
        })
    }

    /**
     * GET TEACHER CONSTRAINTS
     * Gets teacher availability constraints
     */
    private async getTeacherConstraints(teacherId: string): Promise<{
        unavailableDays: string[]
        unavailablePeriods: string[]
    }> {
        const teacher = await db.user.findUnique({
            where: { id: teacherId },
            select: {
                unavailableDays: true,
                unavailablePeriods: true
            }
        })

        return {
            unavailableDays: teacher?.unavailableDays || [],
            unavailablePeriods: teacher?.unavailablePeriods || []
        }
    }

    /**
     * SAVE TO DATABASE
     * Saves all scheduled lessons to the database
     */
    private async saveToDatabase(): Promise<void> {
        const lessonsToSave = this.scheduledLessons.map(lesson => ({
            id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            schoolId: this.schoolId,
            classId: lesson.classId,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId || null,
            moduleId: lesson.moduleId || null,
            timeSlotId: lesson.slot.timeSlotId,
            createdAt: new Date(),
            updatedAt: new Date(),
            shift: 'MORNING'
        }))

        if (lessonsToSave.length > 0) {
            await db.timetable.createMany({
                data: lessonsToSave
            })
            console.log(`💾 Saved ${lessonsToSave.length} lessons to database`)
        }
    }
}

// Export convenience function
export async function generateZeroConflictTimetable(schoolId: string) {
    const generator = new ZeroConflictTimetableGenerator(schoolId)
    return generator.generate()
}
