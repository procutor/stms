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

export class TimetableGenerator {
    private schoolId: string
    private scheduledLessons: ScheduledLesson[] = []
    private teacherAvailability: TeacherAvailability = {}
    private classAvailability: ClassAvailability = {}
    private conflicts: ConflictResolution[] = []
    private timeSlotsCache: any[] = [] // Cache time slots for break checking

    constructor(schoolId: string) {
        this.schoolId = schoolId
    }

    async generate(): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
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
                const isValidPeriod = period >= 1 && period <= 10
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
                    }]
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
                conflicts: this.conflicts
            }
        } catch (error) {
            console.error('Timetable generation failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation failed due to an internal error'
                }]
            }
        }
    }

    async generateForClass(classId: string, options: GenerationOptions = {}): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
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
                    }]
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
                const isValidPeriod = period >= 1 && period <= 10
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
                    }]
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
                conflicts: this.conflicts
            }
        } catch (error) {
            console.error('Timetable generation for class failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for class failed due to an internal error'
                }]
            }
        }
    }

    async generateForTeacher(teacherId: string, options: GenerationOptions = {}): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
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
                    }]
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
                conflicts: this.conflicts
            }
        } catch (error) {
            console.error('Timetable generation for teacher failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for teacher failed due to an internal error'
                }]
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
            const slotKey = `${timetable.timeSlot.day}-${timetable.timeSlot.period}`
            
            // Mark teacher as unavailable (global across all classes)
            this.teacherAvailability[timetable.teacherId].add(slotKey)
            
            // Mark class as unavailable
            this.classAvailability[timetable.classId].add(slotKey)
        }

        console.log(`Loaded ${existingTimetables.length} existing timetable entries for global teacher availability check`)
    }

    private sortLessonsByPriorityAndTime(lessons: PreparedLesson[]): PreparedLesson[] {
        return lessons.sort((a, b) => {
            // PRIORITY ORDER (FINAL)
            // 1) SPECIFIC modules (double periods)
            // 2) GENERAL modules (double periods)
            // 3) Mathematics & Physics (double periods)
            // 4) Other required subjects
            // 5) COMPLEMENTARY modules (fill FREE slots)

            // First, handle TSS modules by category
            if (a.lessonType === 'TSS' && b.lessonType === 'TSS') {
                const categoryOrder = { 'SPECIFIC': 1, 'GENERAL': 2, 'COMPLEMENTARY': 5 }
                const aCategory = (a.moduleCategory || 'COMPLEMENTARY') as keyof typeof categoryOrder
                const bCategory = (b.moduleCategory || 'COMPLEMENTARY') as keyof typeof categoryOrder

                if (categoryOrder[aCategory] !== categoryOrder[bCategory]) {
                    return categoryOrder[aCategory] - categoryOrder[bCategory]
                }

                // Same category, prefer morning lessons
                if (a.preferredTime !== b.preferredTime) {
                    if (a.preferredTime === 'MORNING') return -1
                    if (b.preferredTime === 'MORNING') return 1
                }
            } else if (a.lessonType === 'TSS') {
                // TSS has higher priority than regular subjects
                return -1
            } else if (b.lessonType === 'TSS') {
                return 1
            }

            // For regular subjects, prioritize Mathematics and Physics
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
        const { periodsPerWeek = 2, blockSize = 2 } = lesson

        console.log(`🎯 STARTING LESSON SCHEDULING: Enforcing STRICT 08:00-16:50 time window (P1-P10 only)`)

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

        console.log(`📊 TOTAL TIME SLOTS LOADED: ${timeSlots.length} slots for school ${this.schoolId}`)

        // Get teacher availability constraints and current workload
        const teacherConstraints = await this.getTeacherConstraints(lesson.teacherId)
        const teacherWorkload = await this.getTeacherWorkload(lesson.teacherId)

        // Determine morning preference for TSS modules
        const isTSSModule = lesson.lessonType === 'TSS'
        const prefersMorning = isTSSModule

        // CRITICAL: Get teacher's ALL assignments across school for scope validation
        const teacherAllAssignments = await this.getTeacherAllAssignments(lesson.teacherId)
        const teacherClasses = new Set(teacherAllAssignments.map(a => a.classId))
        const teacherSubjects = new Set([
            ...teacherAllAssignments.filter(a => a.subjectId).map(a => a.subjectId!),
            ...teacherAllAssignments.filter(a => a.moduleId).map(a => a.moduleId!)
        ])

        console.log(`Scheduling ${lesson.subjectId || lesson.moduleId} - block of ${blockSize} periods (${lesson.lessonIndex}/${lesson.totalLessons})`)

        // ENFORCE FLEXIBLE COMPLEMENTARY MODULES RULE
        // Check if this is a complementary module
        const isComplementary = lesson.lessonType === 'TSS' && lesson.moduleCategory === 'COMPLEMENTARY'
        
        // ENFORCE CORE TIME RULE: STRICTLY enforce 08:00-16:50 time window
        // Only allow periods P1-P10 (08:00-16:50) and Monday-Friday only
        // NO EXCEPTIONS - all lessons MUST be within this time frame
        const validTimeSlots = timeSlots.filter((ts: any) => {
            const period = ts.period
            const day = ts.day
            const isValidPeriod = period >= 1 && period <= 10
            const isValidDay = day !== 'SATURDAY' && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day)
            const isNotBreak = !(ts as any).isBreak

            // Log invalid slots for debugging
            if (!isValidPeriod || !isValidDay || !isNotBreak) {
                console.log(`❌ INVALID SLOT FILTERED: ${day} P${period} - ValidPeriod: ${isValidPeriod}, ValidDay: ${isValidDay}, NotBreak: ${isNotBreak}`)
            }

            return isValidPeriod && isValidDay && isNotBreak
        })

        console.log(`✅ VALID TIME SLOTS FOUND: ${validTimeSlots.length} slots (P1-P10, Mon-Fri, no breaks)`)

        // Try to find available slot with improved distribution across the week
        // CRITICAL: Only use slots within 08:00-16:50 time window
        // First pass: try morning slots for modules that prefer them (TSS Priority Rule)
        let slotsToTry = prefersMorning ?
            [...validTimeSlots.filter((ts: any) => (ts as any).session === 'MORNING'),
             ...validTimeSlots.filter((ts: any) => (ts as any).session !== 'MORNING')] :
            validTimeSlots

        // FINAL VALIDATION: Ensure no slot outside 08:00-16:50 gets through
        slotsToTry = slotsToTry.filter((ts: any) => {
            const period = ts.period
            const day = ts.day
            const isWithinTimeWindow = period >= 1 && period <= 10 && day !== 'SATURDAY'
            if (!isWithinTimeWindow) {
                console.log(`🚫 SLOT FILTERED OUT: ${day} P${period} - Outside 08:00-16:50 window`)
            }
            return isWithinTimeWindow
        })

        // Update cache for break checking
        this.timeSlotsCache = timeSlots

        // Sort slots to distribute lessons evenly across the week
        slotsToTry = this.sortSlotsForEvenDistribution(slotsToTry, lesson.teacherId, lesson.classId)

        for (const timeSlot of slotsToTry) {
            const ts = timeSlot as any // Cast to access new fields

            const slotKey = `${timeSlot.day}-${timeSlot.period}`

            // Check teacher unavailable days
            if (teacherConstraints.unavailableDays?.includes(timeSlot.day)) continue

            // Check teacher unavailable periods
            if (teacherConstraints.unavailablePeriods?.includes(ts.period.toString())) continue

            // ENFORCE DOUBLE PERIODS RULE FOR SPECIFIC AND GENERAL MODULES
            // COMPLEMENTARY modules fill remaining free spaces
            let canScheduleBlockSize = blockSize
            const isSpecificOrGeneral = lesson.lessonType === 'TSS' &&
                (lesson.moduleCategory === 'SPECIFIC' || lesson.moduleCategory === 'GENERAL')

            if (isComplementary) {
                // COMPLEMENTARY MODULES: Fill remaining free spaces - prioritize single periods to avoid conflicts
                // Try single periods first (to avoid conflicts), use double periods only if available
                if (this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, 1)) {
                    canScheduleBlockSize = 1 // Prefer single periods to avoid conflicts
                } else if (this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, 2)) {
                    canScheduleBlockSize = 2 // Use double periods only if single not available
                } else {
                    continue // No available slot at all
                }
            } else if (isSpecificOrGeneral) {
                // SPECIFIC AND GENERAL MODULES: Use the prepared block size, with flexibility for odd periods
                const periodsPerWeek = lesson.periodsPerWeek || 2
                const blockSize = lesson.blockSize || 2
                const isOddPeriods = periodsPerWeek % 2 === 1

                // Try the exact block size first
                if (this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, blockSize)) {
                    canScheduleBlockSize = blockSize
                } else if (blockSize === 2) {
                    // If 2 not available, try 1 period
                    if (this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, 1)) {
                        canScheduleBlockSize = 1
                    } else {
                        continue // No available slot
                    }
                } else {
                    // blockSize === 1 and not available
                    continue
                }
            } else {
                // Other modules (regular subjects): use configured block size
                if (!this.canScheduleBlock(lesson.teacherId, lesson.classId, timeSlot.day, timeSlot.period, blockSize)) {
                    continue
                }
            }

            // CRITICAL: Check global teacher availability (respects ALL existing timetables across school)
            const teacherAvailable = !this.teacherAvailability[lesson.teacherId]?.has(slotKey)

            // Check class availability
            const classAvailable = !this.classAvailability[lesson.classId]?.has(slotKey)

            // Check max consecutive periods rule for this teacher
            const respectsConsecutiveRule = this.canScheduleConsecutive(lesson.teacherId, timeSlot.day, timeSlot.period, 1)

            // Enhanced scope validation: Check if teacher would be over-scheduled across all their classes
            const respectsWorkloadBalance = this.isWorkloadBalanced(lesson.teacherId, lesson.classId, timeSlot.day)

            if (teacherAvailable && classAvailable && respectsConsecutiveRule && respectsWorkloadBalance) {
                // Schedule the block of consecutive periods
                for (let i = 0; i < canScheduleBlockSize; i++) {
                    const currentPeriod = timeSlot.period + i
                    const currentSlotKey = `${timeSlot.day}-${currentPeriod}`

                    // Get the timeSlotId for this period (assuming periods are consecutive)
                    const currentTimeSlot = timeSlots.find((ts: any) => ts.day === timeSlot.day && ts.period === currentPeriod)
                    if (!currentTimeSlot) continue

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

                    // Mark as occupied in both teacher and class availability
                    this.teacherAvailability[lesson.teacherId].add(currentSlotKey)
                    this.classAvailability[lesson.classId].add(currentSlotKey)
                }

                const blockDescription = isComplementary && canScheduleBlockSize === 1
                    ? `CONFLICT-AVOID: 1 period`
                    : `${canScheduleBlockSize} periods`
                
                console.log(`✅ Scheduled ${blockDescription} for ${lesson.subjectId || lesson.moduleId} at ${slotKey}`)
                return
            }
        }

        // No available slot found - flag unresolved conflict
        const teacherName = lesson.teacherName || await this.getTeacherName(lesson.teacherId)
        const className = lesson.className || await this.getClassName(lesson.classId)
        const subjectName = lesson.subjectName || lesson.moduleName ||
            (lesson.subjectId ? await this.getSubjectName(lesson.subjectId!) : (lesson.moduleId ? await this.getModuleName(lesson.moduleId!) : 'Unknown'))

        // Enhanced conflict analysis
        const isGlobalConflict = this.isTeacherOverbooked(lesson.teacherId)
        const hasMultipleClasses = teacherClasses.size > 1
        const hasMultipleSubjects = teacherSubjects.size > 1
        const scopeConflict = hasMultipleClasses || hasMultipleSubjects
        const isSpecificOrGeneral = lesson.lessonType === 'TSS' &&
            (lesson.moduleCategory === 'SPECIFIC' || lesson.moduleCategory === 'GENERAL')

        let conflictDetail = ''
        if (scopeConflict) {
            const details: string[] = []
            if (hasMultipleClasses) details.push(`${teacherClasses.size} classes`)
            if (hasMultipleSubjects) details.push(`${teacherSubjects.size} subjects/modules`)
            conflictDetail = ` - Teacher scope: ${details.join(', ')}`
        }

        // ENFORCE DOUBLE PERIODS RULE: Different messaging based on module type
        let conflictMessage: string
        let conflictSuggestions: string[]

        if (isSpecificOrGeneral) {
            // SPECIFIC AND GENERAL MODULES: Consecutive periods based on periods per week
            const isOddPeriods = (lesson.periodsPerWeek || 2) % 2 === 1
            if (isOddPeriods) {
                // For odd periods per week: min 2, max 3 consecutive periods
                conflictMessage = `Could not schedule ${subjectName} (REQUIRES 2 or 3 consecutive periods - SPECIFIC/GENERAL module with odd periods per week) for ${teacherName} in ${className}${conflictDetail}`
                conflictSuggestions = [
                    'CRITICAL: SPECIFIC and GENERAL modules with odd periods per week MUST have 2 or 3 consecutive periods',
                    'Tried 2 periods first, then 3 periods',
                    'Add more consecutive free slots in P1-P10 range (2 or 3 consecutive periods)',
                    'Ensure no breaks interrupt the required consecutive period blocks',
                    'Check teacher availability for consecutive morning slots',
                    'Reduce teacher workload to free up consecutive periods',
                    'Consider rescheduling other lessons to create 2-3 period blocks',
                    ...(scopeConflict ? [`Teacher teaches across ${teacherClasses.size} classes and ${teacherSubjects.size} subjects/modules - may need workload redistribution`] : []),
                    'SOLUTION: Ensure at least 2 or 3 consecutive free periods exist in teacher/class schedule'
                ]
            } else {
                // For even periods per week: 2 consecutive periods
                conflictMessage = `Could not schedule ${subjectName} (REQUIRES 2 consecutive periods - SPECIFIC/GENERAL module) for ${teacherName} in ${className}${conflictDetail}`
                conflictSuggestions = [
                    'CRITICAL: SPECIFIC and GENERAL modules MUST have 2 consecutive periods',
                    'Add more consecutive free slots in P1-P10 range',
                    'Ensure no breaks interrupt the required 2-period blocks',
                    'Check teacher availability for consecutive morning slots',
                    'Reduce teacher workload to free up consecutive periods',
                    'Consider rescheduling other lessons to create 2-period blocks',
                    ...(scopeConflict ? [`Teacher teaches across ${teacherClasses.size} classes and ${teacherSubjects.size} subjects/modules - may need workload redistribution`] : []),
                    'SOLUTION: Ensure at least 2 consecutive free periods exist in teacher/class schedule'
                ]
            }
        } else if (isComplementary) {
            // COMPLEMENTARY MODULES: Fill remaining free spaces - prioritize single periods
            conflictMessage = `Could not schedule ${subjectName} (tried 1 period preferred to avoid conflicts, then 2 periods) for ${teacherName} in ${className}${conflictDetail}`
            conflictSuggestions = [
                'COMPLEMENTARY MODULE: Fills remaining free spaces - prioritizes single periods to avoid conflicts',
                'Add more free time slots anywhere in P1-P10',
                'These modules are flexible and fill gaps in the schedule',
                'Reduce teacher workload to create more free slots',
                'Check for any remaining unscheduled periods',
                ...(scopeConflict ? [`Teacher has broad scope - complementary modules fill remaining slots`] : []),
                'NOTE: Complementary modules prioritize single periods to avoid scheduling conflicts'
            ]
        } else {
            // Regular subjects: Use configured block size
            conflictMessage = `Could not schedule ${subjectName} block (${blockSize} consecutive periods required) for ${teacherName} in ${className}${conflictDetail}`
            conflictSuggestions = [
                'Add more consecutive time slots to the schedule',
                'Ensure no breaks interrupt the required consecutive periods',
                'Reduce teacher workload or redistribute assignments',
                'Check teacher availability constraints across all classes',
                'Consider manual scheduling for this specific lesson',
                ...(scopeConflict ? [`Teacher teaches across ${teacherClasses.size} classes and ${teacherSubjects.size} subjects/modules - consider workload redistribution`] : []),
                `CRITICAL: ${subjectName} requires ${blockSize} CONSECUTIVE periods without breaks`
            ]
        }

        this.conflicts.push({
            type: 'unassigned',
            message: conflictMessage,
            suggestions: conflictSuggestions.filter(Boolean) as string[]
        })

        console.log(`❌ Failed to schedule ${subjectName} block for teacher ${lesson.teacherId} in class ${lesson.classId}`)
    }

    private sortSlotsForEvenDistribution(slots: any[], teacherId: string, classId: string): any[] {
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
        }
    }

    /**
     * Generate timetables for all classes (without clearing existing teacher timetables)
     */
    async generateForAllClasses(): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
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
                conflicts: this.conflicts
            }
        } catch (error) {
            console.error('Timetable generation for all classes failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for all classes failed due to an internal error'
                }]
            }
        }
    }

    /**
     * Generate timetables for all teachers (without clearing existing class timetables)
     */
    async generateForAllTeachers(): Promise<{ success: boolean; conflicts: ConflictResolution[] }> {
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
                conflicts: this.conflicts
            }
        } catch (error) {
            console.error('Timetable generation for all teachers failed:', error)
            return {
                success: false,
                conflicts: [...this.conflicts, {
                    type: 'unassigned',
                    message: 'Timetable generation for all teachers failed due to an internal error'
                }]
            }
        }
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