'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, LogOut, ArrowLeft, Plus, UserCheck, FileText, X, Wrench, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Import teacher management components
import TeacherStatsCards from '../../../../components/teachers/TeacherStatsCards'
import TeachersTable from '../../../../components/teachers/TeachersTable'
import AddTeacherModal from '../../../../components/teachers/AddTeacherModal'
import EditTeacherModal from '../../../../components/teachers/EditTeacherModal'
import ViewTeacherModal from '../../../../components/teachers/ViewTeacherModal'
import TrainerAssignments from '../../../../components/teachers/TrainerAssignments'
import EmptyState from '../../../../components/teachers/EmptyState'

interface Teacher {
    id: string
    name: string
    email: string
    role: string
    maxWeeklyHours?: number
    isActive: boolean
    teachingStreams?: string
    unavailableDays?: string
    unavailablePeriods?: string
    _count?: {
        teacherSubjects: number
        trainerModules: number
        timetablesAsTeacher: number
    }
}

export default function AddTeacher() {
    const { data: session, status } = useSession()
    const router = useRouter()
    
    // Teacher management states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showTrainerAssignments, setShowTrainerAssignments] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
    const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [teacherFormData, setTeacherFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        teachingStreams: '',
        maxWeeklyHours: 40,
        unavailableDays: [] as string[],
        unavailablePeriods: [] as string[]
    })

    useEffect(() => {
        if (session?.user) {
            fetchTeachers()
        }
    }, [session])

    const fetchTeachers = async () => {
        try {
            const response = await fetch('/api/teachers')
            if (response.ok) {
                const data = await response.json()
                setTeachers(data)
            }
        } catch (error) {
            console.error('Error fetching teachers:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    // Teacher management functions
    const resetTeacherForm = () => {
        setTeacherFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            teachingStreams: '',
            maxWeeklyHours: 40,
            unavailableDays: [] as string[],
            unavailablePeriods: [] as string[]
        })
    }

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...teacherFormData,
                    unavailableDays: JSON.stringify(teacherFormData.unavailableDays),
                    unavailablePeriods: JSON.stringify(teacherFormData.unavailablePeriods)
                }),
            })

            if (response.ok) {
                alert('Teacher created successfully!')
                setShowAddModal(false)
                resetTeacherForm()
                fetchTeachers()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create teacher')
            }
        } catch (error) {
            console.error('Teacher creation error:', error)
            alert('An error occurred while creating the teacher')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditTeacher = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTeacher) return

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...teacherFormData,
                    unavailableDays: JSON.stringify(teacherFormData.unavailableDays),
                    unavailablePeriods: JSON.stringify(teacherFormData.unavailablePeriods)
                }),
            })

            if (response.ok) {
                alert('Teacher updated successfully!')
                setShowEditModal(false)
                setEditingTeacher(null)
                resetTeacherForm()
                fetchTeachers()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update teacher')
            }
        } catch (error) {
            console.error('Teacher update error:', error)
            alert('An error occurred while updating the teacher')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteTeacher = async (teacherId: string) => {
        if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return

        try {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Teacher deleted successfully!')
                fetchTeachers()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete teacher')
            }
        } catch (error) {
            console.error('Teacher deletion error:', error)
            alert('An error occurred while deleting the teacher')
        }
    }

    const openEditModal = (teacher: Teacher) => {
        setEditingTeacher(teacher)
        setTeacherFormData({
            name: teacher.name,
            email: teacher.email,
            password: '',
            role: teacher.role,
            teachingStreams: teacher.teachingStreams || '',
            maxWeeklyHours: teacher.maxWeeklyHours || 40,
            unavailableDays: teacher.unavailableDays ? JSON.parse(teacher.unavailableDays) : [],
            unavailablePeriods: teacher.unavailablePeriods ? JSON.parse(teacher.unavailablePeriods) : []
        })
        setShowEditModal(true)
    }

    const openViewModal = (teacher: Teacher) => {
        setViewingTeacher(teacher)
        setShowViewModal(true)
    }

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
                                    <Users className="h-8 w-8" />
                                    <span>Add Teacher</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Teacher management and assignments
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Welcome, {session.user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-red-600 hover:text-red-800"
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
                    
                    {/* Teacher Management Section */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-6 sm:p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl leading-6 font-bold text-gray-900">Teacher Management</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowTrainerAssignments(true)}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Wrench className="h-4 w-4 mr-2" />
                                        assign modules to teacher
                                    </button>
                                    <Link
                                        href="/dashboard/school-admin/teacher-assignments"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Assign Subjects to Teacher
                                    </Link>
                                    <Link
                                        href="/dashboard/school-admin/teachers/availability"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Availability
                                    </Link>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Teacher
                                        </button>
                                        <Link
                                            href="/dashboard/school-admin/teachers/create"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                                        >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Upload Teachers
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <TeacherStatsCards teachers={teachers} />
                        </div>
                    </div>

                    {/* Teachers List */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-6 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl leading-6 font-bold text-gray-900">
                                    Teachers List
                                </h3>

                            </div>
                            
                            {/* Teachers Content */}
                            <div className="overflow-x-auto">
                                {teachers.length === 0 ? (
                                    <EmptyState onAddTeacher={() => setShowAddModal(true)} />
                                ) : (
                                    <>
                                        {/* Generate Timetable Row */}
                                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-lg font-medium text-blue-900">Generate Timetable for Registered Teachers</h4>
                                                    <p className="text-sm text-blue-700">Create a new timetable based on all registered teachers and their availability</p>
                                                </div>
                                                <Link
                                                    href="/dashboard/school-admin/generate-timetables"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Generate Timetable
                                                </Link>
                                            </div>
                                        </div>

                                        <TeachersTable
                                            teachers={teachers}
                                            onEditTeacher={openEditModal}
                                            onDeleteTeacher={handleDeleteTeacher}
                                            onViewTeacher={openViewModal}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Teacher Management Modals */}
            <AddTeacherModal
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                formData={teacherFormData}
                setFormData={setTeacherFormData}
                isSubmitting={isSubmitting}
                onSubmit={handleAddTeacher}
            />

            <EditTeacherModal
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                editingTeacher={editingTeacher}
                setEditingTeacher={setEditingTeacher}
                formData={teacherFormData}
                setFormData={setTeacherFormData}
                isSubmitting={isSubmitting}
                onSubmit={handleEditTeacher}
            />

            <ViewTeacherModal
                teacher={viewingTeacher}
                onClose={() => {
                    setShowViewModal(false)
                    setViewingTeacher(null)
                }}
            />

            {showTrainerAssignments && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Trainer Assignments Management</h3>
                            <button
                                onClick={() => setShowTrainerAssignments(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <TrainerAssignments 
                            teachers={teachers || []} 
                            onAssignmentUpdate={() => {
                                // Refresh teachers data to get updated assignment counts
                                fetchTeachers()
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    )
}