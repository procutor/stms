# API Routes Restructuring Plan

## Overview

This document outlines the complete restructuring of the School Timetable Management System's API layer to implement clean architecture principles, improve maintainability, and enhance developer experience.

## Current API Structure Analysis

### Existing API Routes Inventory

The current system has **25+ API endpoints** with significant organizational issues:

#### Authentication & User Management
- `/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `/api/users/` - User management (unclear scope)

#### Teacher Management (Fragmented)
- `/api/teachers/route.ts` - Basic teacher CRUD
- `/api/teacher/assignments/route.ts` - Teacher assignments
- `/api/teacher/statistics/route.ts` - Teacher statistics
- `/api/teacher/timetable/route.ts` - Teacher timetable
- `/api/teachers/[id]/availability/route.ts` - Teacher availability
- `/api/teacher-subjects/route.ts` - Teacher-subject relationships
- `/api/teacher-class-assignments/route.ts` - Complex assignments

#### School Management
- `/api/schools/route.ts` - School management
- `/api/setup-time-slots/route.ts` - Time slot setup

#### Academic Structure
- `/api/classes/route.ts` - Class management
- `/api/subjects/route.ts` - Subject management
- `/api/modules/route.ts` - Module management
- `/api/modules/[id]/route.ts` - Individual module operations

#### Schedule Management
- `/api/time-slots/route.ts` - Time slot management
- `/api/time-slots/[id]/route.ts` - Individual time slot operations
- `/api/timetables/route.ts` - Timetable management
- `/api/generate/route.ts` - Timetable generation
- `/api/generate/bulk/route.ts` - Bulk generation

#### Assignments & Trainers
- `/api/assignments/route.ts` - General assignments
- `/api/trainers/route.ts` - Trainer management
- `/api/trainer-modules/route.ts` - Trainer-module relationships
- `/api/class-assignments/route.ts` - Class assignments

#### Administrative
- `/api/super-admin/teachers/route.ts` - Super admin teacher management

### Identified Issues

#### 1. **Naming Inconsistencies**
- Mixed singular/plural forms (`teacher` vs `teachers`)
- Inconsistent endpoint structure
- Ambiguous resource naming

#### 2. **Functional Fragmentation**
- Teacher operations scattered across multiple endpoints
- No clear resource boundaries
- Duplicated functionality

#### 3. **Complexity Management**
- Too many endpoints for simple operations
- Deep nesting without clear purpose
- Hard to understand API structure

#### 4. **Business Logic Mixing**
- API routes contain business logic
- No service layer separation
- Difficult to test and maintain

#### 5. **Error Handling Inconsistency**
- No standardized error response format
- Inconsistent HTTP status codes
- Poor error message clarity

## Proposed Clean API Structure

### 1. Versioned API Design

#### Base Structure
```
/api/v1/
├── auth/                    # Authentication
├── schools/                 # School management
│   └── {schoolId}/
│       ├── teachers/        # Teacher management
│       ├── classes/         # Class management
│       ├── subjects/        # Subject management
│       ├── modules/         # Module management
│       ├── timetables/      # Timetable management
│       ├── assignments/     # Assignment management
│       ├── time-slots/      # Time slot management
│       └── settings/        # School settings
├── teachers/                # Cross-school teacher operations
├── timetables/              # Global timetable operations
└── admin/                   # Administrative operations
```

### 2. Resource-Based Endpoint Design

#### Teacher Management API

**GET `/api/v1/schools/{schoolId}/teachers`**
```typescript
// Query Parameters
interface TeacherListQuery {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  stream?: 'PRIMARY' | 'SECONDARY' | 'TSS' | 'ALL'
  sortBy?: 'name' | 'createdAt' | 'utilization'
  sortOrder?: 'asc' | 'desc'
}

// Response
interface TeacherListResponse {
  data: Teacher[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    active: number
    inactive: number
    byStream: Record<string, number>
  }
}
```

**POST `/api/v1/schools/{schoolId}/teachers`**
```typescript
// Request Body
interface CreateTeacherRequest {
  name: string
  email: string
  password: string
  teachingStreams: TeachingStream[]
  maxWeeklyHours: number
  phone?: string
  availability?: TeacherAvailability
}

