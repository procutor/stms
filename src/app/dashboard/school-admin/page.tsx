'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, Users, BookOpen, Clock, LogOut, Plus, FileText, Wrench, Upload, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'
import ProfileDropdown from '@/components/layout/ProfileDropdown'

interface DashboardStats {
    totalTeachers: number
    totalClasses: number
    totalModules: number
    totalSubjects: number
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


export default function SchoolAdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [stats, setStats] = useState<DashboardStats>({
        totalTeachers: 0,
        totalClasses: 0,
        totalModules: 0,
        totalSubjects: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    // School info state
    const [schoolInfo, setSchoolInfo] = useState<School | null>(null)

    // Data states for detailed views
    const [subjects, setSubjects] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [modules, setModules] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [timetables, setTimetables] = useState<any[]>([])

    useEffect(() => {
        if (session?.user) {
            fetchDashboardStats()
            fetchSchoolInfo()
        }
    }, [session])

    // Show loading while session is being determined
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        )
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

    const handleCategorySelect = async (category: string) => {
        setSelectedCategory(category)
        
        // Fetch data for the selected category
        try {
            switch (category) {
                case 'subjects':
                    if (subjects.length === 0) {
                        const response = await fetch('/api/subjects')
                        if (response.ok) {
                            setSubjects((await response.json()).subjects || [])
                        }
                    }
                    break
                case 'classes':
                    if (classes.length === 0) {
                        const response = await fetch('/api/classes')
                        if (response.ok) {
                            setClasses(await response.json() || [])
                        }
                    }
                    break
                case 'modules':
                    if (modules.length === 0) {
                        const response = await fetch('/api/modules')
                        if (response.ok) {
                            setModules(await response.json() || [])
                        }
                    }
                    break
                case 'teachers':
                    if (teachers.length === 0) {
                        const response = await fetch('/api/teachers')
                        if (response.ok) {
                            setTeachers(await response.json())
                        }
                    }
                    break
                case 'timetables':
                    if (timetables.length === 0) {
                        const response = await fetch('/api/timetables')
                        if (response.ok) {
                            setTimetables((await response.json()).timetables || [])
                        }
                    }
                    break
            }
        } catch (error) {
            console.error('Error fetching category data:', error)
        }
    }

    const deleteSubject = async (subjectId: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return

        try {
            const response = await fetch(`/api/subjects/${subjectId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Remove from local state
                setSubjects(subjects.filter(s => s.id !== subjectId))
                // Update stats
                setStats(prev => ({ ...prev, totalSubjects: prev.totalSubjects - 1 }))
                alert('Subject deleted successfully')
            } else {
                const error = await response.json()
                alert('Failed to delete subject: ' + error.error)
            }
        } catch (error) {
            console.error('Error deleting subject:', error)
            alert('An error occurred while deleting the subject')
        }
    }

    const deleteModule = async (moduleId: string) => {
        if (!confirm('Are you sure you want to delete this module?')) return

        try {
            const response = await fetch(`/api/modules/${moduleId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Remove from local state
                setModules(modules.filter(m => m.id !== moduleId))
                // Update stats
                setStats(prev => ({ ...prev, totalModules: prev.totalModules - 1 }))
                alert('Module deleted successfully')
            } else {
                const error = await response.json()
                alert('Failed to delete module: ' + error.error)
            }
        } catch (error) {
            console.error('Error deleting module:', error)
            alert('An error occurred while deleting the module')
        }
    }

    const deleteTeacher = async (teacherId: string) => {
        if (!confirm('Are you sure you want to delete this teacher?')) return

        try {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Remove from local state
                setTeachers(teachers.filter(t => t.id !== teacherId))
                // Update stats
                setStats(prev => ({ ...prev, totalTeachers: prev.totalTeachers - 1 }))
                alert('Teacher deleted successfully')
            } else {
                const error = await response.json()
                alert('Failed to delete teacher: ' + error.error)
            }
        } catch (error) {
            console.error('Error deleting teacher:', error)
            alert('An error occurred while deleting the teacher')
        }
    }

    const fetchDashboardStats = async () => {
        try {
            // Fetch teachers count
            const teachersResponse = await fetch('/api/teachers')
            const teachersData = teachersResponse.ok ? await teachersResponse.json() : []

            // Fetch subjects count
            const subjectsResponse = await fetch('/api/subjects')
            const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : []

            // Fetch classes count
            const classesResponse = await fetch('/api/classes')
            const classesData = classesResponse.ok ? await classesResponse.json() : []

            // Fetch modules count
            const modulesResponse = await fetch('/api/modules')
            const modulesData = modulesResponse.ok ? await modulesResponse.json() : []

            setStats({
                totalTeachers: teachersData.length,
                totalClasses: classesData.length,
                totalModules: modulesData.length,
                totalSubjects: subjectsData.length
            })
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const generateTimetable = async () => {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    regenerate: false
                }),
            })

