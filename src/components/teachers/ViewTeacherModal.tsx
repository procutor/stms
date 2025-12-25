import { X, User, Mail, Calendar, BookOpen, Wrench, Clock, UserCheck } from 'lucide-react'

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

interface ViewTeacherModalProps {
    teacher: Teacher | null
    onClose: () => void
}

const TEACHING_STREAMS = [
    { value: 'PRIMARY', label: 'Primary School' },
    { value: 'SECONDARY', label: 'Secondary School' },
    { value: 'TSS', label: 'Technical & Skills School' },
    { value: 'SECONDARY_AND_TSS', label: 'Secondary & TSS' }
]

export default function ViewTeacherModal({ teacher, onClose }: ViewTeacherModalProps) {
    if (!teacher) return null

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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Teacher Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                                <p className="text-sm text-gray-900 mt-1">{teacher.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                <p className="text-sm text-gray-900 mt-1 flex items-center">
                                    <Mail className="h-4 w-4 mr-1" />
                                    {teacher.email}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Teaching Streams</label>
                                <p className="text-sm text-gray-900 mt-1">
                                    {getTeachingStreamsLabel(teacher.teachingStreams)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Status</label>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                    teacher.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {teacher.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2" />
                            Schedule Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Max Weekly Hours</label>
                                <p className="text-sm text-gray-900 mt-1">{teacher.maxWeeklyHours || 40} hours/week</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Unavailable Days</label>
                                <p className="text-sm text-gray-900 mt-1">{getUnavailableDaysText(teacher.unavailableDays)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Statistics */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2" />
                            Assignment Statistics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="flex items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {teacher._count?.teacherSubjects || 0}
                                </p>
                                <p className="text-sm text-gray-500">Subject Assignments</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center">
                                    <Wrench className="h-8 w-8 text-purple-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {teacher._count?.trainerModules || 0}
                                </p>
                                <p className="text-sm text-gray-500">Module Assignments</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center">
                                    <Calendar className="h-8 w-8 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {teacher._count?.timetablesAsTeacher || 0}
                                </p>
                                <p className="text-sm text-gray-500">Timetable Entries</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <UserCheck className="h-5 w-5 mr-2" />
                            Additional Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Teacher ID</label>
                                <p className="text-sm text-gray-900 mt-1 font-mono">{teacher.id}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Role</label>
                                <p className="text-sm text-gray-900 mt-1">{teacher.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}