// Response
interface CreateTeacherResponse {
  data: Teacher
  message: string
}
```

**GET `/api/v1/schools/{schoolId}/teachers/{teacherId}`**
```typescript
// Response
interface TeacherResponse {
  data: Teacher & {
    assignments: TeacherAssignment[]
    availability: TeacherAvailability[]
    statistics: TeacherStatistics
    timetable: TimetableEntry[]
  }
}
```

**PUT `/api/v1/schools/{schoolId}/teachers/{teacherId}`**
```typescript
// Request Body
interface UpdateTeacherRequest {
  name?: string
  email?: string
  maxWeeklyHours?: number
  phone?: string
  teachingStreams?: TeachingStream[]
  isActive?: boolean
}
```

**DELETE `/api/v1/schools/{schoolId}/teachers/{teacherId}`**
```typescript
// Query Parameters
interface DeleteTeacherQuery {
  force?: boolean // Force deletion even with assignments
  reassignTo?: string // Teacher ID to reassign responsibilities to
}
```

#### Teacher Assignments API

**GET `/api/v1/schools/{schoolId}/teachers/{teacherId}/assignments`**
```typescript
// Response
interface TeacherAssignmentsResponse {
  data: {
    subjectAssignments: SubjectAssignment[]
    moduleAssignments: ModuleAssignment[]
    classAssignments: ClassAssignment[]
    summary: {
      totalHours: number
      subjectCount: number
      moduleCount: number
      classCount: number
      utilizationPercentage: number
    }
  }
}
```

**POST `/api/v1/schools/{schoolId}/teachers/{teacherId}/assignments`**
```typescript
// Request Body
interface CreateTeacherAssignmentRequest {
  type: 'subject' | 'module'
  targetId: string // subjectId or moduleId
  classId?: string
  hoursPerWeek: number
  isPrimary?: boolean
  effectiveDate?: string
}

// Response
interface CreateTeacherAssignmentResponse {
  data: TeacherAssignment
  message: string
}
```

#### Timetable Management API

**GET `/api/v1/schools/{schoolId}/timetables`**
```typescript
// Query Parameters
interface TimetableListQuery {
  view?: 'teacher' | 'class' | 'school'
  teacherId?: string
  classId?: string
  day?: DayOfWeek
  week?: string
  includeConflicts?: boolean
}

// Response
interface TimetableListResponse {
  data: {
    timetables: TimetableEntry[]
    summary: {
      totalLessons: number
      conflicts: Conflict[]
      statistics: TimetableStatistics
    }
  }
}
```

**POST `/api/v1/schools/{schoolId}/timetables/generate`**
```typescript
// Request Body
interface GenerateTimetableRequest {
  scope: 'school' | 'class' | 'teacher'
  targetId?: string // classId or teacherId
  options: {
    preserveExisting?: boolean
    regenerate?: boolean
    respectConstraints?: boolean
    timePreferences?: TimePreferences
  }
}

// Response
interface GenerateTimetableResponse {
  data: {
    success: boolean
    generatedLessons: number
    conflicts: Conflict[]
    warnings: string[]
    executionTime: number
  }
  message: string
}
```

### 3. Service Layer Implementation

#### Service Interface Design

**Base Service Interface**
```typescript
interface BaseService<T, CreateDto, UpdateDto, FilterDto> {
  findAll(filters?: FilterDto): Promise<T[]>
  findOne(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
  validate(data: CreateDto | UpdateDto): Promise<ValidationResult>
}
```

**Teacher Service Implementation**
```typescript
class TeacherService implements BaseService<Teacher, CreateTeacherDto, UpdateTeacherDto, TeacherFilterDto> {
  constructor(
    private db: Database,
    private validator: ValidationService,
    private logger: Logger
  ) {}

