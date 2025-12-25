# Timetable Generation Logic Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for the timetable generation system to implement clean architecture principles, improve maintainability, and enhance the complex scheduling algorithm while preserving all existing business rules and functionality.

## Current Timetable Generation Analysis

### Existing Implementation Assessment

The current timetable generation system (`src/lib/timetable-generator.ts`) contains **887 lines** of complex logic with several organizational issues:

#### Current Structure Analysis

**File Size and Complexity**
- 887 lines in a single file
- Single large class (`TimetableGenerator`) with multiple responsibilities
- Complex nested functions and methods
- No clear separation between different school types

**Business Logic Issues**
- **Mixed Responsibilities**: Algorithm logic mixed with data access
- **Tight Coupling**: Direct database access within generation logic
- **Complex State Management**: Multiple complex data structures
- **Difficult Testing**: Monolithic structure hard to test in isolation

**Architecture Problems**
- No service layer separation
- Direct Prisma database access
- Complex error handling scattered throughout
- No clear interfaces for extensibility

### Identified Business Rules (Preserved Requirements)

The system must maintain these complex business rules:

#### 1. **School Type Handling**
- **Primary Schools**: Standard subject-based scheduling
- **Secondary Schools**: Subject-based with advanced constraints
- **TSS Schools**: Module-based with complex trade requirements

#### 2. **TSS Priority Rules**
- **SPECIFIC modules** (highest priority)
- **GENERAL modules** (medium priority)  
- **COMPLEMENTARY modules** (lowest priority with flexible placement)

#### 3. **Time Constraints**
- **Core Time Rule**: Only periods P1-P10 (08:00-16:50)
- **Weekdays Only**: Monday-Friday, excluding Saturday
- **Consecutive Periods**: Double periods for TSS modules
- **Morning Preference**: TSS modules prefer morning sessions

#### 4. **Teacher Constraints**
- **Availability**: Unavailable days and periods
- **Workload Balance**: Prevent teacher overbooking
- **Cross-Class Management**: Handle teachers across multiple classes
- **Stream Specialization**: Respect teaching stream assignments

#### 5. **Class Constraints**
- **Capacity Management**: Prevent over-scheduling classes
- **Subject Distribution**: Even distribution across the week
- **Conflict Avoidance**: No double-booking of classes

## Proposed Clean Architecture Design

### 1. Layered Architecture for Timetable Generation

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │API Routes   │ │Controllers  │ │      DTOs               │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    │
│  Application Layer                        ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Timetable Svc│ │Generation   │ │      Validation         │ │
│  │             │ │Orchestrator │ │      Service            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Generation   │ │School Type  │ │      Constraint         │ │
│  │Strategies   │ │Handlers     │ │      Engine             │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Repository   │ │Database     │ │      Cache              │ │
│  │Pattern      │ │Access       │ │      Manager            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Domain Model Design

#### Core Entities

**`src/lib/domain/entities/timetable.ts`**
```typescript
export interface TimetableEntry {
  id: string
  schoolId: string
  classId: string
  teacherId: string
  subjectId?: string
  moduleId?: string
  timeSlotId: string
  day: DayOfWeek
  period: Period
  createdAt: Date
  updatedAt: Date
}

export interface TimeSlot {
  id: string
  schoolId: string
  day: DayOfWeek
  period: Period
  name: string
  startTime: Date
  endTime: Date
  session: SessionType
  isBreak: boolean
  breakType?: BreakType
  isActive: boolean
}

export interface TeacherAssignment {
  id: string
  teacherId: string
  schoolId: string
  classId: string
  subjectId?: string
  moduleId?: string
  assignmentType: AssignmentType
  hoursPerWeek: number
  isPrimary: boolean
  effectiveDate?: Date
}
```

#### Value Objects

