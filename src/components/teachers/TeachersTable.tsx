import { UserCheck, BookOpen, Wrench, Edit, Trash2, Eye } from 'lucide-react'

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

interface TeachersTableProps {
    teachers: Teacher[]
    onEditTeacher: (teacher: Teacher) => void
    onDeleteTeacher: (teacherId: string) => void
    onViewTeacher?: (teacher: Teacher) => void
}

const TEACHING_STREAMS = [
    { value: 'PRIMARY', label: 'Primary School' },
    { value: 'SECONDARY', label: 'Secondary School' },
    { value: 'TSS', label: 'Technical & Skills School' },
    { value: 'SECONDARY_AND_TSS', label: 'Secondary & TSS' }
]

export default function TeachersTable({ teachers, onEditTeacher, onDeleteTeacher, onViewTeacher }: TeachersTableProps) {
    const getTeachingStreamsLabel = (streams?: string) => {
        if (!streams) return 'Not specified'
        const stream = TEACHING_STREAMS.find(s => s.value === streams)
        return stream ? stream.label : streams
    }

    const getUnavailableDaysText = (days?: string) => {
        if (!days) return 'None'
        try {
            const parsed = JSON.parse(days)
            return parsed.length > 0 ? parsed.join(', ') : 'None'
        } catch {
            return 'None'
        }
    }

    if (teachers.length === 0) {
        return (
            <div className="text-center py-12">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No teachers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Start by adding your first teacher to the system.
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teacher Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teaching Streams
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {teacher.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {teacher.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    {getTeachingStreamsLabel(teacher.teachingStreams)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                    <div>Max: {teacher.maxWeeklyHours || 40} hours/week</div>
                                    <div className="text-xs text-gray-400">
                                        Unavailable: {getUnavailableDaysText(teacher.unavailableDays)}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <BookOpen className="h-4 w-4 mr-1" />
                                        {teacher._count?.teacherSubjects || 0}
                                    </div>
                                    <div className="flex items-center">
                                        <Wrench className="h-4 w-4 mr-1" />
                                        {teacher._count?.trainerModules || 0}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    teacher.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {teacher.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {onViewTeacher && (
                                    <button
                                        onClick={() => onViewTeacher(teacher)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="View teacher details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => onEditTeacher(teacher)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Edit teacher"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDeleteTeacher(teacher.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete teacher"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}