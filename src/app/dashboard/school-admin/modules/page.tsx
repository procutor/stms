'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, LogOut, ArrowLeft, Plus, Edit, Trash2, Users, Clock, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface Module {
    id: string
    name: string
    code: string
    level: string
    trade?: string
    totalHours: number
    category: string
    _count?: {
        trainers: number
        timetables: number
    }
}

const MODULE_LEVELS = ['L3', 'L4', 'L5', 'SECONDARY']
const MODULE_CATEGORIES = [
    { value: 'SPECIFIC', label: 'Specific', description: 'Technical specialization modules' },
    { value: 'GENERAL', label: 'General', description: 'General education modules' },
    { value: 'COMPLEMENTARY', label: 'Complementary', description: 'Supporting skill modules' }
]

export default function ModulesList() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [modules, setModules] = useState<Module[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterLevel, setFilterLevel] = useState<string>('all')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    useEffect(() => {
        if (session?.user) {
            fetchModules()
        }
    }, [session])

    const fetchModules = async () => {
        try {
            const response = await fetch('/api/modules')
            if (response.ok) {
                const data = await response.json()
                setModules(data)
            }
        } catch (error) {
            console.error('Error fetching modules:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleDelete = async (moduleId: string, moduleName: string) => {
        if (!confirm(`Are you sure you want to delete the module "${moduleName}"? This action cannot be undone.`)) return

        try {
            const response = await fetch(`/api/modules/${moduleId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Module deleted successfully!')
                fetchModules()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete module')
            }
        } catch (error) {
            console.error('Module deletion error:', error)
            alert('An error occurred while deleting the module')
        }
    }

    const filteredModules = modules.filter(module => {
        const matchesLevel = filterLevel === 'all' || module.level === filterLevel
        const matchesCategory = filterCategory === 'all' || module.category === filterCategory
        return matchesLevel && matchesCategory
    })

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'SPECIFIC':
                return 'bg-blue-100 text-blue-800'
            case 'GENERAL':
                return 'bg-green-100 text-green-800'
            case 'COMPLEMENTARY':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'L3':
                return 'bg-red-100 text-red-800'
            case 'L4':
                return 'bg-orange-100 text-orange-800'
            case 'L5':
                return 'bg-yellow-100 text-yellow-800'
            case 'SECONDARY':
                return 'bg-indigo-100 text-indigo-800'
            default:
                return 'bg-gray-100 text-gray-800'
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
                                        <BookOpen className="h-8 w-8" />
                                        <span>TSS Modules</span>
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {session.user.schoolName} - Manage Technical & Skills School modules
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard/school-admin/modules/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Module
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
                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Level
                                        </label>
                                        <select
                                            value={filterLevel}
                                            onChange={(e) => setFilterLevel(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="all">All Levels</option>
                                            {MODULE_LEVELS.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Category
                                        </label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="all">All Categories</option>
                                            {MODULE_CATEGORIES.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Showing {filteredModules.length} of {modules.length} modules
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modules Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            {filteredModules.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {modules.length === 0 ? 'No modules found' : 'No modules match your filters'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {modules.length === 0 ? (
                                            <>
                                                TSS modules will appear here once they are created.{' '}
                                                <Link
                                                    href="/dashboard/school-admin/modules/create"
                                                    className="text-blue-600 hover:text-blue-500 underline"
                                                >
                                                    Create your first module
                                                </Link>
                                            </>
                                        ) : (
                                            'Try adjusting your filter criteria.'
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Module Details
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Level & Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trade
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Assignments
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredModules.map((module) => (
                                                <tr key={module.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {module.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Code: {module.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getLevelBadgeColor(module.level)}`}>
                                                                {module.level}
                                                            </span>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getCategoryBadgeColor(module.category)}`}>
                                                                {module.category}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {module.trade || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                            {module.totalHours} periods/week
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center">
                                                                <Users className="h-4 w-4 mr-1" />
                                                                {module._count?.trainers || 0} trainer{module._count?.trainers !== 1 ? 's' : ''}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <GraduationCap className="h-4 w-4 mr-1" />
                                                                {module._count?.timetables || 0} slot{module._count?.timetables !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={`/dashboard/school-admin/modules/${module.id}/edit`}
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            <Edit className="h-4 w-4 inline" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(module.id, module.name)}
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

                    {/* Summary Stats */}
                    {modules.length > 0 && (
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
                                                    Total Modules
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {modules.length}
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
                                                    {modules.reduce((sum, m) => sum + m.totalHours, 0)}
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
                                                    Assigned Trainers
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {modules.reduce((sum, m) => sum + (m._count?.trainers || 0), 0)}
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
                                                    Scheduled Slots
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {modules.reduce((sum, m) => sum + (m._count?.timetables || 0), 0)}
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