**`src/lib/domain/value-objects/scheduling.ts`**
```typescript
export class DayOfWeek {
  private constructor(private readonly value: string) {
    if (!['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(value)) {
      throw new Error(`Invalid day of week: ${value}`)
    }
  }

  static readonly MONDAY = new DayOfWeek('MONDAY')
  static readonly TUESDAY = new DayOfWeek('TUESDAY')
  static readonly WEDNESDAY = new DayOfWeek('WEDNESDAY')
  static readonly THURSDAY = new DayOfWeek('THURSDAY')
  static readonly FRIDAY = new DayOfWeek('FRIDAY')
  static readonly SATURDAY = new DayOfWeek('SATURDAY')
  static readonly SUNDAY = new DayOfWeek('SUNDAY')

  static fromString(value: string): DayOfWeek {
    return new DayOfWeek(value.toUpperCase())
  }

  toString(): string {
    return this.value
  }

  isWeekday(): boolean {
    return !['SATURDAY', 'SUNDAY'].includes(this.value)
  }
}

export class Period {
  private constructor(private readonly value: number) {
    if (value < 1 || value > 10) {
      throw new Error(`Invalid period: ${value}. Must be between 1 and 10`)
    }
  }

  static readonly P1 = new Period(1)
  static readonly P2 = new Period(2)
  static readonly P3 = new Period(3)
  static readonly P4 = new Period(4)
  static readonly P5 = new Period(5)
  static readonly P6 = new Period(6)
  static readonly P7 = new Period(7)
  static readonly P8 = new Period(8)
  static readonly P9 = new Period(9)
  static readonly P10 = new Period(10)

  static fromNumber(value: number): Period {
    return new Period(value)
  }

  toNumber(): number {
    return this.value
  }

  isInCoreTime(): boolean {
    return this.value >= 1 && this.value <= 10
  }
}

export class TimeSlotKey {
  constructor(private readonly day: DayOfWeek, private readonly period: Period) {}

  toString(): string {
    return `${this.day.toString()}-${this.period.toNumber()}`
  }

  equals(other: TimeSlotKey): boolean {
    return this.day.toString() === other.day.toString() && 
           this.period.toNumber() === other.period.toNumber()
  }
}
```

### 3. Strategy Pattern for School Types

#### Base Strategy Interface

**`src/lib/domain/scheduling/scheduling-strategy.ts`**
```typescript
export interface SchedulingStrategy {
  readonly schoolType: SchoolType
  generateSchedule(context: GenerationContext): Promise<GenerationResult>
  validateConstraints(lesson: Lesson, context: GenerationContext): ConstraintValidation
  getPriority(lesson: Lesson): SchedulingPriority
}

export enum SchoolType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY', 
  TSS = 'TSS'
}

export interface GenerationContext {
  schoolId: string
  schoolType: SchoolType
  timeSlots: TimeSlot[]
  teachers: Teacher[]
  classes: Class[]
  assignments: TeacherAssignment[]
  existingTimetables: TimetableEntry[]
  constraints: SchedulingConstraints
}

export interface GenerationResult {
  success: boolean
  generatedEntries: TimetableEntry[]
  conflicts: Conflict[]
  executionTime: number
  warnings: string[]
}
```

#### Primary School Strategy

