'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, LogOut, ArrowLeft, Code, Clock, Users, GraduationCap, Plus } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface Subject {
    id: string
    name: string
    code: string
    level: string
    periodsPerWeek: number
    _count: {
        teachers: number
        classSubjects: number
        timetables: number
    }
}

export default function SubjectsList() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'name' | 'code' | 'periods'>('name')

    useEffect(() => {
        if (session?.user) {
            fetchSubjects()
        }
    }, [session])

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                const data = await response.json()
                setSubjects(data)
            }
        } catch (error) {
            console.error('Error fetching subjects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const filteredAndSortedSubjects = subjects
        .filter(subject => 
            subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'code':
                    return a.code.localeCompare(b.code)
                case 'periods':
                    return b.periodsPerWeek - a.periodsPerWeek
                default:
                    return 0
            }
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
                                        <BookOpen className="h-8 w-8" />
                                        <span>Subjects List</span>
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {session.user.schoolName} - {filteredAndSortedSubjects.length} of {subjects.length} subjects
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard/school-admin/subjects/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Subject
                                </Link>
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
                                    <label htmlFor="search" className="sr-only">Search subjects</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BookOpen className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="search"
                                            id="search"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Search subjects by name or code..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                                        Sort by:
                                    </label>
                                    <select
                                        id="sort-by"
                                        name="sort-by"
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'name' | 'code' | 'periods')}
                                    >
                                        <option value="name">Name</option>
                                        <option value="code">Code</option>
                                        <option value="periods">Periods/Week</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            {filteredAndSortedSubjects.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {subjects.length === 0 ? 'No subjects found' : 'No subjects match your search'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {subjects.length === 0 
                                            ? 'Subjects will appear here once they are registered in the system.'
                                            : 'Try adjusting your search criteria.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subject Details
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Level
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Teachers
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Classes
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Timetable Slots
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAndSortedSubjects.map((subject) => (
                                                <tr key={subject.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {subject.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 flex items-center">
                                                                    <Code className="h-3 w-3 mr-1" />
                                                                    {subject.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {subject.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                            {subject.periodsPerWeek} period{subject.periodsPerWeek !== 1 ? 's' : ''}/week
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                            {subject._count?.teachers || 0} teacher{subject._count?.teachers !== 1 ? 's' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                                                            {subject._count?.classSubjects || 0} class{subject._count?.classSubjects !== 1 ? 'es' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {subject._count?.timetables || 0} slot{subject._count?.timetables !== 1 ? 's' : ''}
                                                        </span>
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
                    {subjects.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <BookOpen className="h-6 w-6 text-gray-400" />
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

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Clock className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Total Periods/Week
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0)}
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
                                            <Users className="h-6 w-6 text-green-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Avg. Teachers/Subject
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {subjects.length > 0 ? (subjects.reduce((sum, s) => sum + (s._count?.teachers || 0), 0) / subjects.length).toFixed(1) : '0'}
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
                                            <GraduationCap className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Avg. Classes/Subject
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {subjects.length > 0 ? (subjects.reduce((sum, s) => sum + (s._count?.classSubjects || 0), 0) / subjects.length).toFixed(1) : '0'}
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