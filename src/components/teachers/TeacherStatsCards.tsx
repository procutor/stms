import { Users, UserCheck, BookOpen, Wrench } from 'lucide-react'

interface Teacher {
    id: string
    name: string
    email: string
    role: string
    teachingStreams?: string
    maxWeeklyHours?: number
    isActive: boolean
    unavailableDays?: string
    unavailablePeriods?: string
    _count?: {
        teacherSubjects: number
        trainerModules: number
        timetablesAsTeacher: number
    }
}

interface TeacherStatsCardsProps {
    teachers: Teacher[]
}

export default function TeacherStatsCards({ teachers }: TeacherStatsCardsProps) {
    if (teachers.length === 0) return null

    const totalTeachers = teachers.length
    const activeTeachers = teachers.filter(t => t.isActive).length
    const subjectAssignments = teachers.reduce((sum, t) => sum + (t._count?.teacherSubjects || 0), 0)
    const moduleAssignments = teachers.reduce((sum, t) => sum + (t._count?.trainerModules || 0), 0)

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Users className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Teachers
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {totalTeachers}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <UserCheck className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Active Teachers
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {activeTeachers}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Subject Assignments
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {subjectAssignments}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Wrench className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Module Assignments
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {moduleAssignments}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}