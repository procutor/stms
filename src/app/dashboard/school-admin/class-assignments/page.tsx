'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, LogOut, ArrowLeft, Plus, X, GraduationCap, Trash2, Search, CheckSquare, Square, Save } from 'lucide-react'
import Link from 'next/link'

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

interface ClassSubject {
    id: string
    classId: string
    subjectId: string
    class: Class
    subject: Subject
    createdAt: string
}

export default function ClassAssignmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    // Data states
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [classAssignments, setClassAssignments] = useState<ClassSubject[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal states
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)

    // Form states
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

    // Filter states
    const [subjectSearch, setSubjectSearch] = useState('')
    const [classSearch, setClassSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState('')

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
            const [subjectsRes, classesRes, assignmentsRes] = await Promise.all([
                fetch('/api/subjects'),
                fetch('/api/classes'),
                fetch('/api/class-assignments') // Need to create this API
            ])

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
                setClassAssignments(assignmentsData.classSubjects || [])
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
                const currentSchool = schools.find((s: any) => s.id === (session?.user as any)?.schoolId)
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

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        )
    }

    const handleSelectAllSubjects = () => {
        const filteredSubjects = getFilteredSubjects()
        if (selectedSubjects.length === filteredSubjects.length) {
            setSelectedSubjects([])
        } else {
            setSelectedSubjects(filteredSubjects.map(s => s.id))
        }
    }

    const handleCreateAssignment = async () => {
        if (!selectedClass || selectedSubjects.length === 0) {
            alert('Please select a class and at least one subject.')
            return
        }

        try {
            const assignments = selectedSubjects.map(subjectId => ({
                classId: selectedClass,
                subjectId: subjectId
            }))

            const responses = await Promise.allSettled(
                assignments.map(assignment =>
                    fetch('/api/class-assignments', {
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
            const response = await fetch(`/api/class-assignments?id=${assignmentId}`, {
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
        setSelectedClass('')
        setSelectedSubjects([])
    }

    const getFilteredSubjects = () => {
        return subjects.filter(subject =>
            subject.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
            subject.code.toLowerCase().includes(subjectSearch.toLowerCase())
        )
    }

    const getFilteredClasses = () => {
        return classes.filter(cls => {
            const matchesSearch = cls.name.toLowerCase().includes(classSearch.toLowerCase()) ||
                                cls.stream?.toLowerCase().includes(classSearch.toLowerCase())
            const matchesLevel = !levelFilter || cls.level === levelFilter

            return matchesSearch && matchesLevel
        })
    }

    const getUniqueStreams = () => {
        return Array.from(new Set(classes.map(c => c.stream).filter(Boolean)))
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

    if (!session || !session.user || (session.user as any).role !== 'SCHOOL_ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-red-600">Access denied. School Admin role required.</div>
            </div>
        )
    }

    if (!(session.user as any).schoolId) {
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
                                    <BookOpen className="h-8 w-8" />
                                    <span>Class-Subject Assignments</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {(session.user as any).schoolName || 'Unknown School'} - Assign subjects to classes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAssignmentModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Assign Subjects to Class
                            </button>
                            <span className="text-sm text-gray-700">
                                Welcome, {(session.user as any).name || 'User'}
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BookOpen className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Class-Subject Assignments
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {classAssignments.length}
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
                                        <GraduationCap className="h-6 w-6 text-green-400" />
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

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BookOpen className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Subjects
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {subjects.length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Class-Subject Assignments */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                                Class-Subject Assignments ({classAssignments.length})
                            </h3>

                            {classAssignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No class-subject assignments</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Assign subjects to classes to define what will be taught.
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
                                                    Class
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subject
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
                                            {classAssignments.map((assignment) => (
                                                <tr key={assignment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {assignment.class.name}
                                                                </div>
                                                                {assignment.class.stream && (
                                                                    <div className="text-sm text-gray-500">
                                                                        Stream: {assignment.class.stream}
                                                                    </div>
                                                                )}
                                                            </div>
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
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(assignment.class.level)}`}>
                                                            {assignment.class.level}
                                                        </span>
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

            {/* Create Assignment Modal */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">Assign Subjects to Class</h3>
                            <button onClick={() => setShowAssignmentModal(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search classes..."
                                        value={classSearch}
                                        onChange={(e) => setClassSearch(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Choose a class...</option>
                                    {getFilteredClasses().map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.level} {cls.stream ? `• ${cls.stream}` : ''})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Select Subjects</label>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllSubjects}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            {selectedSubjects.length === getFilteredSubjects().length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {/* Subject Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search subjects..."
                                            value={subjectSearch}
                                            onChange={(e) => setSubjectSearch(e.target.value)}
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
                                </div>

                                {/* Subject List */}
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                                    {getFilteredSubjects().length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No subjects found matching the filters.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {getFilteredSubjects().map(subject => (
                                                <label key={subject.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center h-5">
                                                        {selectedSubjects.includes(subject.id) ? (
                                                            <CheckSquare className="h-5 w-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {subject.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Code: {subject.code} • Level: {subject.level}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubjects.includes(subject.id)}
                                                        onChange={() => handleSubjectToggle(subject.id)}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {selectedSubjects.length} of {getFilteredSubjects().length} subjects selected
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedClass && selectedSubjects.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <h4 className="font-medium text-gray-900 mb-2">Assignment Preview</h4>
                                    <div className="text-sm text-gray-700">
                                        <p>
                                            Will assign <strong>{selectedSubjects.length}</strong> subject(s) to{' '}
                                            <strong>{classes.find(c => c.id === selectedClass)?.name}</strong>:
                                        </p>
                                        <ul className="mt-2 list-disc list-inside">
                                            {selectedSubjects.map(subjectId => {
                                                const subject = subjects.find(s => s.id === subjectId)
                                                return (
                                                    <li key={subjectId}>
                                                        {subject?.name} ({subject?.code})
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
                                disabled={!selectedClass || selectedSubjects.length === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Assign {selectedSubjects.length} Subject{selectedSubjects.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}