**`src/lib/domain/scheduling/primary-school-strategy.ts`**
```typescript
export class PrimarySchoolStrategy implements SchedulingStrategy {
  readonly schoolType = SchoolType.PRIMARY

  async generateSchedule(context: GenerationContext): Promise<GenerationResult> {
    const startTime = Date.now()
    const conflicts: Conflict[] = []
    const generatedEntries: TimetableEntry[] = []

    try {
      // Get primary school lessons
      const lessons = this.prepareLessons(context)
      
      // Sort by priority (subjects with more periods per week first)
      const sortedLessons = lessons.sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      )

      // Generate schedule for each lesson
      for (const lesson of sortedLessons) {
        const result = await this.scheduleLesson(lesson, context, generatedEntries)
        if (!result.success && result.conflicts.length > 0) {
          conflicts.push(...result.conflicts)
        }
        generatedEntries.push(...result.entries)
      }

      return {
        success: conflicts.length === 0,
        generatedEntries,
        conflicts,
        executionTime: Date.now() - startTime,
        warnings: this.generateWarnings(lessons, generatedEntries)
      }

    } catch (error) {
      return {
        success: false,
        generatedEntries,
        conflicts: [{
          type: 'GENERATION_ERROR',
          message: `Primary school schedule generation failed: ${error.message}`,
          lesson: null,
          suggestions: ['Check input data validity', 'Verify database connectivity']
        }],
        executionTime: Date.now() - startTime,
        warnings: []
      }
    }
  }

  validateConstraints(lesson: Lesson, context: GenerationContext): ConstraintValidation {
    const violations: ConstraintViolation[] = []

    // Basic availability check
    if (!this.isTeacherAvailable(lesson.teacherId, lesson.preferredTime, context)) {
      violations.push({
        type: 'TEACHER_UNAVAILABLE',
        severity: 'ERROR',
        message: 'Teacher is not available at the preferred time'
      })
    }

    // Class availability check
    if (!this.isClassAvailable(lesson.classId, lesson.preferredTime, context)) {
      violations.push({
        type: 'CLASS_UNAVAILABLE',
        severity: 'ERROR', 
        message: 'Class is not available at the preferred time'
      })
    }

    // Workload balance check
    const workload = this.calculateTeacherWorkload(lesson.teacherId, context)
    if (workload.lessonsPerDay[lesson.preferredDay] >= 6) {
      violations.push({
        type: 'WORKLOAD_EXCEEDED',
        severity: 'WARNING',
        message: 'Teacher workload may be too high on this day'
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  getPriority(lesson: Lesson): SchedulingPriority {
    return {
      level: PriorityLevel.NORMAL,
      factors: [
        { type: 'periods_per_week', weight: 1.0, value: lesson.priority || 0 },
        { type: 'subject_type', weight: 0.5, value: this.getSubjectTypeWeight(lesson.subjectId) }
      ]
    }
  }

  private async scheduleLesson(
    lesson: Lesson, 
    context: GenerationContext, 
    existingEntries: TimetableEntry[]
  ): Promise<{ success: boolean; entries: TimetableEntry[]; conflicts: Conflict[] }> {
    const conflicts: Conflict[] = []
    const entries: TimetableEntry[] = []

    // Get available time slots for this lesson
    const availableSlots = this.getAvailableTimeSlots(lesson, context, existingEntries)

    if (availableSlots.length === 0) {
      conflicts.push({
        type: 'NO_AVAILABLE_SLOTS',
        message: `No available time slots for ${lesson.subjectName} in class ${lesson.className}`,
        lesson,
        suggestions: [
          'Review teacher availability constraints',
          'Consider adding more time slots',
          'Check for scheduling conflicts'
        ]
      })
      return { success: false, entries, conflicts }
    }

    // Select best time slot (prefer morning for primary school)
    const selectedSlot = this.selectOptimalTimeSlot(availableSlots, lesson)

    // Create timetable entry
    const entry = this.createTimetableEntry(lesson, selectedSlot, context)
    entries.push(entry)

    return { success: true, entries, conflicts }
  }

  private getAvailableTimeSlots(
    lesson: Lesson, 
    context: GenerationContext, 
    existingEntries: TimetableEntry[]
  ): TimeSlot[] {
    return context.timeSlots.filter(slot => {
      // Must be active and not a break
      if (!slot.isActive || slot.isBreak) return false

      // Must be weekday for primary school
      if (!DayOfWeek.fromString(slot.day).isWeekday()) return false

      // Must be within core time (P1-P10)
      if (!Period.fromNumber(slot.period).isInCoreTime()) return false

      // Check teacher availability
      const teacherAvailable = this.isTeacherAvailable(lesson.teacherId, slot.day, context)
      if (!teacherAvailable) return false

      // Check class availability  
      const classAvailable = this.isClassAvailable(lesson.classId, slot.day, context)
      if (!classAvailable) return false

      // Check for conflicts with existing entries
      const hasConflict = existingEntries.some(entry => 
        entry.teacherId === lesson.teacherId && 
        entry.classId === lesson.classId &&
        entry.day === slot.day &&
        entry.period === slot.period
      )
      if (hasConflict) return false

      return true
    })
  }

  private selectOptimalTimeSlot(slots: TimeSlot[], lesson: Lesson): TimeSlot {
    // Primary school preference: Morning sessions
    const morningSlots = slots.filter(s => s.session === 'MORNING')
    if (morningSlots.length > 0) {
      return morningSlots[0]
    }

    // Fallback to any available slot
    return slots[0]
  }

  private createTimetableEntry(lesson: Lesson, slot: TimeSlot, context: GenerationContext): TimetableEntry {
    return {
      id: generateId(),
      schoolId: context.schoolId,
      classId: lesson.classId,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      moduleId: undefined, // Primary schools don't use modules
      timeSlotId: slot.id,
      day: DayOfWeek.fromString(slot.day),
      period: Period.fromNumber(slot.period),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private prepareLessons(context: GenerationContext): Lesson[] {
    // Transform assignments into lessons for scheduling
    return context.assignments
      .filter(assignment => assignment.assignmentType === 'SUBJECT')
      .map(assignment => ({
        teacherId: assignment.teacherId,
        classId: assignment.classId,
        subjectId: assignment.subjectId!,
        subjectName: this.getSubjectName(assignment.subjectId!),
        className: this.getClassName(assignment.classId),
        teacherName: this.getTeacherName(assignment.teacherId),
        priority: this.getSubjectPriority(assignment.subjectId!),
        preferredTime: this.determinePreferredTime(assignment),
        preferredDay: this.determinePreferredDay(assignment),
        totalLessons: assignment.hoursPerWeek,
        lessonIndex: 1 // Will be calculated during generation
      }))
  }

  private isTeacherAvailable(teacherId: string, day: string, context: GenerationContext): boolean {
    const teacher = context.teachers.find(t => t.id === teacherId)
    if (!teacher) return false

    // Check unavailable days
    const unavailableDays = teacher.unavailableDays ? JSON.parse(teacher.unavailableDays) : []
    if (unavailableDays.includes(day)) return false

    // Check unavailable periods
    const unavailablePeriods = teacher.unavailablePeriods ? JSON.parse(teacher.unavailablePeriods) : []
    // Additional period availability logic would go here

    return true
  }

  private isClassAvailable(classId: string, day: string, context: GenerationContext): boolean {
    // Check if class already has too many lessons on this day
    const classLessonsToday = context.existingTimetables.filter(entry => 
      entry.classId === classId && entry.day.toString() === day
    ).length

    return classLessonsToday < 8 // Maximum lessons per day
  }

  private calculateTeacherWorkload(teacherId: string, context: GenerationContext): TeacherWorkload {
    const lessons = context.existingTimetables.filter(entry => entry.teacherId === teacherId)
    const lessonsPerDay: Record<string, number> = {}

    lessons.forEach(lesson => {
      const day = lesson.day.toString()
      lessonsPerDay[day] = (lessonsPerDay[day] || 0) + 1
    })

    return {
      totalLessons: lessons.length,
      lessonsPerDay,
      averagePerDay: lessons.length / 5 // Assuming 5 weekdays
    }
  }
}
```

