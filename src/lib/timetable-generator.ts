import { db } from '@/lib/db'
import { getModuleCategoryPriority, isMorningPeriod } from '@/lib/utils'
import { TimetableGenerationOptions, ConflictResolution } from '@/types'
import { PreparedLesson, prepareLessonsForSchool } from '@/lib/lesson-preparation'

// CPD (Continuous Professional Development) time slot constant for upper primary
// Time: 15:30-16:50 (last period of the day)
const CPD_TIME_SLOTS = {
    MONDAY: { period: 13, startTime: '15:30', endTime: '16:50' },
    TUESDAY: { period: 13, startTime: '15:30', endTime: '16:50' },
    WEDNESDAY: { period: 13, startTime: '15:30', endTime: '16:50' },
    THURSDAY: { period: 13, startTime: '15:30', endTime: '16:50' },
    FRIDAY: { period: 13, startTime: '15:30', endTime: '16:50' }
}

const UPPER_PRIMARY_LEVELS = ['P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6']

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

export class TimetableGenerator {
    private schoolId: string
    private scheduledLessons: ScheduledLesson[] = []
    private teacherAvailability: TeacherAvailability = {}
    private classAvailability: ClassAvailability = {}
    private conflicts: ConflictResolution[] = []
    private warnings: ConflictResolution[] = []  // For relaxed rules, NOT blocking errors
    private timeSlotsCache: any[] = [] // Cache time slots for break checking

    constructor(schoolId: string) {
        this.schoolId = schoolId
    }

    async generate(): Promise<{ success: boolean; conflicts: ConflictResolution[]; warnings: ConflictResolution[] }> {
        try {
            // Clear existing timetables for full school generation
            await db.timetable.deleteMany({
                where: { schoolId: this.schoolId }
            })

            // Initialize availability maps
            await this.initializeAvailability()

            // Load prepared lessons
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)

            // Sort by priority and time preference with TSS rules
            const sortedLessons = this.sortLessonsByPriorityAndTime(preparedLessons)

            // Load time slots for validation
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

            const validTimeSlots = timeSlots.filter((ts: any) => {
                const period = ts.period
                const day = ts.day
                const isValidPeriod = period >= 1 && period <= 13
                const isValidDay = day !== 'SATURDAY' && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day)
                const isNotBreak = !(ts as any).isBreak
                return isValidPeriod && isValidDay && isNotBreak
            })

            const totalPeriods = sortedLessons.reduce((sum, lesson) => sum + (lesson.blockSize || 1), 0)