            const data = await response.json()

            if (response.ok) {
                alert(`Timetable generated successfully! ${data.conflictCount || 0} conflicts found.`)
                fetchDashboardStats()
            } else {
                alert('Failed to generate timetable: ' + data.error)
            }
        } catch (error) {
            console.error('Error generating timetable:', error)
            alert('An error occurred while generating the timetable.')
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    if (isLoading) {
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
                                    {session.user.schoolName} Dashboard
                                </h1>
                                <p className="text-sm text-gray-600">
                                    School Admin - {session.user.schoolType}
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
                        {/* Single Row Statistics Cards */}
                        <div className="flex flex-nowrap gap-4 mb-8 overflow-x-auto pb-2">
                            <div className="flex-shrink-0 w-56">
                                <Link
                                    href="/dashboard/school-admin/classes"
                                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Users className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-base font-medium truncate text-gray-700">
                                                        Total Classes
                                                    </dt>
                                                    <dd className="text-2xl font-bold text-gray-900">
                                                        {stats.totalClasses}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <Link
                                    href="/dashboard/school-admin/modules"
                                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Wrench className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-base font-medium truncate text-gray-700">
                                                        Total Modules
                                                    </dt>
                                                    <dd className="text-2xl font-bold text-gray-900">
                                                        {stats.totalModules}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <Link
                                    href="/dashboard/school-admin/subjects"
                                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <BookOpen className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-base font-medium truncate text-gray-700">
                                                        Total Subjects
                                                    </dt>
                                                    <dd className="text-2xl font-bold text-gray-900">
                                                        {stats.totalSubjects}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <Link
                                    href="/dashboard/school-admin/manage-teachers"
                                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Users className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-base font-medium truncate text-gray-700">
                                                        Total Teachers
                                                    </dt>
                                                    <dd className="text-2xl font-bold text-gray-900">
                                                        {stats.totalTeachers}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                        </div>

                        {/* Detailed View Section */}
                        {selectedCategory && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-6 sm:p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900">
                                            {selectedCategory === 'subjects' && 'Subjects List'}
                                            {selectedCategory === 'classes' && 'Classes List'}
                                            {selectedCategory === 'modules' && 'Modules List'}
                                            {selectedCategory === 'teachers' && 'Teachers List'}
                                            {selectedCategory === 'timetables' && 'Timetables List'}
                                        </h3>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    
                                    {/* Subjects Content */}
                                    {selectedCategory === 'subjects' && (
                                        <div className="overflow-x-auto">
                                            {subjects.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                        No subjects found
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Subjects will appear here once they are registered in the system.
                                                    </p>
                                                    <div className="mt-6">
                                                        <Link
                                                            href="/dashboard/school-admin/subjects/create"
                                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Create Subject
                                                        </Link>
                                                    </div>
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periods/Week</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {subjects.map((subject) => (
                                                            <tr key={subject.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.periodsPerWeek}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => router.push(`/dashboard/school-admin/subjects/${subject.id}/edit`)}
                                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                                            title="Edit subject"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteSubject(subject.id)}
                                                                            className="text-red-600 hover:text-red-900 p-1"
                                                                            title="Delete subject"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {/* Classes Content - Enhanced Class Management Style */}
                                    {selectedCategory === 'classes' && (
                                        <div className="space-y-6">
                                            {/* Quick Actions */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Classes Overview
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {classes.length} total classes in your school
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        href="/dashboard/school-admin/classes"
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        View All Classes
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/school-admin/add-classes"
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Classes
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Classes Grid */}
                                            {classes.length === 0 ? (
                                                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                        No classes found
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Classes will appear here once they are added to the system.
                                                    </p>
                                                    <div className="mt-6">
                                                        <Link
                                                            href="/dashboard/school-admin/add-classes"
                                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Classes
                                                        </Link>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {classes.slice(0, 6).map((classItem) => (
                                                        <div key={classItem.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                                                            <div className="p-6">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                            <Users className="h-5 w-5 text-green-600" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4 flex-1">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {classItem.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {classItem.level}{classItem.stream && ` ${classItem.stream}`}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="mt-4">
                                                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                                                        <div className="flex items-center">
                                                                            <BookOpen className="h-4 w-4 mr-1" />
                                                                            <span>0 subjects</span>
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <Calendar className="h-4 w-4 mr-1" />
                                                                            <span>0 timetables</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="mt-4">
                                                                    <div className="text-xs text-gray-400">
                                                                        ID: {classItem.id.slice(-8)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="bg-gray-50 px-6 py-3">
                                                                <div className="text-sm">
                                                                    <Link
                                                                        href="/dashboard/school-admin/classes"
                                                                        className="font-medium text-blue-600 hover:text-blue-500"
                                                                    >
                                                                        View Details →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Summary Stats */}
                                            {classes.length > 0 && (
                                                <div className="bg-white shadow rounded-lg p-6">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                                                        Classes Summary
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                                                            <div className="text-sm text-gray-500">Total Classes</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-green-600">
                                                                {Array.from(new Set(classes.map(c => c.level))).length}
                                                            </div>
                                                            <div className="text-sm text-gray-500">Grade Levels</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-purple-600">
                                                                {classes.filter(c => c.stream).length}
                                                            </div>
                                                            <div className="text-sm text-gray-500">With Streams</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Modules Content */}
                                    {selectedCategory === 'modules' && (
                                        <div className="overflow-x-auto">
                                            {modules.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">No modules found.</p>
                                                    <Link
                                                        href="/dashboard/school-admin/modules/create"
                                                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Create Module
                                                    </Link>
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours/Week</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {modules.map((module) => (
                                                            <tr key={module.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{module.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.code}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.level}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        module.category === 'SPECIFIC' ? 'bg-blue-100 text-blue-800' :
                                                                        module.category === 'GENERAL' ? 'bg-green-100 text-green-800' :
                                                                        'bg-purple-100 text-purple-800'
                                                                    }`}>
                                                                        {module.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{module.totalHours}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => router.push(`/dashboard/school-admin/modules/${module.id}/edit`)}
                                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                                            title="Edit module"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteModule(module.id)}
                                                                            className="text-red-600 hover:text-red-900 p-1"
                                                                            title="Delete module"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {/* Teachers Content */}
                                    {selectedCategory === 'teachers' && (
                                        <div className="overflow-x-auto">
                                            {teachers.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">No teachers found.</p>
                                                    <Link
                                                        href="/dashboard/school-admin/add-teacher"
                                                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Add Teacher
                                                    </Link>
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {teachers.map((teacher) => (
                                                            <tr key={teacher.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || '-'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {teacher.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => router.push(`/dashboard/school-admin/add-teacher?edit=${teacher.id}`)}
                                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                                            title="Edit teacher"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteTeacher(teacher.id)}
                                                                            className="text-red-600 hover:text-red-900 p-1"
                                                                            title="Delete teacher"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}

                                    {/* Timetables Content */}
                                    {selectedCategory === 'timetables' && (
                                        <div className="overflow-x-auto">
                                            {timetables.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">No timetables generated yet.</p>
                                                    <button
                                                        onClick={generateTimetable}
                                                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Generate Timetable
                                                    </button>
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timetable ID</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {timetables.map((timetable, index) => (
                                                            <tr key={timetable.id || index} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Timetable #{index + 1}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                        Active
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Default Overview - shown when no category is selected */}
                        {!selectedCategory && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-6 sm:p-6">
                                    <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4">
                                        Current School Data Overview
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-800 mb-3">Staff & Resources</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Total Teachers:</span>
                                                    <span className="text-sm font-bold text-blue-600">{stats.totalTeachers}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Total Subjects:</span>
                                                    <span className="text-sm font-bold text-green-600">{stats.totalSubjects}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-800 mb-3">Classes & Scheduling</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Total Classes:</span>
                                                    <span className="text-sm font-bold text-purple-600">{stats.totalClasses}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Total Modules:</span>
                                                    <span className="text-sm font-bold text-green-600">{stats.totalModules}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}