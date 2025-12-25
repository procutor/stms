import { db } from '@/lib/db'

export interface TeacherData {
  id: string
  name: string
  email: string
  role: string
  schoolId: string | null
  teachingStreams?: string | null
  maxWeeklyHours: number | null
  isActive: boolean
  _count?: {
    timetablesAsTeacher: number
  }
}

export interface TeacherStats {
  totalTeachers: number
  activeTeachers: number
  inactiveTeachers: number
  averageUtilization: number
  totalLessons: number
  todayLessons: number
}

export class TeacherService {
  
  static async getAllTeachers(schoolId?: string): Promise<TeacherData[]> {
    return await db.user.findMany({
      where: {
        role: { in: ['TEACHER', 'TRAINER'] },
        ...(schoolId && { schoolId })
      },
      include: {
        _count: {
          select: {
            timetablesAsTeacher: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  static async getTeacherById(id: string): Promise<TeacherData | null> {
    return await db.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            timetablesAsTeacher: true
          }
        }
      }
    })
  }

  static async getTeacherStats(schoolId?: string): Promise<TeacherStats> {
    const teachers = await this.getAllTeachers(schoolId)
    
    const totalTeachers = teachers.length
    const activeTeachers = teachers.filter(t => t.isActive).length
    const inactiveTeachers = totalTeachers - activeTeachers
    
    const totalLessons = teachers.reduce((sum, teacher) => 
      sum + (teacher._count?.timetablesAsTeacher || 0), 0)
    
    const averageUtilization = totalTeachers > 0 
      ? Math.round((totalLessons / (totalTeachers * 40)) * 100) // Assuming 40 hours max
      : 0

    // Calculate today's lessons (simplified)
    const todayLessons = Math.round(totalLessons / 5) // Approximate daily lessons

    return {
      totalTeachers,
      activeTeachers,
      inactiveTeachers,
      averageUtilization,
      totalLessons,
      todayLessons
    }
  }

  static async createTeacher(teacherData: {
    name: string
    email: string
    password: string
    schoolId: string
    role?: string
    teachingStreams?: string
    maxWeeklyHours?: number
  }): Promise<TeacherData> {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(teacherData.password, 12)

    // Use provided role or default to TEACHER
    const role = teacherData.role || 'TEACHER'

    return await db.user.create({
      data: {
        name: teacherData.name,
        email: teacherData.email,
        password: hashedPassword,
        role: role,
        schoolId: teacherData.schoolId,
        teachingStreams: teacherData.teachingStreams || 'PRIMARY',
        maxWeeklyHours: teacherData.maxWeeklyHours || 40,
        isActive: true
      },
      include: {
        _count: {
          select: {
            timetablesAsTeacher: true
          }
        }
      }
    })
  }

  static async updateTeacher(id: string, updateData: {
    name?: string
    teachingStreams?: string
    maxWeeklyHours?: number
    isActive?: boolean
  }): Promise<TeacherData> {
    return await db.user.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            timetablesAsTeacher: true
          }
        }
      }
    })
  }

  static async deleteTeacher(id: string): Promise<void> {
    await db.user.delete({
      where: { id }
    })
  }

  static async getTeacherSubjects(teacherId: string) {
    return await db.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: true
      }
    })
  }

  static async getTeacherModules(teacherId: string) {
    return await db.trainerModule.findMany({
      where: { trainerId: teacherId },
      include: {
        module: true
      }
    })
  }

  static async assignSubject(teacherId: string, subjectId: string) {
    return await db.teacherSubject.create({
      data: {
        teacherId,
        subjectId
      },
      include: {
        subject: true
      }
    })
  }

  static async unassignSubject(teacherId: string, subjectId: string) {
    return await db.teacherSubject.delete({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId
        }
      }
    })
  }

  static async assignModule(teacherId: string, moduleId: string) {
    return await db.trainerModule.create({
      data: {
        trainerId: teacherId,
        moduleId
      },
      include: {
        module: true
      }
    })
  }

  static async unassignModule(teacherId: string, moduleId: string) {
    return await db.trainerModule.delete({
      where: {
        trainerId_moduleId: {
          trainerId: teacherId,
          moduleId
        }
      }
    })
  }

  static async getTeacherClassSubjects(teacherId: string) {
    return await db.teacherClassSubject.findMany({
      where: { teacherId },
      include: {
        class: true,
        subject: true
      }
    })
  }

  static async getTrainerClassModules(teacherId: string) {
    return await db.trainerClassModule.findMany({
      where: { trainerId: teacherId },
      include: {
        class: true,
        module: true
      }
    })
  }

  static async getTeacherTimetables(teacherId: string) {
    return await db.timetable.findMany({
      where: { teacherId },
      include: {
        class: true,
        subject: true,
        module: true,
        timeSlot: true
      }
    })
  }

  static async getAllTeacherAssignments(teacherId: string) {
    const [
      teacherSubjects,
      trainerModules,
      teacherClassSubjects,
      trainerClassModules,
      timetables
    ] = await Promise.all([
      this.getTeacherSubjects(teacherId),
      this.getTeacherModules(teacherId),
      this.getTeacherClassSubjects(teacherId),
      this.getTrainerClassModules(teacherId),
      this.getTeacherTimetables(teacherId)
    ])

    return {
      teacherSubjects,
      trainerModules,
      teacherClassSubjects,
      trainerClassModules,
      timetables,
      totalCount: teacherSubjects.length + trainerModules.length + 
                  teacherClassSubjects.length + trainerClassModules.length + 
                  timetables.length
    }
  }
}