import { db } from '@/lib/db'
import { getModuleCategoryPriority } from '@/lib/utils'

export interface PreparedLesson {
    // Core lesson data
    teacherId: string
    subjectId?: string
    moduleId?: string
    classId: string

    // Lesson metadata
    lessonIndex: number
    totalLessons: number
    lessonType: 'PRIMARY' | 'SECONDARY' | 'TSS'

    // Scheduling preferences
    priority: number
    preferredTime: 'MORNING' | 'ANY'

    // Stream information
    streamType: 'PRIMARY' | 'SECONDARY' | 'TSS'
    level: string

    // Block scheduling
    blockSize?: number // Number of consecutive periods in this block
    periodsPerWeek?: number // Total periods per week for this subject/module
    moduleCategory?: string // SPECIFIC, GENERAL, COMPLEMENTARY

    // Assignment tracking
    teacherName?: string
    subjectName?: string
    moduleName?: string
    className?: string
}

export class LessonPreparationService {
    private schoolId: string

    constructor(schoolId: string) {
        this.schoolId = schoolId
    }

    /**
     * Prepare all lessons for scheduling using per-class assignments ONLY
     * Converts teacher-class-subject and trainer-class-module assignments into lesson units
     */
    async prepareLessons(): Promise<PreparedLesson[]> {
        const school = await db.school.findUnique({
            where: { id: this.schoolId }
        })

        if (!school) {
            throw new Error('School not found')
        }

        const lessons: PreparedLesson[] = []

        // Prepare lessons ONLY from per-class assignments
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: { schoolId: this.schoolId },
            include: {
                teacher: true,
                subject: true,
                class: true
            }
        })

        const trainerClassModules = await db.trainerClassModule.findMany({
            where: { schoolId: this.schoolId },
            include: {
                trainer: true,
                module: true,
                class: true
            }
        })

        // Process Teacher-Class-Subject assignments (Primary/Secondary)
        for (const assignment of teacherClassSubjects) {
            const schoolType = this.determineSchoolType(assignment.class.level || '')
            const level = assignment.class.level || assignment.subject.level || 'Unknown'
            const periodsPerWeek = assignment.subject.periodsPerWeek
            
            // ENFORCE DOUBLE PERIODS RULE: Maximum 2 consecutive periods
            const blockSize = 2
            
            const numBlocks = Math.ceil(periodsPerWeek / blockSize)

            // Create lesson blocks based on periodsPerWeek
            for (let i = 0; i < numBlocks; i++) {
                const periodsInThisBlock = Math.min(blockSize, periodsPerWeek - (i * blockSize))
                lessons.push({
                    teacherId: assignment.teacherId,
                    subjectId: assignment.subjectId,
                    classId: assignment.classId,
                    lessonIndex: i + 1,
                    totalLessons: numBlocks,
                    lessonType: schoolType,
                    priority: assignment.subject.periodsPerWeek,
                    preferredTime: 'ANY',
                    streamType: schoolType,
                    level: level,
                    blockSize: periodsInThisBlock, // Actual periods in this block
                    periodsPerWeek: assignment.subject.periodsPerWeek,
                    teacherName: assignment.teacher.name,
                    subjectName: assignment.subject.name,
                    className: assignment.class.name
                })
            }
        }

        // Process Trainer-Class-Module assignments (TSS)
        for (const assignment of trainerClassModules) {
            const level = assignment.module.level || 'Unknown'
            const totalHours = assignment.module.totalHours
            const isComplementary = assignment.module.category === 'COMPLEMENTARY'

            // ENFORCE DOUBLE PERIODS RULE FOR SPECIFIC AND GENERAL MODULES
            // SPECIFIC and GENERAL modules MUST have TWO consecutive periods
            // COMPLEMENTARY modules fill remaining free spaces (flexible 1-2 periods)
            if (isComplementary) {
                // COMPLEMENTARY MODULES: Fill remaining free spaces
                // Create individual single-period lessons to allow flexible scheduling
                for (let i = 0; i < totalHours; i++) {
                    lessons.push({
                        teacherId: assignment.trainerId,
                        moduleId: assignment.moduleId,
                        classId: assignment.classId,
                        lessonIndex: i + 1,
                        totalLessons: totalHours,
                        lessonType: 'TSS',
                        priority: getModuleCategoryPriority(assignment.module.category),
                        preferredTime: 'ANY', // Can be scheduled in any free slot
                        streamType: 'TSS',
                        level: level,
                        blockSize: 1, // Single period - will try double first, fallback to single
                        periodsPerWeek: assignment.module.totalHours,
                        moduleCategory: assignment.module.category,
                        teacherName: assignment.trainer.name,
                        moduleName: assignment.module.name,
                        className: assignment.class.name
                    })
                }
            } else {
                // SPECIFIC AND GENERAL MODULES: Maximum 2 consecutive periods
                const blockSize = 2
                const numBlocks = Math.ceil(totalHours / blockSize)

                // Create lesson blocks - each block is 2 consecutive periods max
                for (let i = 0; i < numBlocks; i++) {
                    const periodsInThisBlock = Math.min(blockSize, totalHours - (i * blockSize))
                    lessons.push({
                        teacherId: assignment.trainerId,
                        moduleId: assignment.moduleId,
                        classId: assignment.classId,
                        lessonIndex: i + 1,
                        totalLessons: numBlocks,
                        lessonType: 'TSS',
                        priority: getModuleCategoryPriority(assignment.module.category),
                        preferredTime: 'MORNING', // Prefer morning for core modules
                        streamType: 'TSS',
                        level: level,
                        blockSize: periodsInThisBlock, // Will be 2 for most blocks, 1 for remainder
                        periodsPerWeek: assignment.module.totalHours,
                        moduleCategory: assignment.module.category,
                        teacherName: assignment.trainer.name,
                        moduleName: assignment.module.name,
                        className: assignment.class.name
                    })
                }
            }
        }

        return lessons
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
     * Get classes that have lessons assigned (for validation)
     */
    private async getClassesWithAssignments(): Promise<Set<string>> {
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: { schoolId: this.schoolId },
            select: { classId: true }
        })

        const trainerClassModules = await db.trainerClassModule.findMany({
            where: { schoolId: this.schoolId },
            select: { classId: true }
        })

        const classIds = new Set<string>()
        teacherClassSubjects.forEach((assignment: any) => classIds.add(assignment.classId))
        trainerClassModules.forEach((assignment: any) => classIds.add(assignment.classId))

        return classIds
    }

    /**
     * Get teachers/trainers that have assignments (for validation)
     */
    private async getAssignedTeachers(): Promise<Set<string>> {
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: { schoolId: this.schoolId },
            select: { teacherId: true }
        })

        const trainerClassModules = await db.trainerClassModule.findMany({
            where: { schoolId: this.schoolId },
            select: { trainerId: true }
        })

        const teacherIds = new Set<string>()
        teacherClassSubjects.forEach((assignment: any) => teacherIds.add(assignment.teacherId))
        trainerClassModules.forEach((assignment: any) => teacherIds.add(assignment.trainerId))

        return teacherIds
    }

    /**
     * Sort lessons by priority for optimal scheduling with full teacher scope consideration
     * ENFORCE CONSECUTIVE DOUBLE PERIODS RULE priority order:
     * 1) SPECIFIC modules (double periods, morning)
     * 2) GENERAL modules (double periods, morning)
     * 3) Mathematics & Physics (double periods)
     * 4) Other subjects (single or configured block)
     */
    sortLessonsByPriority(lessons: PreparedLesson[]): PreparedLesson[] {
        return lessons.sort((a, b) => {
            // CRITICAL: Consider teacher scope when prioritizing
            // Teachers with broader scope (multiple classes/subjects) get scheduling priority
            const teacherAScope = this.calculateTeacherScope(lessons, a.teacherId)
            const teacherBScope = this.calculateTeacherScope(lessons, b.teacherId)
            
            // Teachers with larger scope get higher priority to prevent conflicts
            const scopePriority = teacherBScope - teacherAScope
            if (scopePriority !== 0) {
                return scopePriority
            }

            // ENFORCE FLEXIBLE COMPLEMENTARY MODULES RULE: Priority order for scheduling
            const getSchedulingPriority = (lesson: PreparedLesson): number => {
                // 1) SPECIFIC modules (highest priority)
                if (lesson.lessonType === 'TSS' && lesson.moduleCategory === 'SPECIFIC') {
                    return 1
                }
                // 2) GENERAL modules 
                if (lesson.lessonType === 'TSS' && lesson.moduleCategory === 'GENERAL') {
                    return 2
                }
                // 3) Mathematics & Physics (double periods)
                const subjectName = (lesson.subjectName || '').toLowerCase()
                if (lesson.lessonType !== 'TSS' && (subjectName.includes('mathematics') || subjectName.includes('physics'))) {
                    return 3
                }
                // 4) Other required subjects
                if (lesson.lessonType !== 'TSS' && !(subjectName.includes('mathematics') || subjectName.includes('physics'))) {
                    return 4
                }
                // 5) COMPLEMENTARY modules (lowest priority - fill FREE slots)
                if (lesson.lessonType === 'TSS' && lesson.moduleCategory === 'COMPLEMENTARY') {
                    return 5
                }
                // Default fallback
                return 6
            }

            const aPriority = getSchedulingPriority(a)
            const bPriority = getSchedulingPriority(b)
            
            if (aPriority !== bPriority) {
                return aPriority - bPriority
            }

            // Within same priority group, sort by lesson type
            const typePriority = { TSS: 3, SECONDARY: 2, PRIMARY: 1 }
            if (typePriority[a.lessonType] !== typePriority[b.lessonType]) {
                return typePriority[b.lessonType] - typePriority[a.lessonType]
            }

            // For TSS lessons, sort by category priority (SPECIFIC, GENERAL, COMPLEMENTARY)
            if (a.lessonType === 'TSS' && b.lessonType === 'TSS') {
                if (a.priority !== b.priority) return a.priority - b.priority
                return b.totalLessons - a.totalLessons
            }

            // For regular subjects, sort by total lessons (higher = more urgent)
            return b.totalLessons - a.totalLessons
        })
    }

    /**
     * Calculate teacher's scope across the entire school for scheduling priority
     * Teachers with broader scope get higher priority to prevent conflicts
     */
    private calculateTeacherScope(lessons: PreparedLesson[], teacherId: string): number {
        const teacherLessons = lessons.filter(lesson => lesson.teacherId === teacherId)
        if (teacherLessons.length === 0) return 0

        // Count unique classes, subjects/modules, and levels the teacher teaches
        const uniqueClasses = new Set(teacherLessons.map(l => l.classId)).size
        const uniqueSubjects = new Set(
            teacherLessons
                .filter(l => l.subjectId || l.moduleId)
                .map(l => l.subjectId || l.moduleId)
        ).size
        const uniqueLevels = new Set(teacherLessons.map(l => l.level)).size

        // Calculate scope score (higher = broader scope)
        // Weight: classes * 3 + subjects * 2 + levels * 1
        const scopeScore = (uniqueClasses * 3) + (uniqueSubjects * 2) + uniqueLevels
        
        console.log(`Teacher ${teacherId} scope: ${uniqueClasses} classes, ${uniqueSubjects} subjects/modules, ${uniqueLevels} levels = score ${scopeScore}`)
        
        return scopeScore
    }

    /**
     * Get lesson statistics for reporting
     */
    getLessonStatistics(lessons: PreparedLesson[]) {
        const stats = {
            total: lessons.length,
            byType: {
                PRIMARY: 0,
                SECONDARY: 0,
                TSS: 0
            },
            byLevel: {} as Record<string, number>,
            byTeacher: {} as Record<string, number>,
            averageLessonsPerTeacher: 0,
            maxLessonsPerTeacher: 0
        }

        const teacherLessonCount: Record<string, number> = {}

        lessons.forEach(lesson => {
            // Count by type
            stats.byType[lesson.lessonType]++

            // Count by level
            stats.byLevel[lesson.level] = (stats.byLevel[lesson.level] || 0) + 1

            // Count by teacher
            const teacherKey = lesson.teacherName || lesson.teacherId
            teacherLessonCount[teacherKey] = (teacherLessonCount[teacherKey] || 0) + 1
        })

        // Calculate teacher statistics
        const teacherCounts = Object.values(teacherLessonCount)
        stats.byTeacher = teacherLessonCount
        stats.averageLessonsPerTeacher = teacherCounts.length > 0
            ? teacherCounts.reduce((sum, count) => sum + count, 0) / teacherCounts.length
            : 0
        stats.maxLessonsPerTeacher = teacherCounts.length > 0
            ? Math.max(...teacherCounts)
            : 0

        return stats
    }

    /**
     * Validate lesson assignments based on per-class assignments
     */
    async validateLessons(lessons: PreparedLesson[]): Promise<{
        isValid: boolean
        errors: string[]
        warnings: string[]
    }> {
        const errors: string[] = []
        const warnings: string[] = []

        try {
            // Check for teachers/trainers with no assignments
            const teachersWithLessons = new Set(lessons.map(l => l.teacherId))
            const allTeachers = await db.user.findMany({
                where: {
                    schoolId: this.schoolId,
                    role: { in: ['TEACHER', 'TRAINER'] },
                    isActive: true
                }
            })

            const unassignedTeachers = allTeachers.filter(t => !teachersWithLessons.has(t.id))
            if (unassignedTeachers.length > 0) {
                warnings.push(`${unassignedTeachers.length} teachers/trainers have no per-class lesson assignments`)
            }

            // Check for classes with no lessons (this is now more important)
            const classesWithLessons = new Set(lessons.map(l => l.classId))
            const allClasses = await db.class.findMany({
                where: { schoolId: this.schoolId }
            })

            const classesWithoutLessons = allClasses.filter(c => !classesWithLessons.has(c.id))
            if (classesWithoutLessons.length > 0) {
                warnings.push(`${classesWithoutLessons.length} classes have no lessons scheduled - they may need teacher assignments`)
            }

            // Check if we have any lessons at all
            if (lessons.length === 0) {
                errors.push('No lessons found. Please create teacher-class assignments first.')
            }

            // Validate that lessons are properly distributed
            const lessonsByClass = new Map<string, number>()
            lessons.forEach(lesson => {
                const count = lessonsByClass.get(lesson.classId) || 0
                lessonsByClass.set(lesson.classId, count + 1)
            })

            const classesWithLowLessons = Array.from(lessonsByClass.entries())
                .filter(([classId, count]) => count < 5) // Arbitrary threshold
                .map(([classId, count]) => `${classId} (${count} lessons)`)

            if (classesWithLowLessons.length > 0) {
                warnings.push(`Some classes have very few lessons: ${classesWithLowLessons.join(', ')}`)
            }

        } catch (error) {
            console.error('Validation error:', error)
            warnings.push('Unable to complete full validation due to database access issues')
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        }
    }
}

/**
 * Prepare lessons for a school
 */
export async function prepareLessonsForSchool(schoolId: string): Promise<{
    lessons: PreparedLesson[]
    statistics: any
    validation: any
}> {
    const service = new LessonPreparationService(schoolId)
    const lessons = await service.prepareLessons()
    const sortedLessons = service.sortLessonsByPriority(lessons)
    const statistics = service.getLessonStatistics(sortedLessons)
    const validation = await service.validateLessons(sortedLessons)

    return {
        lessons: sortedLessons,
        statistics,
        validation
    }
}