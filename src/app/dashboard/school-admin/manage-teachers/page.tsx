'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Users, 
  LogOut, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  BookOpen,
  Settings,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { TeacherDashboard } from '@/components/teachers'

export default function ManageTeachers() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [showAddModal, setShowAddModal] = useState(false)

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleTeacherSelect = (teacher: any) => {
        console.log('Selected teacher:', teacher)
        // You can implement teacher detail view or navigation here
        // For now, we'll show an alert with teacher info
        alert(`Teacher Details:\nName: ${teacher.name}\nEmail: ${teacher.email}\nRole: ${teacher.role}\nStatus: ${teacher.isActive ? 'Active' : 'Inactive'}`)
    }

    const handleAddTeacher = () => {
        setShowAddModal(true)
        console.log('Add new teacher - modal would open here')
        // For now, show a placeholder
        setTimeout(() => {
            alert('Add Teacher functionality\n\nIn a real implementation, this would open a form with fields for:\n- Name\n- Email\n- Password\n- Teaching Streams\n- Max Weekly Hours\n- Availability Settings')
            setShowAddModal(false)
        }, 1000)
    }

    if (status === 'loading') {
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
                                    <span>Teacher Management</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Manage your teaching staff
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
                    
                    {/* Quick Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Quick Actions
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <Link href="/dashboard/school-admin/teacher-assignments" className="text-blue-600 hover:text-blue-800">
                                                    Manage Assignments
                                                </Link>
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
                                        <Calendar className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Timetables
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <Link href="/dashboard/school-admin/generate-timetables" className="text-blue-600 hover:text-blue-800">
                                                    Generate Schedules
                                                </Link>
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
                                                Subjects
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <Link href="/dashboard/school-admin/subjects" className="text-blue-600 hover:text-blue-800">
                                                    Manage Subjects
                                                </Link>
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
                                        <BarChart3 className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Reports
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                <Link href="/dashboard/school-admin/timetables" className="text-blue-600 hover:text-blue-800">
                                                    View Reports
                                                </Link>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Dashboard Component */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">
                                Teacher Hub Dashboard
                            </h2>
                            <p className="text-sm text-gray-600">
                                Comprehensive overview and management of your teaching staff
                            </p>
                        </div>
                        <div className="p-6">
                            <TeacherDashboard 
                                onTeacherSelect={handleTeacherSelect}
                                onAddTeacher={handleAddTeacher}
                                showFullView={true}
                            />
                        </div>
                    </div>

                    {/* Additional Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href="/dashboard/school-admin/classes"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Settings className="h-8 w-8 text-orange-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Class Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Organize and manage your classes and streams
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/school-admin/modules"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BookOpen className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Module Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Configure TSS modules and training programs
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/school-admin/time-slots"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Calendar className="h-8 w-8 text-teal-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Time Slots
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Configure school schedule and time periods
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}