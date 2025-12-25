import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'TRAINER')) {
            return NextResponse.json(
                { error: 'Unauthorized - Teacher/Trainer role required' },
                { status: 401 }
            )
        }

        // Get teacher ID from session or query parameter
        const { searchParams } = new URL(request.url)
        const teacherId = searchParams.get('teacherId') || session.user.id

        // Ensure teachers can only access their own assignments unless they're admin
        if (session.user.role === 'TEACHER' || session.user.role === 'TRAINER') {
            if (teacherId !== session.user.id) {
                return NextResponse.json(
                    { error: 'Unauthorized - Can only access your own assignments' },
                    { status: 403 }
                )
            }
        }

        // Get teacher-subject assignments
        const teacherSubjects = await db.teacherSubject.findMany({
            where: {
                teacherId: teacherId,
                teacher: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        periodsPerWeek: true
                    }
                }
            },
            orderBy: [
                {
                    subject: {
                        level: 'asc'
                    }
                },
                {
                    subject: {
                        name: 'asc'
                    }
                }
            ]
        })

        // Get trainer-module assignments (for TSS teachers)
        const trainerModules = await db.trainerModule.findMany({
            where: {
                trainerId: teacherId,
                trainer: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        trade: true,
                        totalHours: true,
                        category: true,
                        blockSize: true
                    }
                }
            },
            orderBy: [
                {
                    module: {
                        level: 'asc'
                    }
                },
                {
                    module: {
                        name: 'asc'
                    }
                }
            ]
        })

        // Get class-specific assignments
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: {
                teacherId: teacherId,
                schoolId: session.user.schoolId || ''
            },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        stream: true
                    }
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true
                    }
                }
            },
            orderBy: [
                {
                    class: {
                        name: 'asc'
                    }
                },
                {
                    subject: {
                        name: 'asc'
                    }
                }
            ]
        })

        // Get trainer-class-module assignments
        const trainerClassModules = await db.trainerClassModule.findMany({
            where: {
                trainerId: teacherId,
                schoolId: session.user.schoolId || ''
            },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        stream: true
                    }
                },
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        trade: true,
                        category: true
                    }
                }
            },
            orderBy: [
                {
                    class: {
                        name: 'asc'
                    }
                },
                {
                    module: {
                        name: 'asc'
                    }
                }
            ]
        })

        // Transform data for frontend
        const transformedAssignments = {
            subjects: teacherSubjects.map((ts: any) => ({
                id: ts.id,
                type: 'subject',
                name: ts.subject.name,
                code: ts.subject.code,
                level: ts.subject.level,
                periodsPerWeek: ts.subject.periodsPerWeek,
                assignedClasses: teacherClassSubjects
                    .filter((tcs: any) => tcs.subject.id === ts.subject.id)
                    .map((tcs: any) => ({
                        id: tcs.class.id,
                        name: tcs.class.name,
                        level: tcs.class.level,
                        stream: tcs.class.stream
                    }))
            })),
            modules: trainerModules.map((tm: any) => ({
                id: tm.id,
                type: 'module',
                name: tm.module.name,
                code: tm.module.code,
                level: tm.module.level,
                trade: tm.module.trade,
                totalHours: tm.module.totalHours,
                category: tm.module.category,
                blockSize: tm.module.blockSize,
                assignedClasses: trainerClassModules
                    .filter((tcm: any) => tcm.module.id === tm.module.id)
                    .map((tcm: any) => ({
                        id: tcm.class.id,
                        name: tcm.class.name,
                        level: tcm.class.level,
                        stream: tcm.class.stream
                    }))
            })),
            classAssignments: [
                ...teacherClassSubjects.map((tcs: any) => ({
                    id: tcs.id,
                    type: 'class-subject',
                    class: {
                        id: tcs.class.id,
                        name: tcs.class.name,
                        level: tcs.class.level,
                        stream: tcs.class.stream
                    },
                    subject: {
                        id: tcs.subject.id,
                        name: tcs.subject.name,
                        code: tcs.subject.code,
                        level: tcs.subject.level
                    }
                })),
                ...trainerClassModules.map((tcm: any) => ({
                    id: tcm.id,
                    type: 'class-module',
                    class: {
                        id: tcm.class.id,
                        name: tcm.class.name,
                        level: tcm.class.level,
                        stream: tcm.class.stream
                    },
                    module: {
                        id: tcm.module.id,
                        name: tcm.module.name,
                        code: tcm.module.code,
                        level: tcm.module.level,
                        trade: tcm.module.trade,
                        category: tcm.module.category
                    }
                }))
            ]
        }

        // Calculate statistics
        const stats = {
            totalSubjects: teacherSubjects.length,
            totalModules: trainerModules.length,
            totalClassAssignments: teacherClassSubjects.length + trainerClassModules.length,
            uniqueClasses: new Set([
                ...teacherClassSubjects.map((tcs: any) => tcs.class.id),
                ...trainerClassModules.map((tcm: any) => tcm.class.id)
            ]).size,
            subjectsWithClasses: teacherSubjects.filter((ts: any) => {
                const subject = transformedAssignments.subjects.find(s => s.id === ts.id)
                return subject && subject.assignedClasses && subject.assignedClasses.length > 0
            }).length,
            modulesWithClasses: trainerModules.filter((tm: any) => {
                const module = transformedAssignments.modules.find(m => m.id === tm.id)
                return module && module.assignedClasses && module.assignedClasses.length > 0
            }).length
        }

        return NextResponse.json({
            assignments: transformedAssignments,
            statistics: stats
        })

    } catch (error) {
        console.error('Teacher assignments fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}