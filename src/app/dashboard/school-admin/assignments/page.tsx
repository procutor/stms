'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, BookOpen, LogOut, Plus, X, UserCheck, GraduationCap, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'
import ProfileDropdown from '@/components/layout/ProfileDropdown'

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

interface ClassSubject {
    id: string
    classId: string
    subjectId: string
    class: Class
    subject: Subject
}

interface TeacherSubject {
    id: string
    teacherId: string
    subjectId: string
    subject: Subject
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

interface School {
    id: string
    name: string
    type: string
    address?: string
    province?: string
    district?: string
    sector?: string
    email: string
    phone?: string
    status: string
    approvedAt?: string
    createdAt: string
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
    const [classAssignments, setClassAssignments] = useState<ClassSubject[]>([])
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])
    const [teacherClassSubjectAssignments, setTeacherClassSubjectAssignments] = useState<TeacherClassSubjectAssignment[]>([])
    const [trainerClassModuleAssignments, setTrainerClassModuleAssignments] = useState<TrainerClassModuleAssignment[]>([])
    const [classSubjectAssignments, setClassSubjectAssignments] = useState<ClassSubject[]>([])
    const [showTeacherAssignments, setShowTeacherAssignments] = useState(false)
    const [showTrainerAssignments, setShowTrainerAssignments] = useState(false)
    const [showClassAssignments, setShowClassAssignments] = useState(true)

    // School info state
    const [schoolInfo, setSchoolInfo] = useState<School | null>(null)

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
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')

    // Get unique levels from classes
    const classLevels = Array.from(new Set(classes.map(cls => cls.level).filter(Boolean))).sort()

    // Edit states
    const [isEditing, setIsEditing] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<any>(null)

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
            fetchSchoolInfo()
        }
    }, [session])

    const fetchAllData = async () => {
        try {
            // Fetch class-based assignments first
            const assignmentsResponse = await fetch('/api/teacher-class-assignments')
            if (assignmentsResponse.ok) {
                const assignmentsData = await assignmentsResponse.json()
                setTeacherClassSubjectAssignments(assignmentsData.teacherClassSubjects || [])
                setTrainerClassModuleAssignments(assignmentsData.trainerClassModules || [])
            }

            // Fetch teachers
            const teachersResponse = await fetch('/api/teachers')
            if (teachersResponse.ok) {
                const teachersData = await teachersResponse.json()
                setTeachers(teachersData)
            }

            // Fetch trainers (teachers for TSS modules)
            const trainersResponse = await fetch('/api/teachers')
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
                setClasses(classesData.classes || [])
            }

            // Fetch class-subject assignments
            const classAssignmentsResponse = await fetch('/api/class-assignments')
            if (classAssignmentsResponse.ok) {
                const classAssignmentsData = await classAssignmentsResponse.json()
                setClassAssignments(classAssignmentsData.classSubjects || [])
            }

            // Fetch class-subject assignments with teacher info
            const classSubjectResponse = await fetch('/api/class-assignments')
            if (classSubjectResponse.ok) {
                const classSubjectData = await classSubjectResponse.json()
                setClassSubjectAssignments(classSubjectData.classSubjects || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSchoolInfo = async () => {
        if (session?.user?.schoolId) {
            try {
                const response = await fetch('/api/schools')
                if (response.ok) {
                    const schools = await response.json()
                    const currentSchool = schools.find((school: School) => school.id === session.user.schoolId)
                    setSchoolInfo(currentSchool || null)
                }
            } catch (error) {
                console.error('Error fetching school info:', error)
            }
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const fetchTeacherSubjects = async (teacherId: string) => {
        try {
            const response = await fetch(`/api/teacher-subjects?teacherId=${teacherId}`)
            if (response.ok) {
                const data = await response.json()
                setTeacherSubjects(data)
            }
        } catch (error) {
            console.error('Error fetching teacher subjects:', error)
        }
    }

    const handleTeacherClassSubjectAssignment = async (subjectIds?: string[]) => {
        const subjectsToAssign = subjectIds || [selectedSubject]
        if (!selectedTeacher || !selectedClass || subjectsToAssign.length === 0) return

        try {
            const assignments = subjectsToAssign.map(subjectId => ({
                teacherId: selectedTeacher,
                classId: selectedClass,
                subjectId: subjectId
            }))

            const responses = await Promise.allSettled(
                assignments.map(assignment =>
                    fetch('/api/teacher-class-assignments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(assignment)
                    })
                )
            )

            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length
            const failed = responses.length - successful

            if (successful > 0) {
                alert(`Successfully created ${successful} assignment(s). ${failed > 0 ? `${failed} failed due to duplicates.` : ''}`)
                setSelectedTeacher('')
                setSelectedClass('')
                setSelectedSubject('')
                setTeacherSubjects([])
                setShowTeacherSubjectModal(false)
                fetchAllData()
            } else {
                alert('All assignments failed. They may already exist.')
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating the assignments')
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

    const handleEditAssignment = (type: string, assignment: any) => {
        setIsEditing(true)
        setEditingAssignment(assignment)

        if (type === 'teacher') {
            setSelectedTeacher(assignment.teacherId)
            setSelectedClass(assignment.classId)
            setSelectedSubject(assignment.subjectId)
            setShowTeacherSubjectModal(true)
        } else if (type === 'trainer') {
            setSelectedTrainer(assignment.trainerId)
            setSelectedTrainerClass(assignment.classId)
            setSelectedModule(assignment.moduleId)
            setShowTrainerModuleModal(true)
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

    // Filtered assignments based on search term
    const filteredClassAssignments = classAssignments.filter(assignment =>
        assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.level.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredTeacherAssignments = teacherClassSubjectAssignments.filter(assignment =>
        assignment.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredTrainerAssignments = trainerClassModuleAssignments.filter(assignment =>
        assignment.trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Sidebar */}
            <SchoolAdminSidebar />

            {/* Main Content */}
            <div className="ml-64 flex flex-col min-h-screen">
                <header className="bg-white shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {session.user.schoolName} Assignments
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage Teacher & Trainer Assignments - {session.user.schoolType}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <ProfileDropdown
                                    user={{
                                        id: session.user.id,
                                        name: session.user.name || '',
                                        email: session.user.email || '',
                                        role: session.user.role,
                                        schoolId: session.user.schoolId,
                                        createdAt: '',
                                        updatedAt: ''
                                    }}
                                    school={schoolInfo || undefined}
                                    onSchoolUpdate={setSchoolInfo}
                                    onUserUpdate={(updatedUser) => {
                                        // Update the session user data if needed
                                        // This would typically require a session refresh
                                    }}
                                />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
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
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Teacher & Trainer Assignments</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Manage teacher-class-subject assignments and trainer-class-module assignments
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => {
                                            setShowTeacherAssignments(true)
                                            setShowTrainerAssignments(false)
                                        }}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            showTeacherAssignments
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Teacher Assignments ({teacherClassSubjectAssignments.length})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowTeacherAssignments(false)
                                            setShowTrainerAssignments(true)
                                        }}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            showTrainerAssignments
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Trainer Assignments ({trainerClassModuleAssignments.length})
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search assignments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full max-w-md"
                                />
                            </div>
                        </div>

                        {/* Teacher Assignments */}
                        {showTeacherAssignments && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Teacher-Class-Subject Assignments</h3>
                                        <button
                                            onClick={() => setShowTeacherSubjectModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign Teacher
                                        </button>
                                    </div>

                                    {filteredTeacherAssignments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No teacher assignments</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by assigning teachers to classes and subjects.</p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => setShowTeacherSubjectModal(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create First Assignment
                                                </button>
                                            </div>
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
                                                    {filteredTeacherAssignments.map((assignment) => (
                                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                            <Users className="h-5 w-5 text-blue-600" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {assignment.teacher.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {assignment.teacher.email}
                                                                        </div>
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
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => handleEditAssignment('teacher', assignment)}
                                                                        className="text-blue-600 hover:text-blue-900"
                                                                        title="Edit assignment"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveAssignment('teacher', assignment)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                        title="Remove assignment"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Trainer Assignments */}
                        {showTrainerAssignments && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Trainer-Class-Module Assignments</h3>
                                        <button
                                            onClick={() => setShowTrainerModuleModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign Trainer
                                        </button>
                                    </div>

                                    {filteredTrainerAssignments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No trainer assignments</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by assigning trainers to classes and modules.</p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => setShowTrainerModuleModal(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create First Assignment
                                                </button>
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
                                                            Class
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Module
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredTrainerAssignments.map((assignment) => (
                                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                            <Users className="h-5 w-5 text-purple-600" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {assignment.trainer.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {assignment.trainer.email}
                                                                        </div>
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
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => handleEditAssignment('trainer', assignment)}
                                                                        className="text-blue-600 hover:text-blue-900"
                                                                        title="Edit assignment"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveAssignment('trainer', assignment)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                        title="Remove assignment"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Teacher Subject Assignment Modal */}
            {showTeacherSubjectModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">
                                {isEditing ? 'Edit Teacher Assignment' : 'Assign Teacher to Class & Subjects'}
                            </h3>
                            <button onClick={() => {
                                setShowTeacherSubjectModal(false)
                                setIsEditing(false)
                                setEditingAssignment(null)
                                setSelectedTeacher('')
                                setSelectedClass('')
                                setSelectedSubject('')
                                setTeacherSubjects([])
                            }}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Teacher Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => {
                                        setSelectedTeacher(e.target.value)
                                        if (e.target.value) fetchTeacherSubjects(e.target.value)
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Choose a teacher...</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name} - {teacher.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value)
                                        // Auto-set level based on class level
                                        const selectedClassObj = classes.find(cls => cls.id === e.target.value)
                                        if (selectedClassObj) {
                                            setSelectedLevel(selectedClassObj.level || '')
                                        }
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Choose a class...</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.level})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Level Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Level</label>
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All Levels</option>
                                    {classLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Subjects</label>
                                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                                    {teacherSubjects.length === 0 ? (
                                        <p className="p-4 text-gray-500 text-sm">Select a teacher first to see available subjects</p>
                                    ) : (
                                        teacherSubjects
                                            .filter(ts => !selectedLevel || ts.subject.level === selectedLevel)
                                            .map((ts) => (
                                                <div key={ts.id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                                                    <input
                                                        type="checkbox"
                                                        id={`subject-${ts.subject.id}`}
                                                        checked={selectedSubject === ts.subject.id}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSubject(ts.subject.id)
                                                            } else {
                                                                setSelectedSubject('')
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`subject-${ts.subject.id}`} className="ml-3 text-sm">
                                                        <div className="font-medium text-gray-900">{ts.subject.name}</div>
                                                        <div className="text-gray-500">Code: {ts.subject.code} | Level: {ts.subject.level}</div>
                                                    </label>
                                                </div>
                                            ))
                                    )}
                                </div>
                                {selectedLevel && teacherSubjects.filter(ts => ts.subject.level !== selectedLevel).length > 0 && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Showing {teacherSubjects.filter(ts => ts.subject.level === selectedLevel).length} of {teacherSubjects.length} subjects for level {selectedLevel}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowTeacherSubjectModal(false)
                                        setIsEditing(false)
                                        setEditingAssignment(null)
                                        setSelectedTeacher('')
                                        setSelectedClass('')
                                        setSelectedSubject('')
                                        setTeacherSubjects([])
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleTeacherClassSubjectAssignment()}
                                    disabled={!selectedTeacher || !selectedClass || !selectedSubject}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isEditing ? 'Update Assignment' : 'Assign Teacher'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trainer Module Assignment Modal */}
            {showTrainerModuleModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">Assign Trainer to Class & Module</h3>
                            <button onClick={() => setShowTrainerModuleModal(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Trainer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Trainer</label>
                                <select
                                    value={selectedTrainer}
                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Choose a trainer...</option>
                                    {trainers.map((trainer) => (
                                        <option key={trainer.id} value={trainer.id}>
                                            {trainer.name} - {trainer.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                                <select
                                    value={selectedTrainerClass}
                                    onChange={(e) => setSelectedTrainerClass(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Choose a class...</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.level})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Module Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Choose a module...</option>
                                    {modules.map((module) => (
                                        <option key={module.id} value={module.id}>
                                            {module.name} - {module.code} ({module.level})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowTrainerModuleModal(false)
                                        setSelectedTrainer('')
                                        setSelectedTrainerClass('')
                                        setSelectedModule('')
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleTrainerClassModuleAssignment()}
                                    disabled={!selectedTrainer || !selectedTrainerClass || !selectedModule}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Assign Trainer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}