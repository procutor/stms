'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, BookOpen, LogOut, ArrowLeft, Plus, X, UserCheck, GraduationCap, Trash2 } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface Teacher {
    id: string
    name: string
    email: string
    teachingStreams: string | null
    _count?: {
        teacherSubjects: number
        trainerModules: number
    }
}

interface Trainer {
    id: string
    name: string
    email: string
    teachingStreams: string | null
    _count?: {
        teacherSubjects: number
        trainerModules: number
    }
}

interface Subject {
    id: string
    name: string
    code: string
    level: string
    _count?: {
        teachers: number
    }
}

interface Module {
    id: string
    name: string
    code: string
    level: string
    category: string
    _count?: {
        trainers: number
    }
}

interface Class {
    id: string
    name: string
    level: string
    stream: string
}

interface TeacherClassSubjectAssignment {
    id: string
    teacherId: string
    classId: string
    subjectId: string
    teacher: Teacher
    class: {
        id: string
        name: string
        level: string
        stream: string
    }
    subject: Subject
}

interface TrainerClassModuleAssignment {
    id: string
    trainerId: string
    classId: string
    moduleId: string
    trainer: Trainer
    class: {
        id: string
        name: string
        level: string
        stream: string
    }
    module: Module
}

export default function AssignmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [teacherClassSubjectAssignments, setTeacherClassSubjectAssignments] = useState<TeacherClassSubjectAssignment[]>([])
    const [trainerClassModuleAssignments, setTrainerClassModuleAssignments] = useState<TrainerClassModuleAssignment[]>([])

    // Modal states
    const [showTeacherSubjectModal, setShowTeacherSubjectModal] = useState(false)
    const [showTrainerModuleModal, setShowTrainerModuleModal] = useState(false)

    // Form states
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedTrainer, setSelectedTrainer] = useState('')
    const [selectedTrainerClass, setSelectedTrainerClass] = useState('')
    const [selectedModule, setSelectedModule] = useState('')

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
        }
    }, [session])

    const fetchAllData = async () => {
        try {
            // Fetch teachers
            const teachersResponse = await fetch('/api/teachers')
            if (teachersResponse.ok) {
                const teachersData = await teachersResponse.json()
                setTeachers(teachersData)
            }

            // Fetch trainers (users with TRAINER role)
            const trainersResponse = await fetch('/api/trainers')
            if (trainersResponse.ok) {
                const trainersData = await trainersResponse.json()
                setTrainers(trainersData)
            }

            // Fetch subjects
            const subjectsResponse = await fetch('/api/subjects')
            if (subjectsResponse.ok) {
                const subjectsData = await subjectsResponse.json()
                setSubjects(subjectsData)
            }

            // Fetch modules
            const modulesResponse = await fetch('/api/modules')
            if (modulesResponse.ok) {
                const modulesData = await modulesResponse.json()
                setModules(modulesData)
            }

            // Fetch classes
            const classesResponse = await fetch('/api/classes')
            if (classesResponse.ok) {
                const classesData = await classesResponse.json()
                setClasses(classesData)
            }

            // Fetch class-based assignments
            const assignmentsResponse = await fetch('/api/teacher-class-assignments')
            if (assignmentsResponse.ok) {
                const assignmentsData = await assignmentsResponse.json()
                setTeacherClassSubjectAssignments(assignmentsData.teacherClassSubjects || [])
                setTrainerClassModuleAssignments(assignmentsData.trainerClassModules || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleTeacherClassSubjectAssignment = async () => {
        if (!selectedTeacher || !selectedClass || !selectedSubject) return

        try {
            const response = await fetch('/api/teacher-class-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId: selectedTeacher,
                    classId: selectedClass,
                    subjectId: selectedSubject
                }),
            })

            if (response.ok) {
                alert('Teacher-class-subject assignment created successfully!')
                setSelectedTeacher('')
                setSelectedClass('')
                setSelectedSubject('')
                setShowTeacherSubjectModal(false)
                fetchAllData()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create assignment')
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating the assignment')
        }
    }

    const handleTrainerClassModuleAssignment = async () => {
        if (!selectedTrainer || !selectedTrainerClass || !selectedModule) return

        try {
            const response = await fetch('/api/teacher-class-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId: selectedTrainer,
                    classId: selectedTrainerClass,
                    moduleId: selectedModule
                }),
            })

            if (response.ok) {
                alert('Trainer-class-module assignment created successfully!')
                setSelectedTrainer('')
                setSelectedTrainerClass('')
                setSelectedModule('')
                setShowTrainerModuleModal(false)
                fetchAllData()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create assignment')
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating the assignment')
        }
    }

    const handleRemoveAssignment = async (type: string, assignment: any) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return

        try {
            const response = await fetch(`/api/teacher-class-assignments?id=${assignment.id}`, {
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

    const getStreamBadgeColor = (streams: string | null) => {
        if (!streams) return 'bg-gray-100 text-gray-800'

        if (streams.includes('PRIMARY')) return 'bg-blue-100 text-blue-800'
        if (streams.includes('SECONDARY')) return 'bg-green-100 text-green-800'
        if (streams.includes('TSS')) return 'bg-purple-100 text-purple-800'
        return 'bg-gray-100 text-gray-800'
    }

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'L3': return 'bg-red-100 text-red-800'
            case 'L4': return 'bg-orange-100 text-orange-800'
            case 'L5': return 'bg-yellow-100 text-yellow-800'
            case 'SECONDARY': return 'bg-indigo-100 text-indigo-800'
            default: return 'bg-gray-100 text-gray-800'
        }
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
            {/* Sticky Sidebar */}
            <SchoolAdminSidebar />

            {/* Main Content */}
            <div className="ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white shadow sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard/school-admin"
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    <span>Back to Dashboard</span>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-2">
                                        <Users className="h-8 w-8" />
                                        <span>Assignment Management</span>
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {session.user.schoolName} - Manage teacher-subject and trainer-module assignments
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                    Welcome, {session.user.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {/* Action Buttons */}
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                    <div>
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Assignment Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Assign subjects to teachers and modules to trainers
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setShowTeacherSubjectModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign Subject to Teacher
                                        </button>
                                        <button
                                            onClick={() => setShowTrainerModuleModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign Module to Trainer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teacher-Subject Assignments */}
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                    <UserCheck className="h-5 w-5 mr-2" />
                                    Teacher-Class-Subject Assignments ({teacherClassSubjectAssignments.length})
                                </h3>

                                {teacherClassSubjectAssignments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No teacher-class-subject assignments</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Assign subjects to teachers for specific classes to enable timetable generation.
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
                                                        Class
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Subject
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {teacherClassSubjectAssignments.map((assignment, index) => (
                                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                        <UserCheck className="h-5 w-5 text-blue-600" />
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
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStreamBadgeColor(assignment.teacher.teachingStreams)}`}>
                                                                            {assignment.teacher.teachingStreams}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {assignment.class.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Level: {assignment.class.level}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {assignment.subject.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Code: {assignment.subject.code}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleRemoveAssignment('teacher-subject', assignment)}
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

                        {/* Trainer-Module Assignments */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                    <GraduationCap className="h-5 w-5 mr-2" />
                                    Trainer-Class-Module Assignments ({trainerClassModuleAssignments.length})
                                </h3>

                                {trainerClassModuleAssignments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No trainer-class-module assignments</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Assign modules to trainers for specific classes to enable timetable generation.
                                        </p>
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
                                                        Class
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Module
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Level & Category
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {trainerClassModuleAssignments.map((assignment, index) => (
                                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                        <GraduationCap className="h-5 w-5 text-green-600" />
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {assignment.trainer.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {assignment.trainer.email}
                                                                    </div>
                                                                    {assignment.trainer.teachingStreams && (
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStreamBadgeColor(assignment.trainer.teachingStreams)}`}>
                                                                            {assignment.trainer.teachingStreams}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {assignment.class.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Level: {assignment.class.level}
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
                                                            <div className="flex flex-col space-y-1">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getLevelBadgeColor(assignment.module.level)}`}>
                                                                    {assignment.module.level}
                                                                </span>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                                                                    assignment.module.category === 'SPECIFIC' ? 'bg-blue-100 text-blue-800' :
                                                                    assignment.module.category === 'GENERAL' ? 'bg-green-100 text-green-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                                }`}>
                                                                    {assignment.module.category}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleRemoveAssignment('trainer-module', assignment)}
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

                {/* Teacher-Subject Assignment Modal */}
                {showTeacherSubjectModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Assign Subject to Teacher</h3>
                                <button onClick={() => setShowTeacherSubjectModal(false)}>
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                                    <select
                                        value={selectedTeacher}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Choose a teacher...</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name} ({teacher.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Choose a class...</option>
                                        {classes.filter((cls: Class) => cls.level === 'P1' || cls.level === 'P2' || cls.level === 'P3' || cls.level === 'P4' || cls.level === 'P5').map((cls: Class) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.level})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Choose a subject...</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name} ({subject.code}) - {subject.level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowTeacherSubjectModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTeacherClassSubjectAssignment}
                                    disabled={!selectedTeacher || !selectedClass || !selectedSubject}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trainer-Module Assignment Modal */}
                {showTrainerModuleModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Assign Module to Trainer</h3>
                                <button onClick={() => setShowTrainerModuleModal(false)}>
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Trainer</label>
                                    <select
                                        value={selectedTrainer}
                                        onChange={(e) => setSelectedTrainer(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Choose a trainer...</option>
                                        {trainers.map(trainer => (
                                            <option key={trainer.id} value={trainer.id}>
                                                {trainer.name} ({trainer.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                                    <select
                                        value={selectedTrainerClass}
                                        onChange={(e) => setSelectedTrainerClass(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Choose a class...</option>
                                        {classes.filter((cls: Class) => cls.level === 'L3' || cls.level === 'L4' || cls.level === 'L5').map((cls: Class) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.level})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
                                    <select
                                        value={selectedModule}
                                        onChange={(e) => setSelectedModule(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Choose a module...</option>
                                        {modules.map(module => (
                                            <option key={module.id} value={module.id}>
                                                {module.name} ({module.code}) - {module.level} {module.category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowTrainerModuleModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTrainerClassModuleAssignment}
                                    disabled={!selectedTrainer || !selectedTrainerClass || !selectedModule}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}