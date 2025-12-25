'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GraduationCap, LogOut, ArrowLeft, Users, BookOpen, Calendar, Plus, List, Upload } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface Class {
    id: string
    name: string
    level: string
    stream?: string
    _count: {
        subjects: number
        timetables: number
        trainerClassModules: number
    }
}

export default function ClassesList() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [classes, setClasses] = useState<Class[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterGrade, setFilterGrade] = useState<string>('all')

    useEffect(() => {
        if (session?.user) {
            fetchClasses()
        }
    }, [session])

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes')
            if (response.ok) {
                const data = await response.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Error fetching classes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const filteredClasses = classes.filter(classItem => {
        const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            classItem.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (classItem.stream && classItem.stream.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesLevel = filterGrade === 'all' || classItem.level === filterGrade
        return matchesSearch && matchesLevel
    })

    const uniqueGrades = Array.from(new Set(classes.map(c => c.level))).sort()

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
                {/* Header */}
                <header className="bg-white shadow-lg sticky top-0 z-50">
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
                                        <GraduationCap className="h-8 w-8" />
                                        <span>Classes List</span>
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {session.user.schoolName} - {filteredClasses.length} of {classes.length} classes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard/school-admin/add-classes"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Classes
                                </Link>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    View Classes
                                </button>
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
                    {/* Filters and Search */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex-1 max-w-lg">
                                    <label htmlFor="search" className="sr-only">Search classes</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <GraduationCap className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="search"
                                            id="search"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Search classes by name, level, or stream..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label htmlFor="grade-filter" className="text-sm font-medium text-gray-700">
                                        Level:
                                    </label>
                                    <select
                                        id="grade-filter"
                                        name="grade-filter"
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={filterGrade}
                                        onChange={(e) => setFilterGrade(e.target.value)}
                                    >
                                        <option value="all">All Levels</option>
                                        {uniqueGrades.map(grade => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classes Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            {filteredClasses.length === 0 ? (
                                <div className="text-center py-12">
                                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {classes.length === 0 ? 'No classes found' : 'No classes match your filters'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {classes.length === 0 ? (
                                            <>
                                                Classes will appear here once they are added to the system.{' '}
                                                <Link
                                                    href="/dashboard/school-admin/add-classes"
                                                    className="text-blue-600 hover:text-blue-500 underline"
                                                >
                                                    Add Classes
                                                </Link>
                                            </>
                                        ) : (
                                            'Try adjusting your search or filter criteria.'
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Class Information
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Students
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subjects
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Timetable
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredClasses.map((classItem) => (
                                                <tr key={classItem.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <GraduationCap className="h-5 w-5 text-green-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {classItem.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {classItem.level}{classItem.stream && classItem.stream}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    ID: {classItem.id.slice(-8)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                            0 students
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                                                            {classItem._count?.subjects || 0} subject{classItem._count?.subjects !== 1 ? 's' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                            {classItem._count?.timetables || 0} slot{classItem._count?.timetables !== 1 ? 's' : ''}
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

                    {/* Summary Stats */}
                    {classes.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <GraduationCap className="h-6 w-6 text-gray-400" />
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
                                            <Users className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Total Students
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    0
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
                                            <BookOpen className="h-6 w-6 text-green-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Avg. Students/Class
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    0
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
                                            <Calendar className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Level Count
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {uniqueGrades.length}
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
            </div>
        </div>
    )
}