  async findAll(filters?: TeacherFilterDto): Promise<Teacher[]> {
    try {
      this.logger.info('Fetching teachers with filters', { filters })
      
      const query = this.db.users
        .where({ role: 'TEACHER' })
        .include({
          assignments: true,
          availability: true,
          _count: {
            select: {
              timetablesAsTeacher: true
            }
          }
        })

      if (filters?.schoolId) {
        query.where({ schoolId: filters.schoolId })
      }

      if (filters?.search) {
        query.where({
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      }

      const teachers = await query.exec()
      
      this.logger.info('Successfully fetched teachers', { count: teachers.length })
      return teachers.map(this.mapToTeacher)
      
    } catch (error) {
      this.logger.error('Failed to fetch teachers', { error, filters })
      throw new ServiceError('TEACHER_FETCH_FAILED', 'Failed to fetch teachers')
    }
  }

  async create(data: CreateTeacherDto): Promise<Teacher> {
    try {
      await this.validator.validate(CreateTeacherSchema, data)
      
      // Check for existing email
      const existing = await this.db.users.findUnique({
        where: { email: data.email }
      })

      if (existing) {
        throw new ValidationError('EMAIL_EXISTS', 'Teacher with this email already exists')
      }

      const hashedPassword = await bcrypt.hash(data.password, 12)
      
      const teacher = await this.db.users.create({
        data: {
          ...data,
          password: hashedPassword,
          role: 'TEACHER'
        },
        include: {
          assignments: true,
          availability: true
        }
      })

      this.logger.info('Teacher created successfully', { teacherId: teacher.id })
      return this.mapToTeacher(teacher)
      
    } catch (error) {
      this.logger.error('Failed to create teacher', { error, data })
      
      if (error instanceof ValidationError) {
        throw error
      }
      
      throw new ServiceError('TEACHER_CREATE_FAILED', 'Failed to create teacher')
    }
  }

  private mapToTeacher(dbTeacher: any): Teacher {
    return {
      id: dbTeacher.id,
      name: dbTeacher.name,
      email: dbTeacher.email,
      role: dbTeacher.role,
      schoolId: dbTeacher.schoolId,
      teachingStreams: dbTeacher.teachingStreams,
      maxWeeklyHours: dbTeacher.maxWeeklyHours,
      isActive: dbTeacher.isActive,
      phone: dbTeacher.phone,
      availability: dbTeacher.availability || [],
      assignments: dbTeacher.assignments || [],
      statistics: {
        totalLessons: dbTeacher._count?.timetablesAsTeacher || 0,
        utilization: this.calculateUtilization(dbTeacher),
        workloadBalance: this.calculateWorkloadBalance(dbTeacher)
      },
      createdAt: dbTeacher.createdAt,
      updatedAt: dbTeacher.updatedAt
    }
  }

  private calculateUtilization(teacher: any): number {
    const maxHours = teacher.maxWeeklyHours || 40
    const currentLessons = teacher._count?.timetablesAsTeacher || 0
    return Math.round((currentLessons / maxHours) * 100)
  }

  private calculateWorkloadBalance(teacher: any): WorkloadBalance {
    // Implementation for workload balance calculation
    return {
      score: 85,
      status: 'balanced',
      recommendations: []
    }
  }
}
```

### 4. API Route Implementation

#### New Route Structure

**`src/app/api/v1/schools/[schoolId]/teachers/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherService } from '@/lib/services/teacher.service'
import { ErrorHandler } from '@/lib/errors/error-handler'
import { CreateTeacherSchema, TeacherFilterSchema } from '@/lib/validation/teacher'
import { ApiResponse, PaginatedResponse } from '@/lib/types/api'

export async function GET(request: NextRequest, { params }: { params: { schoolId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = TeacherFilterSchema.parse(Object.fromEntries(searchParams))

    const teacherService = new TeacherService()
    const teachers = await teacherService.findAll({
      ...filters,
      schoolId: params.schoolId
    })

    const response: PaginatedResponse<Teacher> = {
      data: teachers,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: teachers.length,
        totalPages: Math.ceil(teachers.length / (filters.limit || 10))
      },
      filters: {
        active: teachers.filter(t => t.isActive).length,
        inactive: teachers.filter(t => !t.isActive).length,
        byStream: teachers.reduce((acc, teacher) => {
          teacher.teachingStreams.forEach(stream => {
            acc[stream] = (acc[stream] || 0) + 1
          })
          return acc
        }, {} as Record<string, number>)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}

export async function POST(request: NextRequest, { params }: { params: { schoolId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = CreateTeacherSchema.parse(body)

    const teacherService = new TeacherService()
    const teacher = await teacherService.create({
      ...validatedData,
      schoolId: params.schoolId
    })

    const response: ApiResponse<Teacher> = {
      data: teacher,
      message: 'Teacher created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}
```

**`src/app/api/v1/schools/[schoolId]/teachers/[teacherId]/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherService } from '@/lib/services/teacher.service'
import { ErrorHandler } from '@/lib/errors/error-handler'
import { UpdateTeacherSchema } from '@/lib/validation/teacher'
import { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest, { params }: { params: { schoolId: string, teacherId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const teacherService = new TeacherService()
    const teacher = await teacherService.findOne(params.teacherId)

    if (!teacher || teacher.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Teacher> = {
      data: teacher,
      message: 'Teacher retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { schoolId: string, teacherId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateTeacherSchema.parse(body)

    const teacherService = new TeacherService()
    const teacher = await teacherService.update(params.teacherId, validatedData)

    const response: ApiResponse<Teacher> = {
      data: teacher,
      message: 'Teacher updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { schoolId: string, teacherId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId || session.user.schoolId !== params.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized access to school resources' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const reassignTo = searchParams.get('reassignTo')

    const teacherService = new TeacherService()
    
    if (reassignTo) {
      // Reassign responsibilities before deletion
      await teacherService.reassignResponsibilities(params.teacherId, reassignTo)
    }

    await teacherService.delete(params.teacherId, { force })

    return NextResponse.json({
      message: 'Teacher deleted successfully'
    })

  } catch (error) {
    const apiError = ErrorHandler.handle(error)
    return NextResponse.json(apiError, { status: apiError.statusCode })
  }
}
```

### 5. Error Handling System

#### Standardized Error Response

**`src/lib/errors/api-error.ts`**
```typescript
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  requestId: string
  path: string
  method: string
}

export class BaseError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403)
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONFLICT', message, 409, details)
  }
}

export class ServiceError extends BaseError {
  constructor(code: string, message: string, details?: Record<string, any>) {
    super(code, message, 500, details)
  }
}
```

**`src/lib/errors/error-handler.ts`**
```typescript
import { BaseError, ApiError } from './api-error'
import { randomUUID } from 'crypto'

export class ErrorHandler {
  private static generateRequestId(): string {
    return randomUUID()
  }

  static handle(error: unknown, context?: { path?: string; method?: string }): ApiError {
    const requestId = this.generateRequestId()
    const timestamp = new Date().toISOString()
    const path = context?.path || 'unknown'
    const method = context?.method || 'unknown'

    // Handle known error types
    if (error instanceof BaseError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
        path,
        method
      }
    }

    // Handle Zod validation errors
    if (error instanceof Error && 'issues' in error) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { validationErrors: (error as any).issues },
        timestamp,
        requestId,
        path,
        method
      }
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        timestamp,
        requestId,
        path,
        method
      }
    }

    // Handle generic errors
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined,
      timestamp,
      requestId,
      path,
      method
    }
  }
}
```

### 6. Validation System

#### Zod Schema Definitions

**`src/lib/validation/teacher.ts`**
```typescript
import { z } from 'zod'

export const TeachingStreamSchema = z.enum([
  'PRIMARY',
  'SECONDARY', 
  'TSS',
  'SECONDARY_AND_TSS'
])

export const TeacherAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  periodStart: z.number().min(1).max(10),
  periodEnd: z.number().min(1).max(10),
  availabilityType: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'AVOID']),
  reason: z.string().optional()
})

