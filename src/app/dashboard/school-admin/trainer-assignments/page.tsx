'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Wrench, 
  LogOut, 
  ArrowLeft, 
  Users, 
  BookOpen,
  Plus,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

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



export default function TrainerAssignmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    
    // Data states
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [trainerAssignments, setTrainerAssignments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    

    

    


    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const fetchAllData = async () => {
        try {
            setIsLoading(true)
            
            // Fetch all required data
            const [teachersRes, assignmentsRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/trainer-modules')
            ])

            if (teachersRes.ok) {
                const teachersData = await teachersRes.json()
                setTeachers(teachersData)
            }

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json()
                setTrainerAssignments(assignmentsData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
        }
    }, [session])

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        )
    }

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-red-600">Access denied. School Admin role required.</div>
            </div>
        )
    }

    if (!session.user.schoolId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg text-red-600 mb-4">No School Assigned</div>
                    <p className="text-gray-600">Your account is not associated with any school. Please contact the Super Administrator.</p>
                    <button
                        onClick={handleLogout}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        )
    }

    // Filter trainers (teachers with TSS or trainer role)
    const trainers = teachers.filter(teacher => 
        teacher.isActive && 
        (teacher.role === 'TRAINER' || teacher.teachingStreams?.includes('TSS'))
    )



    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return

        try {
            const response = await fetch(`/api/trainer-modules?id=${assignmentId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Assignment removed successfully!')
                fetchAllData()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to remove assignment')
            }
        } catch (error) {
            console.error('Assignment removal error:', error)
            alert('An error occurred while removing the assignment')
        }
    }





    const getLevelBadgeColor = (level: string) => {
        if (['L3', 'L4', 'L5'].includes(level)) return 'bg-purple-100 text-purple-800'
        if (level.startsWith('S')) return 'bg-indigo-100 text-indigo-800'
        if (level.startsWith('P')) return 'bg-blue-100 text-blue-800'
        return 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Dashboard</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Wrench className="h-8 w-8" />
                                    <span>Trainer-Module Assignments</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Assign trainers to specific modules
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <Link
                                    href="/dashboard/school-admin/trainer-assignments/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Assignment
                                </Link>
                                <Link
                                    href="/dashboard/school-admin/trainer-assignments/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Bulk Upload
                                </Link>
                            </div>
                            <span className="text-sm text-gray-700">
                                Welcome, {session.user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Wrench className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Trainer-Module Assignments
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {trainerAssignments.length}
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
                                        <Users className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Active Trainers
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {trainers.length}
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
                                        <BookOpen className="h-6 w-6 text-orange-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Available Modules
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <Link href="/dashboard/school-admin/modules" className="text-blue-600 hover:text-blue-800">
                                                    Manage Modules
                                                </Link>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trainer-Module Assignments */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                                Trainer-Module Assignments ({trainerAssignments.length})
                            </h3>

                            {trainerAssignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No trainer-module assignments</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Assign trainers to teach specific modules.
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            href="/dashboard/school-admin/trainer-assignments/create"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Assignment
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trainer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Module
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Level
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trade
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {trainerAssignments.map((assignment) => (
                                                <tr key={assignment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <Wrench className="h-5 w-5 text-purple-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {assignment.teacher.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {assignment.teacher.email}
                                                                </div>
                                                                {assignment.teacher.teachingStreams && (
                                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 bg-purple-100 text-purple-800">
                                                                        {assignment.teacher.teachingStreams}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {assignment.module.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Code: {assignment.module.code}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(assignment.module.level)}`}>
                                                            {assignment.module.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {assignment.module.trade || 'General'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>


        </div>
    )
}