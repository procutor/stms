import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherService } from '@/lib/services/TeacherService'

// Authentication middleware
async function checkAuth() {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
        throw new Error('Unauthorized')
    }
    
    if (!session.user.schoolId) {
        throw new Error('No school assigned to this account')
    }
    
    return session
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await checkAuth()
        const teacherId = params.id

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Teacher ID is required' },
                { status: 400 }
            )
        }

        // Check if teacher exists and belongs to the school
        const teacher = await TeacherService.getTeacherById(teacherId)
        
        if (!teacher || teacher.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            )
        }

        // Check for existing assignments (comprehensive check)
        const allAssignments = await TeacherService.getAllTeacherAssignments(teacherId)
        
        if (allAssignments.totalCount > 0) {
            const assignmentDetails = []
            
            if (allAssignments.teacherSubjects.length > 0) {
                assignmentDetails.push(`${allAssignments.teacherSubjects.length} subject assignments`)
            }
            if (allAssignments.trainerModules.length > 0) {
                assignmentDetails.push(`${allAssignments.trainerModules.length} module assignments`)
            }
            if (allAssignments.teacherClassSubjects.length > 0) {
                assignmentDetails.push(`${allAssignments.teacherClassSubjects.length} class-subject assignments`)
            }
            if (allAssignments.trainerClassModules.length > 0) {
                assignmentDetails.push(`${allAssignments.trainerClassModules.length} class-module assignments`)
            }
            if (allAssignments.timetables.length > 0) {
                assignmentDetails.push(`${allAssignments.timetables.length} timetable entries`)
            }
            
            return NextResponse.json(
                { 
                    error: `Cannot delete teacher with existing assignments: ${assignmentDetails.join(', ')}. Please remove all assignments first.`,
                    assignmentCount: allAssignments.totalCount,
                    assignmentBreakdown: {
                        subjects: allAssignments.teacherSubjects.length,
                        modules: allAssignments.trainerModules.length,
                        classSubjects: allAssignments.teacherClassSubjects.length,
                        classModules: allAssignments.trainerClassModules.length,
                        timetables: allAssignments.timetables.length
                    }
                },
                { status: 400 }
            )
        }

        // Delete teacher using service layer
        await TeacherService.deleteTeacher(teacherId)

        return NextResponse.json({
            message: 'Teacher deleted successfully'
        })

    } catch (error) {
        console.error('Teacher deletion error:', error)
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await checkAuth()
        const teacherId = params.id

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Teacher ID is required' },
                { status: 400 }
            )
        }

        // Check if teacher exists and belongs to the school
        const teacher = await TeacherService.getTeacherById(teacherId)
        
        if (!teacher || teacher.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            )
        }

        // Get comprehensive assignment information
        const allAssignments = await TeacherService.getAllTeacherAssignments(teacherId)

        return NextResponse.json({
            teacher,
            assignments: {
                teacherSubjects: allAssignments.teacherSubjects,
                trainerModules: allAssignments.trainerModules,
                teacherClassSubjects: allAssignments.teacherClassSubjects,
                trainerClassModules: allAssignments.trainerClassModules,
                timetables: allAssignments.timetables,
                totalCount: allAssignments.totalCount
            }
        })

    } catch (error) {
        console.error('Teacher fetch error:', error)
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await checkAuth()
        const teacherId = params.id
        const body = await request.json()

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Teacher ID is required' },
                { status: 400 }
            )
        }

        // Check if teacher exists and belongs to the school
        const existingTeacher = await TeacherService.getTeacherById(teacherId)
        
        if (!existingTeacher || existingTeacher.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            )
        }

        // Update teacher using service layer
        const updatedTeacher = await TeacherService.updateTeacher(teacherId, {
            name: body.name,
            teachingStreams: body.teachingStreams,
            maxWeeklyHours: body.maxWeeklyHours,
            isActive: body.isActive
        })

        return NextResponse.json({
            message: 'Teacher updated successfully',
            teacher: updatedTeacher
        })

    } catch (error) {
        console.error('Teacher update error:', error)
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}