#### TSS School Strategy

**`src/lib/domain/scheduling/tss-school-strategy.ts`**
```typescript
export class TSSSchoolStrategy implements SchedulingStrategy {
  readonly schoolType = SchoolType.TSS

  async generateSchedule(context: GenerationContext): Promise<GenerationResult> {
    const startTime = Date.now()
    const conflicts: Conflict[] = []
    const generatedEntries: TimetableEntry[] = []

    try {
      // Get TSS lessons with module information
      const lessons = this.prepareTSSLessons(context)
      
      // Sort by TSS priority rules: SPECIFIC > GENERAL > COMPLEMENTARY
      const sortedLessons = this.sortTSSLessonsByPriority(lessons)

      // Generate schedule for each lesson with TSS-specific logic
      for (const lesson of sortedLessons) {
        const result = await this.scheduleTSSLesson(lesson, context, generatedEntries)
        if (!result.success && result.conflicts.length > 0) {
          conflicts.push(...result.conflicts)
        }
        generatedEntries.push(...result.entries)
      }

      return {
        success: conflicts.length === 0,
        generatedEntries,
        conflicts,
        executionTime: Date.now() - startTime,
        warnings: this.generateTSSWarnings(lessons, generatedEntries)
      }

    } catch (error) {
      return {
        success: false,
        generatedEntries,
        conflicts: [{
          type: 'GENERATION_ERROR',
          message: `TSS school schedule generation failed: ${error.message}`,
          lesson: null,
          suggestions: ['Check TSS module configurations', 'Verify trainer assignments']
        }],
        executionTime: Date.now() - startTime,
        warnings: []
      }
    }
  }

  validateConstraints(lesson: TSSLesson, context: GenerationContext): ConstraintValidation {
    const violations: ConstraintViolation[] = []

    // TSS-specific constraint validation
    if (!this.validateBlockSizeRequirements(lesson, context)) {
      violations.push({
        type: 'INSUFFICIENT_CONSECUTIVE_PERIODS',
        severity: 'ERROR',
        message: `Module ${lesson.moduleName} requires ${lesson.blockSize} consecutive periods`
      })
    }

    // Validate module category priority
    const categoryPriority = this.getModuleCategoryPriority(lesson.moduleCategory)
    if (categoryPriority < 0) {
      violations.push({
        type: 'INVALID_MODULE_CATEGORY',
        severity: 'ERROR',
        message: `Invalid module category: ${lesson.moduleCategory}`
      })
    }

    // Validate trade-specific constraints
    if (!this.validateTradeConstraints(lesson, context)) {
      violations.push({
        type: 'TRADE_CONSTRAINT_VIOLATION',
        severity: 'WARNING',
        message: `Trade-specific constraints not met for ${lesson.trade}`
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  getPriority(lesson: TSSLesson): SchedulingPriority {
    const categoryWeight = this.getModuleCategoryPriority(lesson.moduleCategory)
    const morningPreference = lesson.preferredTime === 'MORNING' ? 0.5 : 0

    return {
      level: this.determinePriorityLevel(categoryWeight),
      factors: [
        { type: 'module_category', weight: 2.0, value: categoryWeight },
        { type: 'morning_preference', weight: 1.0, value: morningPreference },
        { type: 'block_size', weight: 1.5, value: lesson.blockSize },
        { type: 'total_hours', weight: 1.0, value: lesson.totalHours }
      ]
    }
  }

  private async scheduleTSSLesson(
    lesson: TSSLesson,
    context: GenerationContext,
    existingEntries: TimetableEntry[]
  ): Promise<{ success: boolean; entries: TimetableEntry[]; conflicts: Conflict[] }> {
    const conflicts: Conflict[] = []
    const entries: TimetableEntry[] = []

    // Get available consecutive time slots for TSS block
    const availableBlocks = this.findConsecutiveTimeBlocks(lesson, context, existingEntries)

    if (availableBlocks.length === 0) {
      conflicts.push({
        type: 'NO_CONSECUTIVE_BLOCKS',
        message: `No consecutive ${lesson.blockSize}-period block available for ${lesson.moduleName}`,
        lesson,
        suggestions: this.getTSSBlockSuggestions(lesson)
      })
      return { success: false, entries, conflicts }
    }

    // For COMPLEMENTARY modules, try double periods first, then single as fallback
    if (lesson.moduleCategory === 'COMPLEMENTARY') {
      const doublePeriodBlock = availableBlocks.find(block => block.size >= 2)
      if (doublePeriodBlock) {
        const entry = await this.createTSSBlockEntry(lesson, doublePeriodBlock, context, 2)
        entries.push(entry)
      } else {
        // Fallback to single period
        const singlePeriodBlock = availableBlocks[0]
        const entry = await this.createTSSBlockEntry(lesson, singlePeriodBlock, context, 1)
        entries.push(entry)
      }
    } else {
      // For SPECIFIC/GENERAL modules, enforce required block size
      const suitableBlock = availableBlocks.find(block => block.size >= lesson.blockSize)
      if (!suitableBlock) {
        conflicts.push({
          type: 'INSUFFICIENT_BLOCK_SIZE',
          message: `Required ${lesson.blockSize}-period block not available for ${lesson.moduleName}`,
          lesson,
          suggestions: this.getTSSBlockSuggestions(lesson)
        })
        return { success: false, entries, conflicts }
      }
      
      const entry = await this.createTSSBlockEntry(lesson, suitableBlock, context, lesson.blockSize)
      entries.push(entry)
    }

    return { success: true, entries, conflicts }
  }

  private findConsecutiveTimeBlocks(
    lesson: TSSLesson,
    context: GenerationContext,
    existingEntries: TimetableEntry[]
  ): TimeBlock[] {
    const blocks: TimeBlock[] = []

    // Get weekdays only for TSS
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    
    for (const day of weekdays) {
      // Find consecutive available periods for this day
      const daySlots = context.timeSlots
        .filter(slot => slot.day === day && slot.isActive && !slot.isBreak)
        .sort((a, b) => a.period - b.period)

      let currentBlock: TimeSlot[] = []
      let currentPeriod = 0

      for (const slot of daySlots) {
        const period = slot.period
        
        // Check if this period continues the block
        if (currentPeriod === 0 || period === currentPeriod + 1) {
          // Check for conflicts
          const hasConflict = existingEntries.some(entry =>
            entry.teacherId === lesson.teacherId &&
            entry.classId === lesson.classId &&
            entry.day.toString() === day &&
            entry.period === period
          )

          if (!hasConflict) {
            currentBlock.push(slot)
            currentPeriod = period
          } else {
            // Block broken by conflict
            if (currentBlock.length >= lesson.blockSize) {
              blocks.push({
                day,
                slots: [...currentBlock],
                size: currentBlock.length,
                startPeriod: currentBlock[0].period,
                endPeriod: currentBlock[currentBlock.length - 1].period
              })
            }
            currentBlock = []
            currentPeriod = 0
          }
        } else {
          // Non-consecutive period, end current block
          if (currentBlock.length >= lesson.blockSize) {
            blocks.push({
              day,
              slots: [...currentBlock],
              size: currentBlock.length,
              startPeriod: currentBlock[0].period,
              endPeriod: currentBlock[currentBlock.length - 1].period
            })
          }
          currentBlock = []
          currentPeriod = 0
        }
      }

      // Check final block of the day
      if (currentBlock.length >= lesson.blockSize) {
        blocks.push({
          day,
          slots: currentBlock,
          size: currentBlock.length,
          startPeriod: currentBlock[0].period,
          endPeriod: currentBlock[currentBlock.length - 1].period
        })
      }
    }

    return blocks.sort((a, b) => {
      // Sort by day preference (Monday to Friday)
      const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
      const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
      if (dayComparison !== 0) return dayComparison

      // Then by morning preference (earlier periods preferred)
      return a.startPeriod - b.startPeriod
    })
  }

  private sortTSSLessonsByPriority(lessons: TSSLesson[]): TSSLesson[] {
    const categoryOrder = { 'SPECIFIC': 1, 'GENERAL': 2, 'COMPLEMENTARY': 3 }
    
    return lessons.sort((a, b) => {
      // First by category priority
      const aCategory = categoryOrder[a.moduleCategory as keyof typeof categoryOrder]
      const bCategory = categoryOrder[b.moduleCategory as keyof typeof categoryOrder]
      
      if (aCategory !== bCategory) {
        return aCategory - bCategory
      }

      // Then by morning preference
      if (a.preferredTime !== b.preferredTime) {
        return a.preferredTime === 'MORNING' ? -1 : 1
      }

      // Finally by total hours (higher first)
      return b.totalHours - a.totalHours
    })
  }

  private getModuleCategoryPriority(category: string): number {
    switch (category?.toUpperCase()) {
      case 'SPECIFIC': return 3
      case 'GENERAL': return 2
      case 'COMPLEMENTARY': return 1
      default: return 0
    }
  }
}
```