            if (validTimeSlots.length < totalPeriods) {
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: `Not enough time slots available. Required: ${totalPeriods} periods, Available: ${validTimeSlots.length} slots. Please add more time slots or reduce lesson assignments.`
                    }],
                    warnings: []
                }
            }

            // Schedule each lesson
            for (const lesson of sortedLessons) {
                await this.scheduleLesson(lesson)
            }

            // Schedule CPD for upper primary classes (S1-S6) at 15:30-16:50
            await this.scheduleCPDForUpperPrimary()

            // Save all scheduled lessons to database
            await this.saveToDatabase()

            return {
                success: true,
                conflicts: this.conflicts,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('Timetable generation failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation failed due to an internal error'
                }],
                warnings: this.warnings
            }
        }
    }

    async generateForClass(classId: string, options: GenerationOptions = {}): Promise<{ success: boolean; conflicts: ConflictResolution[]; warnings: ConflictResolution[] }> {
        try {
            const { incremental = false, regenerate = false } = options

            // For incremental mode, preserve existing timetables unless regenerate is true
            if (!incremental || regenerate) {
                // Clear existing timetables for this specific class only
                await db.timetable.deleteMany({
                    where: {
                        schoolId: this.schoolId,
                        classId: classId
                    }
                })
            }

            // Initialize availability maps with existing timetables from OTHER classes only
            await this.initializeAvailabilityWithExistingTimetables(classId)

            // Load prepared lessons for the specific class only
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)
            const classLessons = preparedLessons.filter(lesson => lesson.classId === classId)

            if (classLessons.length === 0) {
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: 'No lessons found for the selected class'
                    }],
                    warnings: []
                }
            }

            // Sort by priority and time preference
            const sortedLessons = this.sortLessonsByPriorityAndTime(classLessons)

            // Load time slots for validation
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

            const validTimeSlots = timeSlots.filter((ts: any) => {
                const period = ts.period
                const day = ts.day
                const isValidPeriod = period >= 1 && period <= 13
                const isValidDay = day !== 'SATURDAY' && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day)
                const isNotBreak = !(ts as any).isBreak
                return isValidPeriod && isValidDay && isNotBreak
            })

            const totalPeriods = sortedLessons.reduce((sum, lesson) => sum + (lesson.blockSize || 1), 0)

            if (validTimeSlots.length < totalPeriods) {
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: `Not enough time slots available for class. Required: ${totalPeriods} periods, Available: ${validTimeSlots.length} slots. Please add more time slots or reduce lesson assignments for this class.`
                    }],
                    warnings: []
                }
            }

            // Schedule each lesson
            for (const lesson of sortedLessons) {
                await this.scheduleLesson(lesson)
            }

            // Save all scheduled lessons to database
            await this.saveToDatabase()

            return {
                success: true,
                conflicts: this.conflicts,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('Timetable generation for class failed:', error)
            console.error('Error name:', (error as Error).name)
            console.error('Error message:', (error as Error).message)
            console.error('Error stack:', (error as Error).stack)
            
            // Return a more informative error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: `Timetable generation for class failed: ${errorMessage}`
                }],
                warnings: this.warnings
            }
        }
    }

    async generateForTeacher(teacherId: string, options: GenerationOptions = {}): Promise<{ success: boolean; conflicts: ConflictResolution[]; warnings: ConflictResolution[] }> {
        try {
            const { incremental = false, regenerate = false } = options

            // For incremental mode, preserve existing timetables unless regenerate is true
            if (!incremental || regenerate) {
                // Clear existing timetables for this teacher across ALL classes
                await db.timetable.deleteMany({
                    where: {
                        schoolId: this.schoolId,
                        teacherId: teacherId
                    }
                })
            }

            // Initialize availability maps with existing timetables from OTHER teachers only
            await this.initializeAvailabilityWithExistingTimetables(undefined, teacherId)

            // Load prepared lessons for the specific teacher only
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)
            const teacherLessons = preparedLessons.filter(lesson => lesson.teacherId === teacherId)

            if (teacherLessons.length === 0) {
                return {
                    success: false,
                    conflicts: [{
                        type: 'unassigned',
                        message: 'No lessons found for the selected teacher'
                    }],
                    warnings: []
                }
            }

            // Sort by priority and time preference
            const sortedLessons = this.sortLessonsByPriorityAndTime(teacherLessons)

            // Schedule each lesson
            for (const lesson of sortedLessons) {
                await this.scheduleLesson(lesson)
            }

            // Save all scheduled lessons to database
            await this.saveToDatabase()

            return {
                success: true,
                conflicts: this.conflicts,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('Timetable generation for teacher failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for teacher failed due to an internal error'
                }],
                warnings: this.warnings
            }
        }
    }

    private async initializeAvailability() {
        // Get all time slots for the school
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
        
        // Cache time slots for break checking
        this.timeSlotsCache = timeSlots

        // Initialize teacher and trainer availability
        const teachersAndTrainers = await db.user.findMany({
            where: {
                schoolId: this.schoolId,
                role: { in: ['TEACHER', 'TRAINER'] },
                isActive: true
            }
        })

        teachersAndTrainers.forEach((person: any) => {
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

    private async initializeAvailabilityWithExistingTimetables(excludeClassId?: string, excludeTeacherId?: string) {
        // Get all time slots for the school
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
        
        // Cache time slots for break checking
        this.timeSlotsCache = timeSlots

        // Initialize teacher and trainer availability
        const teachersAndTrainers = await db.user.findMany({
            where: {
                schoolId: this.schoolId,
                role: { in: ['TEACHER', 'TRAINER'] },
                isActive: true
            }
        })

        teachersAndTrainers.forEach((person: any) => {
            this.teacherAvailability[person.id] = new Set()
        })

        // Initialize class availability
        const classes = await db.class.findMany({
            where: { schoolId: this.schoolId }
        })

        classes.forEach((cls: any) => {
            this.classAvailability[cls.id] = new Set()
        })

        // Load existing timetables with exclusions
        const existingTimetablesWhereClause: any = {
            schoolId: this.schoolId
        }
        
        // Apply exclusions for class-specific or teacher-specific generation
        if (excludeClassId) {
            existingTimetablesWhereClause.classId = {
                not: excludeClassId
            }
        }
        
        if (excludeTeacherId) {
            existingTimetablesWhereClause.teacherId = {
                not: excludeTeacherId
            }
        }

        const existingTimetables = await db.timetable.findMany({
            where: existingTimetablesWhereClause,
            include: {
                timeSlot: {
                    select: {
                        day: true,
                        period: true
                    }
                },
                class: {
                    select: {
                        name: true
                    }
                },
                teacher: {
                    select: {
                        name: true
                    }
                }
            }
        })

        // Mark occupied slots from existing timetables (global teacher availability)
        for (const timetable of existingTimetables) {
            // CRITICAL: Skip if teacherId or classId is missing
            if (!timetable.teacherId || !timetable.classId) {
                console.warn(`⚠️ Skipping timetable entry with missing teacher or class ID:`, timetable)
                continue
            }
            
            // CRITICAL: Ensure availability maps have entries for this teacher/class
            if (!this.teacherAvailability[timetable.teacherId]) {
                this.teacherAvailability[timetable.teacherId] = new Set()
            }
            if (!this.classAvailability[timetable.classId]) {
                this.classAvailability[timetable.classId] = new Set()
            }
            
            const slotKey = `${timetable.timeSlot.day}-${timetable.timeSlot.period}`
            
            // Mark teacher as unavailable (global across all classes)
            this.teacherAvailability[timetable.teacherId].add(slotKey)
            
            // Mark class as unavailable
            this.classAvailability[timetable.classId].add(slotKey)
        }

        console.log(`Loaded ${existingTimetables.length} existing timetable entries for global teacher availability check`)
    }

    private sortLessonsByPriorityAndTime(lessons: PreparedLesson[]): PreparedLesson[] {
        // ENHANCED SORTING WITH STRICT CONSECUTIVE-PERIOD HANDLING
        //
        // RULE 1: HIGH-PERIOD SUBJECTS (5+ periods/week) - placed FIRST
        //         Must be distributed evenly across week
        //
        // RULE 2: MEDIUM-PERIOD SUBJECTS (3-4 periods/week) - placed NEXT
        //         Can have up to 2 consecutive periods
        //
        // RULE 3: LOW-PERIOD SUBJECTS (1-2 periods/week) - placed LAST
        //         Fill remaining gaps, no consecutiveness forced
        //
        // CONSECUTIVE PERIOD RULES:
        // - Max 2 consecutive periods for same subject (>2 weekly periods)
        // - If 2 consecutive causes conflict, reduce to 1 period
        // - <2 weekly periods: no consecutiveness forced

        return lessons.sort((a, b) => {
            // Calculate period categories for sorting
            const getPeriodCategory = (lesson: PreparedLesson): number => {
                const periods = lesson.periodsPerWeek || lesson.totalLessons || 2
                if (periods >= 5) return 1  // HIGH-PERIOD: highest priority
                if (periods >= 3) return 2  // MEDIUM-PERIOD: normal priority
                return 3  // LOW-PERIOD: lowest priority (fill gaps)
            }

            // First, sort by period category (HIGH -> MEDIUM -> LOW)
            const categoryA = getPeriodCategory(a)
            const categoryB = getPeriodCategory(b)
            
            if (categoryA !== categoryB) {
                return categoryA - categoryB
            }

            // Within same category, sort by lesson type priority
            if (a.lessonType === 'TSS' && b.lessonType === 'TSS') {
                const categoryOrder = { 'SPECIFIC': 1, 'GENERAL': 2, 'COMPLEMENTARY': 3 }
                const aCategory = (a.moduleCategory || 'COMPLEMENTARY') as keyof typeof categoryOrder
                const bCategory = (b.moduleCategory || 'COMPLEMENTARY') as keyof typeof categoryOrder

                if (categoryOrder[aCategory] !== categoryOrder[bCategory]) {
                    return categoryOrder[aCategory] - categoryOrder[bCategory]
                }

                // Same category, prefer morning lessons for TSS
                if (a.preferredTime !== b.preferredTime) {
                    if (a.preferredTime === 'MORNING') return -1
                    if (b.preferredTime === 'MORNING') return 1
                }
            } else if (a.lessonType === 'TSS') {
                return -1
            } else if (b.lessonType === 'TSS') {
                return 1
            }

            // For regular subjects, prioritize Mathematics and Physics (high-load subjects)
            const isMathPhysicsA = a.subjectName?.toLowerCase().includes('mathematics') || a.subjectName?.toLowerCase().includes('physics')
            const isMathPhysicsB = b.subjectName?.toLowerCase().includes('mathematics') || b.subjectName?.toLowerCase().includes('physics')

            if (isMathPhysicsA && !isMathPhysicsB) return -1
            if (!isMathPhysicsA && isMathPhysicsB) return 1

            // For non-priority subjects, sort by periods per week (higher = more urgent)
            if (a.priority !== b.priority) {
                return b.priority - a.priority
            }

            // Finally by total lessons (higher first)
            return b.totalLessons - a.totalLessons
        })
    }

    private async scheduleLesson(lesson: PreparedLesson) {
        const { periodsPerWeek = 2 } = lesson
        
        // CRITICAL: Skip lessons with zero periods per week
        if (!periodsPerWeek || periodsPerWeek <= 0) {
            console.warn(`⚠️ Skipping lesson ${lesson.subjectId || lesson.moduleId} - invalid periodsPerWeek: ${periodsPerWeek}`)
            return
        }
        
        console.log(`🎯 STARTING LESSON SCHEDULING: ${lesson.subjectId || lesson.moduleId} - ${periodsPerWeek} periods/week`)

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

        // CRITICAL: Ensure timeSlots is an array and has data
        if (!timeSlots || timeSlots.length === 0) {
            console.error(`❌ No time slots found for school ${this.schoolId}`)
            this.conflicts.push({
                type: 'unassigned',
                message: 'No time slots configured for this school. Please set up time slots first.'
            })
            return
        }

        // Update cache for break checking
        this.timeSlotsCache = timeSlots

        // Get teacher availability constraints
        const teacherConstraints = await this.getTeacherConstraints(lesson.teacherId)

        // CRITICAL: Get ALL available time slots for force-placement
        const allValidTimeSlots = timeSlots.filter((ts: any) => {
            const period = ts.period
            const day = ts.day
            const isValidPeriod = period >= 1 && period <= 13
            const isValidDay = day !== 'SATURDAY' && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day)
            const isNotBreak = !(ts as any).isBreak
            
            // Filter out CPD periods for applicable levels
            const isSecondarySchool = lesson.level?.startsWith('S')
            const isUpperPrimary = lesson.level?.startsWith('P') && 
                                   (lesson.level >= 'P4' && lesson.level <= 'P6')
            const isCPDApplicable = isSecondarySchool || isUpperPrimary
            const isCPDPeriod = (ts as any).isCPD === true
            
            if (isCPDApplicable && isCPDPeriod) return false
            
            return isValidPeriod && isValidDay && isNotBreak
        })

        console.log(`📊 VALID TIME SLOTS: ${allValidTimeSlots.length} slots available`)

        // Ensure availability maps exist
        if (!this.teacherAvailability[lesson.teacherId]) {
            this.teacherAvailability[lesson.teacherId] = new Set()
        }
        if (!this.classAvailability[lesson.classId]) {
            this.classAvailability[lesson.classId] = new Set()
        }

        // ============================================================
        // ALGORITHM: For each subject in a class:
        //   IF subject.periods >= 2:
        //     TRY schedule max 2 consecutive periods
        //     IF not possible:
        //       schedule as single periods in available free slots
        //   ELSE:
        //     schedule single periods anywhere free
        // ============================================================

        const maxConsecutive = 2
        let periodsScheduled = 0

        while (periodsScheduled < periodsPerWeek) {
            const remainingPeriods = periodsPerWeek - periodsScheduled
            
            // Determine block size for this iteration
            // If we have 2+ periods remaining, try 2 consecutive
            // Otherwise, schedule as single
            const useConsecutive = remainingPeriods >= 2
            const blockSize = useConsecutive ? 2 : 1

            console.log(`🔄 Scheduling block of ${blockSize} period(s) (${periodsScheduled + 1}/${periodsPerWeek})`)

            // Try to schedule this block
            const scheduled = this.tryScheduleBlock(lesson, allValidTimeSlots, teacherConstraints, blockSize)
            
            if (scheduled) {
                periodsScheduled += blockSize
                console.log(`✅ Scheduled ${blockSize} period(s), total: ${periodsScheduled}/${periodsPerWeek}`)
            } else {
                // If consecutive failed and we were trying consecutive, try single
                if (useConsecutive) {
                    console.log(`⚠️ Consecutive failed, trying single period...`)
                    const singleScheduled = this.tryScheduleBlock(lesson, allValidTimeSlots, teacherConstraints, 1)
                    
                    if (singleScheduled) {
                        periodsScheduled += 1
                        console.log(`✅ Scheduled single period, total: ${periodsScheduled}/${periodsPerWeek}`)
                    } else {
                        // No slots available at all for this iteration
                        console.log(`❌ No slots available for ${lesson.subjectName || lesson.moduleName}`)
                        
                        // Try force placement in any available slot
                        const forcePlaced = this.tryForcePlace(lesson, allValidTimeSlots, teacherConstraints)
                        
                        if (forcePlaced) {
                            periodsScheduled += 1
                            console.log(`🚨 Force-placed single period, total: ${periodsScheduled}/${periodsPerWeek}`)
                        } else {
                            // Critical failure - no slots at all
                            const teacherName = lesson.teacherName || await this.getTeacherName(lesson.teacherId)
                            const className = lesson.className || await this.getClassName(lesson.classId)
                            
                            this.conflicts.push({
                                type: 'unassigned',
                                message: `CRITICAL: No slots available for ${lesson.subjectName || lesson.moduleName} for ${teacherName} in ${className}`
                            })
                            console.error(`❌ CRITICAL: Could not schedule ${lesson.subjectId || lesson.moduleId} - no slots available`)
                            return
                        }
                    }
                } else {
                    // Single period failed - try force placement
                    const forcePlaced = this.tryForcePlace(lesson, allValidTimeSlots, teacherConstraints)
                    
                    if (forcePlaced) {
                        periodsScheduled += 1
                        console.log(`🚨 Force-placed single period, total: ${periodsScheduled}/${periodsPerWeek}`)
                    } else {
                        const teacherName = lesson.teacherName || await this.getTeacherName(lesson.teacherId)
                        const className = lesson.className || await this.getClassName(lesson.classId)
                        
                        this.conflicts.push({
                            type: 'unassigned',
                            message: `CRITICAL: No slots available for ${lesson.subjectName || lesson.moduleName} for ${teacherName} in ${className}`
                        })
                        console.error(`❌ CRITICAL: Could not schedule ${lesson.subjectId || lesson.moduleId} - no slots available`)
                        return
                    }
                }
            }
        }

        console.log(`✅ COMPLETED: ${periodsPerWeek} periods scheduled for ${lesson.subjectId || lesson.moduleId}`)
    }

    /**
     * Try to schedule a block of consecutive periods
     * Returns true if successful
     */
    private tryScheduleBlock(
        lesson: PreparedLesson,
        validTimeSlots: any[],
        teacherConstraints: any,
        blockSize: number
    ): boolean {
        // Sort slots for even distribution
        const slotsToTry = this.sortSlotsForEvenDistribution(
            [...validTimeSlots], 
            lesson.teacherId, 
            lesson.classId, 
            (lesson.periodsPerWeek || 0) >= 5
        )

        for (const timeSlot of slotsToTry) {
            const slotKey = `${timeSlot.day}-${timeSlot.period}`

            // Check teacher constraints
            if (teacherConstraints.unavailableDays?.includes(timeSlot.day)) continue
            if (teacherConstraints.unavailablePeriods?.includes(timeSlot.period.toString())) continue

            // Check if block fits within P1-P10
            const endPeriod = timeSlot.period + blockSize - 1
            if (endPeriod > 10) {
                continue // Cannot schedule beyond P10
            }

            // Check if block can be scheduled (teacher and class available)
            if (!this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, blockSize)) {
                continue
            }

            // Check availability
            const teacherAvailable = !this.teacherAvailability[lesson.teacherId].has(slotKey)
            const classAvailable = !this.classAvailability[lesson.classId].has(slotKey)

            if (!teacherAvailable || !classAvailable) continue

            // Check consecutive limit (max 2)
            if (!this.canScheduleConsecutive(lesson.teacherId, timeSlot.day, timeSlot.period, 2)) continue

            // Schedule the block
            this.scheduleBlock(lesson, timeSlot, blockSize)
            return true
        }

        return false
    }

    /**
     * LAST RESORT: Force-place a lesson in ANY available slot
     * Ignores all soft rules - only respects hard constraints (teacher/class availability)
     */
    private tryForcePlace(lesson: PreparedLesson, validTimeSlots: any[], teacherConstraints: any): boolean {
        // Sort by availability (prefer slots with fewer conflicts)
        const slotsByPriority = this.sortSlotsByAvailability([...validTimeSlots], lesson.teacherId, lesson.classId)

        for (const timeSlot of slotsByPriority) {
            const slotKey = `${timeSlot.day}-${timeSlot.period}`

            // ONLY check hard constraints: teacher and class availability
            const teacherAvailable = !this.teacherAvailability[lesson.teacherId].has(slotKey)
            const classAvailable = !this.classAvailability[lesson.classId].has(slotKey)

            if (teacherAvailable && classAvailable) {
                // Force place as single period
                this.scheduleBlock(lesson, timeSlot, 1)
                return true
            }
        }

        return false
    }

    /**
     * Sort slots by availability (slots with fewer conflicts first)
     */
    private sortSlotsByAvailability(slots: any[], teacherId: string, classId: string): any[] {
        return slots.sort((a, b) => {
            const aKey = `${a.day}-${a.period}`
            const bKey = `${b.day}-${b.period}`
            
            const aTeacherBusy = this.teacherAvailability[teacherId]?.has(aKey) ? 1 : 0
            const aClassBusy = this.classAvailability[classId]?.has(aKey) ? 1 : 0
            const bTeacherBusy = this.teacherAvailability[teacherId]?.has(bKey) ? 1 : 0
            const bClassBusy = this.classAvailability[classId]?.has(bKey) ? 1 : 0

            const aScore = aTeacherBusy + aClassBusy
            const bScore = bTeacherBusy + bClassBusy

            if (aScore !== bScore) return aScore - bScore
            
            // Tie-breaker: prefer morning, then earlier periods
            if (a.session !== b.session) {
                return a.session === 'MORNING' ? -1 : 1
            }
            return a.period - b.period
        })
    }

    /**
     * Schedule a block of periods for a lesson
     */
    private scheduleBlock(lesson: PreparedLesson, timeSlot: any, blockSize: number) {
        for (let i = 0; i < blockSize; i++) {
            const currentPeriod = timeSlot.period + i
            const currentSlotKey = `${timeSlot.day}-${currentPeriod}`

            const currentTimeSlot = this.timeSlotsCache?.find((ts: any) => ts.day === timeSlot.day && ts.period === currentPeriod)
            
            if (!currentTimeSlot || (currentTimeSlot as any).isBreak) {
                console.warn(`⚠️ Skipping period ${currentPeriod} on ${timeSlot.day} - invalid slot or break`)
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

            this.teacherAvailability[lesson.teacherId].add(currentSlotKey)
            this.classAvailability[lesson.classId].add(currentSlotKey)
        }

        console.log(`✅ Scheduled ${blockSize} period(s) for ${lesson.subjectId || lesson.moduleId} at ${timeSlot.day}-${timeSlot.period}`)
    }

    private sortSlotsForEvenDistribution(slots: any[], teacherId: string, classId: string, isHighPeriodSubject: boolean = false): any[] {
        // Count current lessons per day for this teacher and class
        const teacherLessonsByDay = new Map<string, number>()
        const classLessonsByDay = new Map<string, number>()

        // Count existing scheduled lessons
        this.scheduledLessons.forEach(lesson => {
            if (lesson.teacherId === teacherId) {
                const count = teacherLessonsByDay.get(lesson.slot.day) || 0
                teacherLessonsByDay.set(lesson.slot.day, count + 1)
            }
            if (lesson.classId === classId) {
                const count = classLessonsByDay.get(lesson.slot.day) || 0
                classLessonsByDay.set(lesson.slot.day, count + 1)
            }
        })

        // Sort slots by combined score (lower is better - prefers days with fewer lessons)
        return slots.sort((a, b) => {
            const teacherScoreA = teacherLessonsByDay.get(a.day) || 0
            const classScoreA = classLessonsByDay.get(a.day) || 0
            const totalScoreA = teacherScoreA + classScoreA

            const teacherScoreB = teacherLessonsByDay.get(b.day) || 0
            const classScoreB = classLessonsByDay.get(b.day) || 0
            const totalScoreB = teacherScoreB + classScoreB

            // ENHANCED: For high-period subjects, prioritize spreading across DIFFERENT days
            if (isHighPeriodSubject && totalScoreA === totalScoreB) {
                // If same score, prefer different days for high-period subjects
                // This helps distribute the subject across the week
                if (a.day !== b.day) {
                    // Prefer days with fewer periods already scheduled for this subject
                    const subjectLessonsOnA = this.scheduledLessons.filter(
                        l => l.classId === classId && 
                             (l.subjectId === a.subjectId || l.moduleId === a.moduleId) &&
                             l.slot.day === a.day
                    ).length
                    
                    const subjectLessonsOnB = this.scheduledLessons.filter(
                        l => l.classId === classId && 
                             (l.subjectId === b.subjectId || l.moduleId === b.moduleId) &&
                             l.slot.day === b.day
                    ).length
                    
                    return subjectLessonsOnA - subjectLessonsOnB
                }
            }

            // If scores are equal, maintain original order (by period)
            if (totalScoreA === totalScoreB) {
                if (a.day === b.day) {
                    return a.period - b.period
                }
                return a.day.localeCompare(b.day)
            }

            return totalScoreA - totalScoreB
        })
    }

    private canScheduleBlock(teacherId: string, classId: string, day: string, startPeriod: number, blockSize: number): boolean {
        // ENFORCE STRICT CORE TIME RULE: ALL lessons MUST be within 08:00-16:50 (P1-P10)
        // NO EXCEPTIONS - reject any block that extends beyond P10

        // CRITICAL: Check if the block would extend beyond P10 (16:50)
        const endPeriod = startPeriod + blockSize - 1
        if (endPeriod > 10) {
            console.log(`❌ BLOCK REJECTED: End period ${endPeriod} exceeds P10 (16:50) limit`)
            return false // Cannot schedule beyond period 10 (16:50)
        }

        // ENFORCE START TIME RULE: Cannot start before P1 (08:00)
        if (startPeriod < 1) {
            console.log(`❌ BLOCK REJECTED: Start period ${startPeriod} is before P1 (08:00)`)
            return false // Cannot schedule before period 1 (08:00)
        }
        
        for (let i = 0; i < blockSize; i++) {
            const period = startPeriod + i
            const slotKey = `${day}-${period}`
            
            // Check if period exists and is not a break
            const timeSlot = this.timeSlotsCache?.find(ts => ts.day === day && ts.period === period)
            if (!timeSlot || timeSlot.isBreak) {
                return false // Cannot schedule on break periods
            }
            
            // Check teacher and class availability
            const teacherAvailable = !this.teacherAvailability[teacherId]?.has(slotKey)
            const classAvailable = !this.classAvailability[classId]?.has(slotKey)
            
            if (!teacherAvailable || !classAvailable) {
                return false
            }
        }
        
        return true
    }

    private isTeacherOverbooked(teacherId: string): boolean {
        // Check if teacher has many scheduled lessons that might indicate overbooking
        const teacherLessons = this.scheduledLessons.filter(lesson => lesson.teacherId === teacherId)
        return teacherLessons.length > 10 // Threshold for potential overbooking
    }

    private canScheduleConsecutive(teacherId: string, day: string, period: number, maxConsecutive: number = 2): boolean {
        const teacherSlots = Array.from(this.teacherAvailability[teacherId] || [])
            .filter(slot => slot.startsWith(day))
            .map(slot => parseInt(slot.split('-')[1]))
            .sort((a, b) => a - b)

        // Check if scheduling this period would create more than maxConsecutive consecutive periods
        const consecutiveBefore = this.getConsecutiveCount(teacherSlots, period - 1)
        const consecutiveAfter = this.getConsecutiveCount(teacherSlots, period + 1)

        return (consecutiveBefore < maxConsecutive) && (consecutiveAfter < maxConsecutive)
    }

    /**
     * ENFORCE MAXIMUM CONSECUTIVE PERIODS RULE FOR SAME SUBJECT
     * 
     * RULE: Max 2 consecutive periods for the same subject
     * - If placing 2 consecutive periods causes a conflict, reduce to 1
     * - Never allow more than 2 consecutive periods for same subject
     */
    private canScheduleMaxConsecutivePeriods(
        teacherId: string, 
        classId: string, 
        day: string, 
        period: number, 
        subjectId: string | undefined,
        maxConsecutive: number = 2
    ): boolean {
        // Get all scheduled lessons for this teacher on this day
        const teacherLessonsOnDay = this.scheduledLessons.filter(
            lesson => lesson.teacherId === teacherId && lesson.slot.day === day
        )
        
        // Count consecutive periods for the SAME subject
        let consecutiveCount = 0
        
        // Check periods before
        let checkPeriod = period - 1
        while (checkPeriod >= 1) {
            const slotKey = `${day}-${checkPeriod}`
            const isOccupied = this.teacherAvailability[teacherId]?.has(slotKey) || 
                             this.classAvailability[classId]?.has(slotKey)
            
            if (isOccupied) {
                // Check if this is the same subject
                const lessonAtPeriod = teacherLessonsOnDay.find(
                    l => l.slot.period === checkPeriod &&
                         (l.subjectId === subjectId || l.moduleId === subjectId)
                )
                if (lessonAtPeriod) {
                    consecutiveCount++
                    checkPeriod--
                } else {
                    break
                }
            } else {
                break
            }
        }
        
        // Check periods after (but only for this specific block, not future periods)
        // The actual scheduling will handle the future periods
        
        // Return true if we haven't exceeded max consecutive
        return consecutiveCount < maxConsecutive
    }

    private getConsecutiveCount(slots: number[], period: number): number {
        let count = 0
        let current = period

        while (slots.includes(current)) {
            count++
            current++
        }

        return count
    }

    private async getTeacherName(teacherId: string): Promise<string> {
        const teacher = await db.user.findUnique({
            where: { id: teacherId },
            select: { name: true }
        })
        return teacher?.name || 'Unknown Teacher'
    }

    private async getClassName(classId: string): Promise<string> {
        const cls = await db.class.findUnique({
            where: { id: classId },
            select: { name: true }
        })
        return cls?.name || 'Unknown Class'
    }

    private async getSubjectName(subjectId: string): Promise<string> {
        const subject = await db.subject.findUnique({
            where: { id: subjectId },
            select: { name: true }
        })
        return subject?.name || 'Unknown Subject'
    }

    private async getModuleName(moduleId: string): Promise<string> {
        const module = await db.module.findUnique({
            where: { id: moduleId },
            select: { name: true }
        })
        return module?.name || 'Unknown Module'
    }

    private async getTeacherConstraints(teacherId: string): Promise<{
        unavailableDays: string[] | null
        unavailablePeriods: string[] | null
    }> {
        const teacher = await db.user.findUnique({
            where: { id: teacherId },
            select: {
                unavailableDays: true,
                unavailablePeriods: true
            } as any
        }) as any

        return {
            unavailableDays: teacher?.unavailableDays || null,
            unavailablePeriods: teacher?.unavailablePeriods || null
        }
    }

    /**
     * Get teacher's current workload across all classes for scope analysis
     */
    private async getTeacherWorkload(teacherId: string): Promise<{
        totalLessons: number
        classesCount: number
        subjectsCount: number
        dailyDistribution: Record<string, number>
    }> {
        const scheduledLessons = this.scheduledLessons.filter(lesson => lesson.teacherId === teacherId)
        const classIds = new Set(scheduledLessons.map(l => l.classId))
        
        // Get all assignments for this teacher across school
        const allAssignments = await this.getTeacherAllAssignments(teacherId)
        const subjectIds = new Set(allAssignments.map(a => a.subjectId || a.moduleId).filter(Boolean))

        // Calculate daily distribution
        const dailyDistribution: Record<string, number> = {}
        scheduledLessons.forEach(lesson => {
            dailyDistribution[lesson.slot.day] = (dailyDistribution[lesson.slot.day] || 0) + 1
        })

        return {
            totalLessons: scheduledLessons.length,
            classesCount: classIds.size,
            subjectsCount: subjectIds.size,
            dailyDistribution
        }
    }

    /**
     * Get ALL teacher assignments across school for full scope analysis
     * This includes assignments from ALL classes, subjects, and modules
     */
    private async getTeacherAllAssignments(teacherId: string): Promise<Array<{
        classId: string
        subjectId?: string
        moduleId?: string
        level: string
        type: 'PRIMARY' | 'SECONDARY' | 'TSS'
    }>> {
        const assignments: Array<{
            classId: string
            subjectId?: string
            moduleId?: string
            level: string
            type: 'PRIMARY' | 'SECONDARY' | 'TSS'
        }> = []

        // Get teacher-class-subject assignments (Primary/Secondary)
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: { teacherId },
            include: {
                class: { select: { level: true } },
                subject: { select: { level: true } }
            }
        })

        teacherClassSubjects.forEach((assignment: any) => {
            assignments.push({
                classId: assignment.classId,
                subjectId: assignment.subjectId,
                level: assignment.class.level || assignment.subject.level || 'Unknown',
                type: this.determineSchoolType(assignment.class.level || assignment.subject.level || '')
            })
        })

        // Get trainer-class-module assignments (TSS)
        const trainerClassModules = await db.trainerClassModule.findMany({
            where: { trainerId: teacherId },
            include: {
                class: { select: { level: true } },
                module: { select: { level: true } }
            }
        })

        trainerClassModules.forEach((assignment: any) => {
            assignments.push({
                classId: assignment.classId,
                moduleId: assignment.moduleId,
                level: assignment.class.level || assignment.module.level || 'Unknown',
                type: 'TSS' as const
            })
        })

        return assignments
    }

    /**
     * Determine school type based on class level
     */
    private determineSchoolType(level: string): 'PRIMARY' | 'SECONDARY' | 'TSS' {
        if (['L3', 'L4', 'L5'].includes(level)) {
            return 'TSS'
        }
        if (level.startsWith('S')) {
            return 'SECONDARY'
        }
        if (level.startsWith('P')) {
            return 'PRIMARY'
        }
        return 'SECONDARY' // default
    }

    /**
     * Check if scheduling would maintain workload balance across teacher's classes
     */
    private isWorkloadBalanced(teacherId: string, targetClassId: string, day: string): boolean {
        const teacherLessons = this.scheduledLessons.filter(lesson => lesson.teacherId === teacherId)
        
        if (teacherLessons.length === 0) return true // First lesson for teacher

        // Count lessons per class for this teacher
        const lessonsByClass = new Map<string, number>()
        teacherLessons.forEach(lesson => {
            const count = lessonsByClass.get(lesson.classId) || 0
            lessonsByClass.set(lesson.classId, count + 1)
        })

        // Count lessons for target class on this day
        const targetClassDayLessons = teacherLessons.filter(
            lesson => lesson.classId === targetClassId && lesson.slot.day === day
        ).length

        // Prevent overloading a single class on a single day
        // Allow max 3 lessons per class per day for any teacher
        if (targetClassDayLessons >= 3) {
            return false
        }

        return true
    }

    private async saveToDatabase() {
        for (const lesson of this.scheduledLessons) {
            // CRITICAL: Skip lessons with invalid or missing timeSlotId
            if (!lesson.slot.timeSlotId) {
                console.warn(`⚠️ Skipping save for lesson - missing timeSlotId:`, lesson)
                continue
            }
            
            // CRITICAL: Skip lessons with invalid classId or teacherId
            if (!lesson.classId || !lesson.teacherId) {
                console.warn(`⚠️ Skipping save for lesson - missing classId or teacherId:`, lesson)
                continue
            }
            
            try {
                await db.timetable.create({
                    data: {
                        schoolId: this.schoolId,
                        classId: lesson.classId,
                        teacherId: lesson.teacherId,
                        subjectId: lesson.subjectId,
                        moduleId: lesson.moduleId,
                        timeSlotId: lesson.slot.timeSlotId
                    }
                })
            } catch (error) {
                console.error(`❌ Failed to save timetable entry for lesson:`, lesson, error)
                // Don't throw - continue with other lessons
            }
        }
    }

    /**
     * Generate timetables for all classes (without clearing existing teacher timetables)
     */
    async generateForAllClasses(): Promise<{ success: boolean; conflicts: ConflictResolution[]; warnings: ConflictResolution[] }> {
        try {
            // Clear existing timetables for classes only (keep teacher-specific ones)
            await db.timetable.deleteMany({
                where: { schoolId: this.schoolId }
            })

            // Initialize availability maps
            await this.initializeAvailability()

            // Load prepared lessons
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)

            // Sort by priority and time preference with TSS rules
            const sortedLessons = this.sortLessonsByPriorityAndTime(preparedLessons)

            // Schedule each lesson
            for (const lesson of sortedLessons) {
                await this.scheduleLesson(lesson)
            }

            // Save all scheduled lessons to database
            await this.saveToDatabase()

            return {
                success: true,
                conflicts: this.conflicts,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('Timetable generation for all classes failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for all classes failed due to an internal error'
                }],
                warnings: this.warnings
            }
        }
    }

    /**
     * Generate timetables for all teachers (without clearing existing class timetables)
     */
    async generateForAllTeachers(): Promise<{ success: boolean; conflicts: ConflictResolution[]; warnings: ConflictResolution[] }> {
        try {
            // Clear existing timetables for teachers only (but this also clears class timetables since they're linked)
            // Actually, timetables are shared - a single timetable entry has both classId and teacherId
            // So we need to clear all and regenerate
            await db.timetable.deleteMany({
                where: { schoolId: this.schoolId }
            })

            // Initialize availability maps
            await this.initializeAvailability()

            // Load prepared lessons
            const { lessons: preparedLessons } = await prepareLessonsForSchool(this.schoolId)

            // Sort by priority and time preference with TSS rules
            const sortedLessons = this.sortLessonsByPriorityAndTime(preparedLessons)

            // Schedule each lesson
            for (const lesson of sortedLessons) {
                await this.scheduleLesson(lesson)
            }

            // Save all scheduled lessons to database
            await this.saveToDatabase()

            return {
                success: true,
                conflicts: this.conflicts,
                warnings: this.warnings
            }
        } catch (error) {
            console.error('Timetable generation for all teachers failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for all teachers failed due to an internal error'
                }],
                warnings: this.warnings
            }
        }
    }

    /**
     * Schedule CPD (Continuous Professional Development) for upper primary classes (S1-S6)
     * CPD is scheduled at 15:30-16:50 (P13) for all weekdays
     */
    private async scheduleCPDForUpperPrimary(): Promise<void> {
        try {
            // Get all upper primary classes (S1-S6)
            const upperPrimaryClasses = await db.class.findMany({
                where: {
                    schoolId: this.schoolId,
                    level: { in: UPPER_PRIMARY_LEVELS }
                }
            })

            if (upperPrimaryClasses.length === 0) {
                console.log('No upper primary classes found for CPD scheduling')
                return
            }

            console.log(`Scheduling CPD for ${upperPrimaryClasses.length} upper primary classes: ${upperPrimaryClasses.map(c => c.name).join(', ')}`)

            // Find or get CPD subject
            let cpdSubject = await db.subject.findFirst({
                where: {
                    schoolId: this.schoolId,
                    name: 'CPD'
                }
            })

            // If CPD subject doesn't exist, we'll use a placeholder
            const cpdSubjectId = cpdSubject?.id || 'CPD_PLACEHOLDER'

            // Get time slots for CPD (15:30-16:50)
            const cpdTimeSlots = await db.timeSlot.findMany({
                where: {
                    schoolId: this.schoolId,
                    day: { in: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
                    startTime: '15:30',
                    isActive: true
                }
            })

            if (cpdTimeSlots.length === 0) {
                console.warn('No CPD time slots found (15:30-16:50). CPD will not be scheduled.')
                this.conflicts.push({
                    type: 'unassigned',
                    message: 'CPD time slots not configured. Please add time slots for 15:30-16:50.'
                })
                return
            }

            // For each upper primary class, schedule CPD for each weekday
            for (const classData of upperPrimaryClasses) {
                for (const timeSlot of cpdTimeSlots) {
                    const slotKey = `${timeSlot.day}-${timeSlot.period}`

                    // Check if class is already scheduled at this slot
                    if (this.classAvailability[classData.id]?.has(slotKey)) {
                        console.log(`Class ${classData.name} already has a lesson at ${timeSlot.day} P${timeSlot.period} - CPD not scheduled`)
                        continue
                    }

                    // Find a teacher for CPD (use school admin or any available teacher)
                    // For CPD, we can use a placeholder teacher
                    const cpdTeacher = await this.findAvailableTeacherForCPD(classData.id, timeSlot.day, timeSlot.period)

                    if (!cpdTeacher) {
                        console.warn(`No available teacher for CPD on ${timeSlot.day} for class ${classData.name}`)
                        continue
                    }

                    // Add to scheduled lessons
                    this.scheduledLessons.push({
                        teacherId: cpdTeacher,
                        subjectId: cpdSubjectId,
                        classId: classData.id,
                        slot: {
                            day: timeSlot.day,
                            period: timeSlot.period,
                            timeSlotId: timeSlot.id
                        },
                        priority: 0 // Low priority for CPD
                    })

                    // Mark class as unavailable
                    if (!this.classAvailability[classData.id]) {
                        this.classAvailability[classData.id] = new Set()
                    }
                    this.classAvailability[classData.id].add(slotKey)

                    // Mark teacher as unavailable
                    if (!this.teacherAvailability[cpdTeacher]) {
                        this.teacherAvailability[cpdTeacher] = new Set()
                    }
                    this.teacherAvailability[cpdTeacher].add(slotKey)

                    console.log(`✓ CPD scheduled for ${classData.name} on ${timeSlot.day} (15:30-16:50) with teacher ${cpdTeacher}`)
                }
            }

            console.log(`CPD scheduling complete for ${upperPrimaryClasses.length} upper primary classes`)
        } catch (error) {
            console.error('Error scheduling CPD:', error)
            this.conflicts.push({
                type: 'unassigned',
                message: `CPD scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
        }
    }

    /**
     * Find an available teacher for CPD
     */
    private async findAvailableTeacherForCPD(classId: string, day: string, period: number): Promise<string | null> {
        // First try to find a teacher who teaches this class
        const classTeacherSubjects = await db.teacherClassSubject.findMany({
            where: {
                classId: classId,
                schoolId: this.schoolId
            },
            include: {
                teacher: true
            }
        })

        const slotKey = `${day}-${period}`

        // Find an available teacher from the class's teachers
        for (const tcs of classTeacherSubjects) {
            const teacherAvailable = !this.teacherAvailability[tcs.teacherId]?.has(slotKey)
            const dayNotUnavailable = !tcs.teacher.unavailableDays?.includes(day)
            const periodNotUnavailable = !tcs.teacher.unavailablePeriods?.includes(period.toString())

            if (teacherAvailable && dayNotUnavailable && periodNotUnavailable) {
                return tcs.teacherId
            }
        }

        // If no class teacher is available, find any available teacher
        const allTeachers = await db.user.findMany({
            where: {
                schoolId: this.schoolId,
                role: 'TEACHER',
                isActive: true
            }
        })

        for (const teacher of allTeachers) {
            const teacherAvailable = !this.teacherAvailability[teacher.id]?.has(slotKey)
            const dayNotUnavailable = !teacher.unavailableDays?.includes(day)
            const periodNotUnavailable = !teacher.unavailablePeriods?.includes(period.toString())

            if (teacherAvailable && dayNotUnavailable && periodNotUnavailable) {
                return teacher.id
            }
        }

        // If no teacher is available, use a placeholder
        // This ensures CPD is still scheduled even without a specific teacher
        return 'CPD_PLACEHOLDER_TEACHER'
    }
}

export async function generateTimetable(schoolId: string, scope: SchoolScope = 'both') {
    const generator = new TimetableGenerator(schoolId)
    
    if (scope === 'all-classes') {
        return await generator.generateForAllClasses()
    } else if (scope === 'all-teachers') {
        return await generator.generateForAllTeachers()
    } else {
        return await generator.generate()
    }
}

export async function generateTimetableForClass(schoolId: string, classId: string, options: GenerationOptions = {}) {
    const generator = new TimetableGenerator(schoolId)
    return await generator.generateForClass(classId, options)
}

export async function generateTimetableForTeacher(schoolId: string, teacherId: string, options: GenerationOptions = {}) {
    const generator = new TimetableGenerator(schoolId)
    return await generator.generateForTeacher(teacherId, options)
}