export const CreateTeacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teachingStreams: z.array(TeachingStreamSchema).min(1, 'At least one teaching stream is required'),
  maxWeeklyHours: z.number().min(1).max(60).default(40),
  phone: z.string().optional(),
  availability: z.array(TeacherAvailabilitySchema).optional()
})

export const UpdateTeacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  maxWeeklyHours: z.number().min(1).max(60).optional(),
  phone: z.string().optional(),
  teachingStreams: z.array(TeachingStreamSchema).optional(),
  isActive: z.boolean().optional()
})

export const TeacherFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  stream: TeachingStreamSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'utilization']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type CreateTeacherDto = z.infer<typeof CreateTeacherSchema>
export type UpdateTeacherDto = z.infer<typeof UpdateTeacherSchema>
export type TeacherFilterDto = z.infer<typeof TeacherFilterSchema>
```

### 7. API Testing Strategy

#### Integration Tests

**`tests/api/teacher.test.ts`**
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createTestApp } from '../utils/test-app'
import { TeacherService } from '../../src/lib/services/teacher.service'

describe('Teacher API', () => {
  let app: any
  let teacherService: TeacherService

  beforeAll(async () => {
    app = await createTestApp()
    teacherService = new TeacherService()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/v1/schools/{schoolId}/teachers', () => {
    it('should return paginated list of teachers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/schools/test-school-id/teachers?page=1&limit=10',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      expect(response.statusCode).toBe(200)
      
      const data = JSON.parse(response.body)
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('page', 1)
      expect(data.pagination).toHaveProperty('limit', 10)
    })

    it('should filter teachers by search term', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/schools/test-school-id/teachers?search=john',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      expect(response.statusCode).toBe(200)
      
      const data = JSON.parse(response.body)
      const teachers = data.data
      teachers.forEach((teacher: any) => {
        expect(teacher.name).toMatch(/john/i)
      })
    })
  })

  describe('POST /api/v1/schools/{schoolId}/teachers', () => {
    it('should create a new teacher', async () => {
      const teacherData = {
        name: 'John Doe',
        email: 'john.doe@school.edu',
        password: 'password123',
        teachingStreams: ['PRIMARY'],
        maxWeeklyHours: 40
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/schools/test-school-id/teachers',
        payload: teacherData,
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      expect(response.statusCode).toBe(201)
      
      const data = JSON.parse(response.body)
      expect(data.data.name).toBe(teacherData.name)
      expect(data.data.email).toBe(teacherData.email)
      expect(data.data).not.toHaveProperty('password')
    })

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        teachingStreams: [] // Empty array
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/schools/test-school-id/teachers',
        payload: invalidData,
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      expect(response.statusCode).toBe(400)
      
      const data = JSON.parse(response.body)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.details).toHaveProperty('validationErrors')
    })
  })
})
```

