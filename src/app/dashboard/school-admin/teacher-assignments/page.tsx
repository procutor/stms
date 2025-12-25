'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  LogOut, 
  ArrowLeft, 
  Plus, 
  X, 
  UserCheck, 
  GraduationCap, 
  Trash2,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Save,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface Teacher {
    id: string
    name: string
    email: string
    teachingStreams: string | null
    isActive: boolean
}

interface Subject {
    id: string
    name: string
    code: string
    level: string
}

interface Class {
    id: string
    name: string
    level: string
    stream: string
}

interface TeacherClassSubject {
    id: string
    teacherId: string
    classId: string
    subjectId: string
    teacher: Teacher
    class: Class
    subject: Subject
    createdAt: string
}

export default function TeacherAssignmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    
    // Data states
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [teacherClassAssignments, setTeacherClassAssignments] = useState<TeacherClassSubject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Modal states
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    
    // Form states
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])
    
    // Filter states
    const [teacherSearch, setTeacherSearch] = useState('')
    const [classSearch, setClassSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [streamFilter, setStreamFilter] = useState('')
    
    // School type detection
    const [schoolType, setSchoolType] = useState('')
    const [schoolLevels, setSchoolLevels] = useState<string[]>([])

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
            detectSchoolType()
        }
    }, [session])

    const fetchAllData = async () => {
        try {
            setIsLoading(true)
            
            // Fetch all required data
            const [teachersRes, subjectsRes, classesRes, assignmentsRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/subjects'),
                fetch('/api/classes'),
                fetch('/api/teacher-class-assignments')
            ])

            if (teachersRes.ok) {
                const teachersData = await teachersRes.json()
                setTeachers(teachersData)
            }

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                setSubjects(subjectsData)
            }

            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setClasses(classesData)
            }

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json()
                setTeacherClassAssignments(assignmentsData.teacherClassSubjects || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const detectSchoolType = async () => {
        try {
            const response = await fetch('/api/schools')
            if (response.ok) {
                const schools = await response.json()
                const currentSchool = schools.find((s: any) => s.id === session?.user?.schoolId)
                if (currentSchool) {
                    setSchoolType(currentSchool.type)
                    
                    // Set available levels based on school type
                    if (currentSchool.type === 'TSS') {
                        setSchoolLevels(['L3', 'L4', 'L5'])
                    } else if (currentSchool.type === 'SECONDARY') {
                        setSchoolLevels(['S1', 'S2', 'S3', 'S4', 'S5', 'S6'])
                    } else {
                        setSchoolLevels(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting school type:', error)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleClassToggle = (classId: string) => {
        setSelectedClasses(prev => 
            prev.includes(classId) 
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        )
    }

    const handleSelectAllClasses = () => {
        const filteredClasses = getFilteredClasses()
        if (selectedClasses.length === filteredClasses.length) {
            setSelectedClasses([])
        } else {
            setSelectedClasses(filteredClasses.map(c => c.id))
        }
    }

    const handleCreateAssignment = async () => {
        if (!selectedTeacher || !selectedSubject || selectedClasses.length === 0) {
            alert('Please fill in all required fields and select at least one class.')
            return
        }

        try {
            const assignments = selectedClasses.map(classId => ({
                teacherId: selectedTeacher,
                classId: classId,
                subjectId: selectedSubject
            }))

            const responses = await Promise.allSettled(
                assignments.map(assignment => 
                    fetch('/api/teacher-class-assignments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(assignment)
                    })
                )
            )

            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length
            const failed = responses.length - successful

            if (successful > 0) {
                alert(`Successfully created ${successful} assignment(s). ${failed > 0 ? `${failed} failed due to duplicates.` : ''}`)
                resetForm()
                setShowAssignmentModal(false)
                fetchAllData()
            } else {
                alert('All assignments failed. They may already exist.')
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating assignments')
        }
    }

    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return

        try {
            const response = await fetch(`/api/teacher-class-assignments?id=${assignmentId}`, {
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

    const resetForm = () => {
        setSelectedTeacher('')
        setSelectedSubject('')
        setSelectedClasses([])
    }

    const getFilteredTeachers = () => {
        return teachers.filter(teacher => 
            teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            teacher.email.toLowerCase().includes(teacherSearch.toLowerCase())
        )
    }

    const getFilteredClasses = () => {
        return classes.filter(cls => {
            const matchesSearch = cls.name.toLowerCase().includes(classSearch.toLowerCase()) ||
                                cls.stream?.toLowerCase().includes(classSearch.toLowerCase())
            const matchesLevel = !levelFilter || cls.level === levelFilter
            const matchesStream = !streamFilter || cls.stream === streamFilter
            
            return matchesSearch && matchesLevel && matchesStream
        })
    }

    const getUniqueStreams = () => {
        return Array.from(new Set(classes.map(c => c.stream).filter(Boolean)))
    }

    const getStreamBadgeColor = (streams: string | null) => {
        if (!streams) return 'bg-gray-100 text-gray-800'
        
        if (streams.includes('PRIMARY')) return 'bg-blue-100 text-blue-800'
        if (streams.includes('SECONDARY')) return 'bg-green-100 text-green-800'
        if (streams.includes('TSS')) return 'bg-purple-100 text-purple-800'
        return 'bg-gray-100 text-gray-800'
    }

    const getLevelBadgeColor = (level: string) => {
        if (['L3', 'L4', 'L5'].includes(level)) return 'bg-purple-100 text-purple-800'
        if (level.startsWith('S')) return 'bg-indigo-100 text-indigo-800'
        if (level.startsWith('P')) return 'bg-blue-100 text-blue-800'
        return 'bg-gray-100 text-gray-800'
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
                                    <UserCheck className="h-8 w-8" />
                                    <span>Teacher-Subject Assignments</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Assign teachers to specific subjects for specific classes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAssignmentModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Assignment
                            </button>
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
                                        <UserCheck className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Teacher-Subject Assignments
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {teacherClassAssignments.length}
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
                                        <BookOpen className="h-6 w-6 text-orange-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Classes
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {classes.length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher-Subject Class Assignments */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                                Teacher-Subject Class Assignments ({teacherClassAssignments.length})
                            </h3>

                            {teacherClassAssignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teacher-subject class assignments</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Assign teachers to teach specific subjects in specific classes.
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAssignmentModal(true)}
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
                                                    Subject
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Class
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Level
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {teacherClassAssignments.map((assignment) => (
                                                <tr key={assignment.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-6 w-6">
                                                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <UserCheck className="h-3 w-3 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-2 text-xs">
                                                                <div className="font-medium text-gray-900">{assignment.teacher.name}</div>
                                                                <div className="text-gray-500">{assignment.teacher.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="text-xs">
                                                            <div className="font-medium text-gray-900">{assignment.subject.name}</div>
                                                            <div className="text-gray-500">({assignment.subject.code})</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="text-xs">
                                                            <div className="font-medium text-gray-900">{assignment.class.name}</div>
                                                            <div className="text-gray-500">{assignment.class.level}{assignment.class.stream ? ` • ${assignment.class.stream}` : ''}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
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

            {/* Create Assignment Modal */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">Create Teacher-Subject Assignment</h3>
                            <button onClick={() => setShowAssignmentModal(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Teacher Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search teachers..."
                                        value={teacherSearch}
                                        onChange={(e) => setTeacherSearch(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Choose a teacher...</option>
                                    {getFilteredTeachers().map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name} ({teacher.email}) {teacher.isActive ? '' : '(Inactive)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
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

                            {/* Class Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Select Classes</label>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllClasses}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            {selectedClasses.length === getFilteredClasses().length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {/* Class Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search classes..."
                                            value={classSearch}
                                            onChange={(e) => setClassSearch(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Levels</option>
                                            {schoolLevels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={streamFilter}
                                            onChange={(e) => setStreamFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Streams</option>
                                            {getUniqueStreams().map(stream => (
                                                <option key={stream} value={stream}>{stream}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Class List */}
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                                    {getFilteredClasses().length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No classes found matching the filters.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {getFilteredClasses().map(cls => (
                                                <label key={cls.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center h-5">
                                                        {selectedClasses.includes(cls.id) ? (
                                                            <CheckSquare className="h-5 w-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {cls.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Level: {cls.level} {cls.stream ? `• Stream: ${cls.stream}` : ''}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedClasses.includes(cls.id)}
                                                        onChange={() => handleClassToggle(cls.id)}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {selectedClasses.length} of {getFilteredClasses().length} classes selected
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedTeacher && selectedSubject && selectedClasses.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <h4 className="font-medium text-gray-900 mb-2">Assignment Preview</h4>
                                    <div className="text-sm text-gray-700">
                                        <p>
                                            Will create <strong>{selectedClasses.length}</strong> assignment(s) for{' '}
                                            <strong>{teachers.find(t => t.id === selectedTeacher)?.name}</strong> to teach{' '}
                                            <strong>{subjects.find(s => s.id === selectedSubject)?.name}</strong>{' '}
                                            in the following classes:
                                        </p>
                                        <ul className="mt-2 list-disc list-inside">
                                            {selectedClasses.map(classId => {
                                                const cls = classes.find(c => c.id === classId)
                                                return (
                                                    <li key={classId}>
                                                        {cls?.name} ({cls?.level} {cls?.stream ? `• ${cls.stream}` : ''})
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                            <button
                                onClick={() => {
                                    setShowAssignmentModal(false)
                                    resetForm()
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                disabled={!selectedTeacher || !selectedSubject || selectedClasses.length === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Create {selectedClasses.length} Assignment{selectedClasses.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}