### 4. Service Layer Implementation

**`src/lib/services/timetable-service.ts`**
```typescript
export class TimetableService {
  constructor(
    private readonly generationContextFactory: GenerationContextFactory,
    private readonly schedulingStrategyFactory: SchedulingStrategyFactory,
    private readonly repository: TimetableRepository,
    private readonly cache: CacheManager,
    private readonly logger: Logger
  ) {}

  async generateTimetable(
    schoolId: string,
    options: TimetableGenerationOptions = {}
  ): Promise<GenerationResult> {
    const cacheKey = this.generateCacheKey(schoolId, options)
    
    try {
      // Check cache first
      const cached = await this.cache.get<GenerationResult>(cacheKey)
      if (cached && !options.forceRegenerate) {
        this.logger.info('Returning cached timetable generation result', { schoolId, cacheKey })
        return cached
      }

      // Create generation context
      const context = await this.generationContextFactory.create(schoolId, options)
      
      // Select appropriate strategy
      const strategy = this.schedulingStrategyFactory.create(context.schoolType)
      
      // Execute generation
      const result = await strategy.generateSchedule(context)
      
      // Save result if successful
      if (result.success) {
        await this.repository.saveTimetableEntries(result.generatedEntries)
        await this.cache.set(cacheKey, result, 300) // 5 minute cache
      }

      this.logger.info('Timetable generation completed', { 
        schoolId, 
        success: result.success,
        conflicts: result.conflicts.length,
        executionTime: result.executionTime
      })

      return result

    } catch (error) {
      this.logger.error('Timetable generation failed', { schoolId, error: error.message })
      throw new ServiceError('TIMETABLE_GENERATION_FAILED', error.message)
    }
  }

  async validateTimetable(schoolId: string): Promise<TimetableValidation> {
    const context = await this.generationContextFactory.create(schoolId)
    const existingTimetables = await this.repository.getTimetablesBySchool(schoolId)
    
    const violations: ValidationViolation[] = []
    
    // Validate teacher conflicts
    const teacherConflicts = this.findTeacherConflicts(existingTimetables)
    violations.push(...teacherConflicts)

    // Validate class conflicts  
    const classConflicts = this.findClassConflicts(existingTimetables)
    violations.push(...classConflicts)

    // Validate constraint compliance
    const constraintViolations = await this.validateConstraints(context, existingTimetables)
    violations.push(...constraintViolations)

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations,
      summary: {
        totalEntries: existingTimetables.length,
        errorCount: violations.filter(v => v.severity === 'ERROR').length,
        warningCount: violations.filter(v => v.severity === 'WARNING').length
      }
    }
  }

  private findTeacherConflicts(timetables: TimetableEntry[]): ValidationViolation[] {
    const violations: ValidationViolation[] = []
    const teacherSchedules = new Map<string, TimetableEntry[]>()

    // Group timetables by teacher
    timetables.forEach(timetable => {
      if (!teacherSchedules.has(timetable.teacherId)) {
        teacherSchedules.set(timetable.teacherId, [])
      }
      teacherSchedules.get(timetable.teacherId)!.push(timetable)
    })

    // Check for conflicts within each teacher's schedule
    teacherSchedules.forEach((schedules, teacherId) => {
      const conflicts = this.findTimeSlotConflicts(schedules)
      conflicts.forEach(conflict => {
        violations.push({
          type: 'TEACHER_CONFLICT',
          severity: 'ERROR',
          message: `Teacher ${teacherId} has conflicting lessons at ${conflict.day} period ${conflict.period}`,
          details: { teacherId, conflictingEntries: conflict.entries }
        })
      })
    })

    return violations
  }

  private findClassConflicts(timetables: TimetableEntry[]): ValidationViolation[] {
    const violations: ValidationViolation[] = []
    const classSchedules = new Map<string, TimetableEntry[]>()

    // Group timetables by class
    timetables.forEach(timetable => {
      if (!classSchedules.has(timetable.classId)) {
        classSchedules.set(timetable.classId, [])
      }
      classSchedules.get(timetable.classId)!.push(timetable)
    })

    // Check for conflicts within each class's schedule
    classSchedules.forEach((schedules, classId) => {
      const conflicts = this.findTimeSlotConflicts(schedules)
      conflicts.forEach(conflict => {
        violations.push({
          type: 'CLASS_CONFLICT',
          severity: 'ERROR',
          message: `Class ${classId} has conflicting lessons at ${conflict.day} period ${conflict.period}`,
          details: { classId, conflictingEntries: conflict.entries }
        })
      })
    })

    return violations
  }

  private findTimeSlotConflicts(schedules: TimetableEntry[]): TimeSlotConflict[] {
    const conflicts: TimeSlotConflict[] = []
    const slotMap = new Map<string, TimetableEntry[]>()

    // Group schedules by time slot
    schedules.forEach(schedule => {
      const key = `${schedule.day}-${schedule.period}`
      if (!slotMap.has(key)) {
        slotMap.set(key, [])
      }
      slotMap.get(key)!.push(schedule)
    })

    // Find slots with multiple entries
    slotMap.forEach((entries, slotKey) => {
      if (entries.length > 1) {
        const [day, period] = slotKey.split('-')
        conflicts.push({
          day,
          period: parseInt(period),
          entries
        })
      }
    })

    return conflicts
  }

  private async validateConstraints(
    context: GenerationContext,
    timetables: TimetableEntry[]
  ): Promise<ValidationViolation[]> {
    const violations: ValidationViolation[] = []
    
    // This would implement comprehensive constraint validation
    // based on the school's specific rules and constraints
    
    return violations
  }

  private generateCacheKey(schoolId: string, options: TimetableGenerationOptions): string {
    const optionHash = JSON.stringify(options)
    return `timetable:${schoolId}:${this.hashString(optionHash)}`
  }

  private hashString(str: string): string {
    // Simple hash function for cache key generation
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
```