### 8. Migration Strategy

#### Phase 1: Parallel API Development (Week 1-2)

1. **Create New API Structure**
   - Set up `/api/v1/` directory structure
   - Implement service layer
   - Create base classes and interfaces

2. **Migrate Critical Endpoints**
   - Teacher management endpoints
   - School management endpoints
   - Authentication endpoints

#### Phase 2: Feature Parity (Week 3-4)

1. **Complete Endpoint Migration**
   - Timetable management
   - Assignment management
   - Administrative functions

2. **Testing and Validation**
   - Comprehensive integration tests
   - Performance benchmarking
   - User acceptance testing

#### Phase 3: Cutover (Week 5)

1. **Gradual Rollout**
   - Feature flags for new API
   - A/B testing with subset of users
   - Monitor performance and errors

2. **Deprecation Strategy**
   - Maintain old endpoints with deprecation warnings
   - Provide migration guide for clients
   - Timeline for complete removal

#### Phase 4: Cleanup (Week 6)

1. **Remove Legacy Code**
   - Delete old API routes
   - Clean up unused services
   - Update documentation

2. **Optimization**
   - Performance tuning
   - Code cleanup
   - Documentation updates

### 9. Performance Considerations

#### Caching Strategy

```typescript
// Redis caching for frequently accessed data
class TeacherService {
  private cache = new Map<string, any>()
  private readonly CACHE_TTL = 300 // 5 minutes

  async findAll(filters?: TeacherFilterDto): Promise<Teacher[]> {
    const cacheKey = `teachers:${JSON.stringify(filters)}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const teachers = await this.fetchFromDatabase(filters)
    
    // Cache the result
    this.cache.set(cacheKey, teachers)
    setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL * 1000)
    
    return teachers
  }
}
```

#### Database Query Optimization

```typescript
// Optimized database queries with proper includes
class TeacherService {
  async findOne(id: string): Promise<Teacher | null> {
    return await this.db.users.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            subject: true,
            module: true,
            class: true
          }
        },
        availability: true,
        _count: {
          select: {
            timetablesAsTeacher: true
          }
        }
      }
    })
  }
}
```

## Success Metrics

### Technical Metrics
- **API Response Time**: 60% improvement in average response time
- **Error Rate**: Reduce API errors by 80%
- **Code Maintainability**: 50% reduction in cyclomatic complexity
- **Test Coverage**: Achieve 95% test coverage

### Developer Experience Metrics
- **API Documentation**: 100% endpoint documentation
- **Onboarding Time**: Reduce new developer onboarding time by 70%
- **Bug Resolution Time**: 50% faster bug resolution

### Business Metrics
- **Feature Development Speed**: 40% faster feature implementation
- **System Reliability**: 99.9% uptime during migration
- **User Satisfaction**: Maintain 95% user satisfaction score

## Conclusion

This API restructuring plan provides a comprehensive approach to transforming the current fragmented API structure into a clean, maintainable, and scalable system. The key benefits include:

1. **Consistent Design**: Standardized endpoint patterns and naming conventions
2. **Service Layer Separation**: Clean separation between API routes and business logic
3. **Improved Error Handling**: Standardized error responses and handling
4. **Better Testing**: Comprehensive testing strategy with high coverage
5. **Enhanced Performance**: Optimized queries and caching strategies
6. **Developer Experience**: Better documentation, validation, and debugging tools

The phased migration approach ensures minimal disruption while delivering significant improvements in code quality and maintainability.

## Next Steps

1. **Review and Approve** the API restructuring plan
2. **Set up development environment** for new API structure
3. **Begin Phase 1** implementation with critical endpoints
4. **Create comprehensive testing suite** for validation
5. **Plan communication strategy** for API changes

This restructuring will provide a solid foundation for the School Timetable Management System's continued growth and evolution.