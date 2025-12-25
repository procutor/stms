import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/teacher-class-assignments - Get all per-class teacher assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || session.user.schoolId;

    const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
      where: { schoolId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true }
        },
        class: {
          select: { id: true, name: true, level: true, stream: true }
        },
        subject: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: [
        { teacher: { name: 'asc' } },
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    });

    const trainerClassModules = await prisma.trainerClassModule.findMany({
      where: { schoolId },
      include: {
        trainer: {
          select: { id: true, name: true, email: true }
        },
        class: {
          select: { id: true, name: true, level: true, stream: true }
        },
        module: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: [
        { trainer: { name: 'asc' } },
        { class: { name: 'asc' } },
        { module: { name: 'asc' } }
      ]
    });

    return NextResponse.json({
      teacherClassSubjects,
      trainerClassModules
    });
  } catch (error) {
    console.error('Error fetching teacher class assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/teacher-class-assignments - Create a new per-class teacher assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teacherId, classId, subjectId, moduleId, schoolId } = body;

    // Ensure the schoolId matches the user's school
    const targetSchoolId = schoolId || session.user.schoolId;
    
    if (targetSchoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Invalid school access' }, { status: 403 });
    }

    let assignment;

    if (subjectId) {
      // Create TeacherClassSubject assignment
      assignment = await prisma.teacherClassSubject.create({
        data: {
          teacherId,
          classId,
          subjectId,
          schoolId: targetSchoolId
        },
        include: {
          teacher: {
            select: { id: true, name: true, email: true }
          },
          class: {
            select: { id: true, name: true, level: true, stream: true }
          },
          subject: {
            select: { id: true, name: true, code: true }
          }
        }
      });
    } else if (moduleId) {
      // Create TrainerClassModule assignment
      assignment = await prisma.trainerClassModule.create({
        data: {
          trainerId: teacherId,
          classId,
          moduleId,
          schoolId: targetSchoolId
        },
        include: {
          trainer: {
            select: { id: true, name: true, email: true }
          },
          class: {
            select: { id: true, name: true, level: true, stream: true }
          },
          module: {
            select: { id: true, name: true, code: true }
          }
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either subjectId or moduleId must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher class assignment:', error);
    
    // Handle unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This teacher is already assigned to this subject/module for this class' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-class-assignments - Delete a per-class teacher assignment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // First verify the assignment belongs to the user's school
    let assignment = await prisma.teacherClassSubject.findFirst({
      where: {
        id: assignmentId,
        schoolId: session.user.schoolId
      }
    });

    if (!assignment) {
      // Check if it's a trainer-class-module assignment
      assignment = await prisma.trainerClassModule.findFirst({
        where: {
          id: assignmentId,
          schoolId: session.user.schoolId
        }
      }) as any;
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete the appropriate assignment
    if (assignment.teacherId) {
      // This is a TeacherClassSubject assignment
      await prisma.teacherClassSubject.delete({
        where: { id: assignmentId }
      });
    } else {
      // This is a TrainerClassModule assignment
      await prisma.trainerClassModule.delete({
        where: { id: assignmentId }
      });
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher class assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}