### 5. Factory Pattern Implementation

**`src/lib/domain/factories/scheduling-strategy-factory.ts`**
```typescript
export class SchedulingStrategyFactory {
  private strategies = new Map<SchoolType, SchedulingStrategy>()

  constructor() {
    this.registerDefaultStrategies()
  }

  private registerDefaultStrategies(): void {
    this.strategies.set(SchoolType.PRIMARY, new PrimarySchoolStrategy())
    this.strategies.set(SchoolType.SECONDARY, new SecondarySchoolStrategy())
    this.strategies.set(SchoolType.TSS, new TSSSchoolStrategy())
  }

  create(schoolType: SchoolType): SchedulingStrategy {
    const strategy = this.strategies.get(schoolType)
    if (!strategy) {
      throw new Error(`No scheduling strategy registered for school type: ${schoolType}`)
    }
    return strategy
  }

  registerStrategy(schoolType: SchoolType, strategy: SchedulingStrategy): void {
    this.strategies.set(schoolType, strategy)
  }
}
```

### 6. API Route Implementation

**`src/app/api/v1/schools/[schoolId]/timetables/generate/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimetableService } from '@/lib/services/timetable-service'
import { ErrorHandler } from '@/lib/errors/error-handler'
import { GenerateTimetableSchema } from '@/lib/validation/timetable'
import { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedOptions = GenerateTimetableSchema.parse(body)

    const timetableService = new TimetableService()
    const result = await timetableService.generateTimetable(
      params.schoolId,
      validatedOptions
    )

    const response: ApiResponse<GenerationResult> = {
      data: result,
      message: result.success 
        ? 'Timetable generated successfully' 
        : 'Timetable generation completed with conflicts'
    }

    return NextResponse.json(response, { 
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    })

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}
```

