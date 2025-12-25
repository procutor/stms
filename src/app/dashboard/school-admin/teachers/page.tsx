'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, LogOut, ArrowLeft, Mail, Clock, UserCheck, Settings, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { TeacherDashboard } from '@/components/teachers'

interface Teacher {
    id: string
    name: string
    email: string
    maxWeeklyHours: number
    isActive: boolean
    teachingStreams?: string
    _count: {
        timetablesAsTeacher: number
    }
}

interface Subject {
    id: string
    name: string
    code: string
    level: string
}

interface Module {
    id: string
    name: string
    code: string
    level: string
    category: string
}

interface TeacherSubjectAssignment {
    teacherId: string
    subjectId: string
    teacher: {
        id: string
        name: string
        email: string
    }
    subject: {
        id: string
        name: string
        code: string
        level: string
    }
}

interface TrainerModuleAssignment {
    trainerId: string
    moduleId: string
    trainer: {
        id: string
        name: string
        email: string
    }
    module: {
        id: string
        name: string
        code: string
        level: string
        category: string
    }
}

export default function TeachersList() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [teacherSubjectAssignments, setTeacherSubjectAssignments] = useState<TeacherSubjectAssignment[]>([])
    const [trainerModuleAssignments, setTrainerModuleAssignments] = useState<TrainerModuleAssignment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    
    // Modal states
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [assignmentType, setAssignmentType] = useState<'subject' | 'module'>('subject')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedModule, setSelectedModule] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchData()
        }
    }, [session])

    const fetchData = async () => {
        try {
            const [teachersRes, subjectsRes, modulesRes, assignmentsRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/subjects'),
                fetch('/api/modules'),
                fetch('/api/assignments')
            ])

            if (teachersRes.ok) {
                const teachersData = await teachersRes.json()
                setTeachers(teachersData)
            }

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                setSubjects(subjectsData)
            }

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                setModules(modulesData)
            }

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json()
                setTeacherSubjectAssignments(assignmentsData.teacherSubjects || [])
                setTrainerModuleAssignments(assignmentsData.trainerModules || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getTeacherSubjects = (teacherId: string) => {
        return teacherSubjectAssignments.filter(a => a.teacherId === teacherId)
    }

    const getTeacherModules = (teacherId: string) => {
        return trainerModuleAssignments.filter(a => a.trainerId === teacherId)
    }

    const handleTeacherSelect = (teacher: Teacher) => {
        // You can implement teacher detail view or navigation here
        console.log('Selected teacher:', teacher)
        // For now, we'll open the assignment modal for the selected teacher
        openAssignmentModal(teacher)
    }

    const handleAddTeacher = () => {
        // You can implement add teacher modal or navigation here
        console.log('Add new teacher')
        // For now, you could navigate to a create teacher page or open a modal
        alert('Add Teacher functionality - This would open a form to create a new teacher')
    }

    const openAssignmentModal = (teacher: Teacher) => {
        setSelectedTeacher(teacher)
        setSelectedSubject('')
        setSelectedModule('')
        setAssignmentType('subject')
        setShowAssignmentModal(true)
    }

    const handleCreateAssignment = async () => {
        if (!selectedTeacher) return

        setIsSubmitting(true)
        try {
            if (assignmentType === 'subject') {
                if (!selectedSubject) {
                    alert('Please select a subject')
                    return
                }

                const response = await fetch('/api/teacher-subjects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacherId: selectedTeacher.id,
                        subjectId: selectedSubject
                    })
                })

                if (response.ok) {
                    alert('Subject assigned successfully!')
                    setShowAssignmentModal(false)
                    fetchData()
                } else {
                    const error = await response.json()
                    alert(error.error || 'Failed to assign subject')
                }
            } else {
                if (!selectedModule) {
                    alert('Please select a module')
                    return
                }

                const response = await fetch('/api/trainer-modules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trainerId: selectedTeacher.id,
                        moduleId: selectedModule
                    })
                })

                if (response.ok) {
                    alert('Module assigned successfully!')
                    setShowAssignmentModal(false)
                    fetchData()
                } else {
                    const error = await response.json()
                    alert(error.error || 'Failed to assign module')
                }
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating the assignment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveAssignment = async (type: 'subject' | 'module', assignment: any) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return

        try {
            if (type === 'subject') {
                const params = new URLSearchParams({
                    teacherId: assignment.teacherId,
                    subjectId: assignment.subjectId
                })

                const response = await fetch(`/api/teacher-subjects?${params}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    alert('Assignment removed successfully!')
                    fetchData()
                } else {
                    const error = await response.json()
                    alert(error.error || 'Failed to remove assignment')
                }
            } else {
                const params = new URLSearchParams({
                    trainerId: assignment.trainerId,
                    moduleId: assignment.moduleId
                })

                const response = await fetch(`/api/trainer-modules?${params}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    alert('Assignment removed successfully!')
                    fetchData()
                } else {
                    const error = await response.json()
                    alert(error.error || 'Failed to remove assignment')
                }
            }
        } catch (error) {
            console.error('Assignment removal error:', error)
            alert('An error occurred while removing the assignment')
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const filteredTeachers = teachers.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'active' && teacher.isActive) ||
                            (filterStatus === 'inactive' && !teacher.isActive)
        return matchesSearch && matchesStatus
    })

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
                                    <span>Teachers List</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - {filteredTeachers.length} of {teachers.length} teachers
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
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
                    {/* Filters and Search */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 max-w-lg">
                                    <label htmlFor="search" className="sr-only">Search teachers</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Users className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="search"
                                            id="search"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Search teachers by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                                        Status:
                                    </label>
                                    <select
                                        id="status-filter"
                                        name="status-filter"
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                    >
                                        <option value="all">All Teachers</option>
                                        <option value="active">Active Only</option>
                                        <option value="inactive">Inactive Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Dashboard Hub */}
                    <div className="mb-6">
                        <TeacherDashboard 
                            onTeacherSelect={handleTeacherSelect}
                            onAddTeacher={handleAddTeacher}
                            showFullView={true}
                        />
                    </div>

                    {/* Enhanced Teachers Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            {filteredTeachers.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {teachers.length === 0 ? 'No teachers found' : 'No teachers match your filters'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {teachers.length === 0 
                                            ? 'Teachers will appear here once they are registered in the system.'
                                            : 'Try adjusting your search or filter criteria.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Teacher
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Current Assignments
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredTeachers.map((teacher) => {
                                                const teacherSubjects = getTeacherSubjects(teacher.id)
                                                const teacherModules = getTeacherModules(teacher.id)
                                                const totalAssignments = teacherSubjects.length + teacherModules.length
                                                
                                                return (
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
                                                                        ID: {teacher.id.slice(-8)}
                                                                    </div>
                                                                    {teacher.teachingStreams && (
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                                                            teacher.teachingStreams === 'PRIMARY' ? 'bg-blue-100 text-blue-800' :
                                                                            teacher.teachingStreams === 'SECONDARY' ? 'bg-green-100 text-green-800' :
                                                                            teacher.teachingStreams === 'TSS' ? 'bg-purple-100 text-purple-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {teacher.teachingStreams}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                                {teacher.email}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                                {teacher.maxWeeklyHours} hours/week
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
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                <div className="text-gray-900 font-medium mb-1">
                                                                    {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {teacherSubjects.slice(0, 2).map((assignment) => (
                                                                        <div key={assignment.subjectId} className="flex items-center justify-between">
                                                                            <span className="text-xs text-green-600 truncate">
                                                                                {assignment.subject.name}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleRemoveAssignment('subject', assignment)}
                                                                                className="ml-2 text-red-400 hover:text-red-600"
                                                                                title="Remove assignment"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {teacherModules.slice(0, 2).map((assignment) => (
                                                                        <div key={assignment.moduleId} className="flex items-center justify-between">
                                                                            <span className="text-xs text-purple-600 truncate">
                                                                                {assignment.module.name}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleRemoveAssignment('module', assignment)}
                                                                                className="ml-2 text-red-400 hover:text-red-600"
                                                                                title="Remove assignment"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {totalAssignments > 4 && (
                                                                        <div className="text-xs text-gray-500">
                                                                            +{totalAssignments - 4} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => openAssignmentModal(teacher)}
                                                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                title="Manage assignments"
                                                            >
                                                                <Settings className="h-4 w-4 mr-1" />
                                                                Manage
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {teachers.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                                    {teachers.length}
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
                                                    {teachers.filter(t => t.isActive).length}
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
                                            <Clock className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Avg. Weekly Hours
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {teachers.length > 0 ? Math.round(teachers.reduce((sum, t) => sum + t.maxWeeklyHours, 0) / teachers.length) : 0}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Assignment Modal */}
            {showAssignmentModal && selectedTeacher && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Manage Assignments - {selectedTeacher.name}
                                </h3>
                                <button
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assignment Type
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="subject"
                                            checked={assignmentType === 'subject'}
                                            onChange={(e) => setAssignmentType(e.target.value as 'subject')}
                                            className="mr-2"
                                        />
                                        Subject
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="module"
                                            checked={assignmentType === 'module'}
                                            onChange={(e) => setAssignmentType(e.target.value as 'module')}
                                            className="mr-2"
                                        />
                                        Module
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select {assignmentType === 'subject' ? 'Subject' : 'Module'}
                                </label>
                                <select
                                    value={assignmentType === 'subject' ? selectedSubject : selectedModule}
                                    onChange={(e) => {
                                        if (assignmentType === 'subject') {
                                            setSelectedSubject(e.target.value)
                                        } else {
                                            setSelectedModule(e.target.value)
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Choose a {assignmentType === 'subject' ? 'subject' : 'module'}...</option>
                                    {(assignmentType === 'subject' ? subjects : modules).map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.code}) - {item.level}
                                            {assignmentType === 'module' && 'category' in item ? ` - ${(item as Module).category}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Assignments
                                </label>
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                                    {getTeacherSubjects(selectedTeacher.id).length === 0 &&
                                     getTeacherModules(selectedTeacher.id).length === 0 ? (
                                        <p className="text-sm text-gray-500">No current assignments</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {getTeacherSubjects(selectedTeacher.id).map((assignment) => (
                                                <div key={assignment.subjectId} className="flex items-center justify-between text-sm">
                                                    <span className="text-green-600">{assignment.subject.name}</span>
                                                    <button
                                                        onClick={() => handleRemoveAssignment('subject', assignment)}
                                                        className="text-red-400 hover:text-red-600"
                                                        title="Remove assignment"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {getTeacherModules(selectedTeacher.id).map((assignment) => (
                                                <div key={assignment.moduleId} className="flex items-center justify-between text-sm">
                                                    <span className="text-purple-600">{assignment.module.name}</span>
                                                    <button
                                                        onClick={() => handleRemoveAssignment('module', assignment)}
                                                        className="text-red-400 hover:text-red-600"
                                                        title="Remove assignment"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateAssignment}
                                    disabled={isSubmitting || (assignmentType === 'subject' ? !selectedSubject : !selectedModule)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign {assignmentType === 'subject' ? 'Subject' : 'Module'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}