### 7. Migration Strategy

#### Phase 1: Foundation (Week 1-2)

1. **Create Domain Layer**
   - Implement core entities and value objects
   - Create base interfaces and types
   - Implement strategy pattern for school types

2. **Implement Repository Pattern**
   - Create repository interfaces
   - Implement data access layer
   - Add caching layer

#### Phase 2: Strategy Implementation (Week 3-4)

1. **Migrate Primary School Logic**
   - Refactor PrimarySchoolStrategy
   - Preserve existing business rules
   - Add comprehensive tests

2. **Migrate TSS School Logic**
   - Refactor TSSSchoolStrategy
   - Maintain complex TSS rules
   - Optimize for performance

#### Phase 3: Service Layer (Week 5-6)

1. **Implement Service Layer**
   - Create TimetableService
   - Add validation and error handling
   - Implement caching strategy

2. **Update API Routes**
   - Migrate existing API endpoints
   - Add new validation schemas
   - Implement proper error responses

#### Phase 4: Testing and Optimization (Week 7-8)

1. **Comprehensive Testing**
   - Unit tests for all strategies
   - Integration tests for service layer
   - Performance benchmarking

2. **Performance Optimization**
   - Query optimization
   - Caching strategy implementation
   - Memory usage optimization

### 8. Testing Strategy

#### Unit Tests for Strategies

**`tests/unit/domain/scheduling/tss-school-strategy.test.ts`**
```typescript
import { TSSSchoolStrategy } from '@/lib/domain/scheduling/tss-school-strategy'
import { GenerationContext, SchoolType } from '@/lib/domain/scheduling/scheduling-strategy'

describe('TSSSchoolStrategy', () => {
  let strategy: TSSSchoolStrategy
  let mockContext: GenerationContext

  beforeEach(() => {
    strategy = new TSSSchoolStrategy()
    mockContext = createMockGenerationContext(SchoolType.TSS)
  })

  describe('generateSchedule', () => {
    it('should prioritize SPECIFIC modules over COMPLEMENTARY modules', async () => {
      // Arrange
      const lessons = createTSSLessons([
        { moduleCategory: 'COMPLEMENTARY', totalHours: 2 },
        { moduleCategory: 'SPECIFIC', totalHours: 4 },
        { moduleCategory: 'GENERAL', totalHours: 3 }
      ])
      mockContext.assignments = lessons

      // Act
      const result = await strategy.generateSchedule(mockContext)

      // Assert
      expect(result.success).toBe(true)
      const specificLesson = result.generatedEntries.find(entry => 
        entry.moduleId === 'specific-module-id'
      )
      expect(specificLesson).toBeDefined()
    })

    it('should enforce consecutive periods for TSS modules', async () => {
      // Arrange
      const lesson = createTSSLesson({ blockSize: 2, moduleCategory: 'SPECIFIC' })
      mockContext.assignments = [lesson]
      
      // Mock time slots with no consecutive periods
      mockContext.timeSlots = createNonConsecutiveTimeSlots()

      // Act
      const result = await strategy.generateSchedule(mockContext)

      // Assert
      expect(result.success).toBe(false)
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'NO_CONSECUTIVE_BLOCKS'
        })
      )
    })

    it('should handle COMPLEMENTARY module flexible scheduling', async () => {
      // Arrange
      const lesson = createTSSLesson({ 
        moduleCategory: 'COMPLEMENTARY', 
        blockSize: 2,
        totalHours: 2 
      })
      mockContext.assignments = [lesson]
      
      // Mock time slots with only single periods available
      mockContext.timeSlots = createSinglePeriodTimeSlots()

      // Act
      const result = await strategy.generateSchedule(mockContext)

      // Assert
      expect(result.success).toBe(true)
      // Should use single periods as fallback
      expect(result.generatedEntries).toHaveLength(1)
    })
  })

  describe('validateConstraints', () => {
    it('should validate block size requirements', () => {
      // Arrange
      const lesson = createTSSLesson({ blockSize: 3 })
      
      // Act
      const validation = strategy.validateConstraints(lesson, mockContext)
      
      // Assert
      expect(validation.isValid).toBe(false)
      expect(validation.violations).toContainEqual(
        expect.objectContaining({
          type: 'INSUFFICIENT_CONSECUTIVE_PERIODS'
        })
      )
    })
  })
})
```

### 9. Success Metrics

#### Performance Improvements
- **Generation Time**: 50% reduction in timetable generation time
- **Memory Usage**: 30% reduction in memory consumption during generation
- **Scalability**: Support for 3x larger schools without performance degradation

#### Code Quality Metrics
- **Test Coverage**: 95% test coverage for generation logic
- **Cyclomatic Complexity**: Reduce average complexity by 60%
- **Maintainability Index**: Improve from 2.1 to 4.5 (out of 5)

#### Business Rule Preservation
- **Rule Accuracy**: 100% preservation of existing business rules
- **TSS Priority Compliance**: 100% correct priority handling
- **Constraint Validation**: 100% constraint compliance validation

## Conclusion

This refactoring plan transforms the complex, monolithic timetable generation system into a clean, maintainable, and extensible architecture while preserving all existing business rules and functionality. The key improvements include:

1. **Clean Architecture**: Clear separation of concerns with layered design
2. **Strategy Pattern**: Flexible handling of different school types
3. **Domain Modeling**: Rich domain models with proper encapsulation
4. **Service Layer**: Business logic separated from infrastructure
5. **Testability**: Highly testable components with comprehensive test coverage
6. **Performance**: Optimized algorithms with caching and efficient data structures

The phased migration approach ensures minimal disruption while delivering significant improvements in code quality, maintainability, and performance.

## Next Steps

1. **Review and Approve** the refactoring plan
2. **Begin Phase 1** implementation with domain layer
3. **Create comprehensive tests** for existing functionality
4. **Set up performance benchmarking** for validation
5. **Plan gradual migration** strategy with feature flags

This refactoring will provide a solid foundation for the timetable generation system's continued evolution and maintenance while preserving the complex business logic that makes the system valuable.