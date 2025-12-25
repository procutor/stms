'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Building2, Users, BookOpen, Calendar, CheckCircle, XCircle, Clock, Settings, Plus, LogOut, X, Mail, UserCheck } from 'lucide-react'

interface School {
    id: string
    name: string
    type: string
    email: string
    phone: string | null
    address: string | null
    status: string
    approvedAt: string | null
    createdAt: string
    _count: {
        users: number
        classes: number
        subjects: number
        timetables: number
    }
}

export default function SuperAdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [schools, setSchools] = useState<School[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddSchool, setShowAddSchool] = useState(false)
    const [activeTab, setActiveTab] = useState('schools')
    const [teachersData, setTeachersData] = useState<any>(null)
    const [teachersLoading, setTeachersLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [schoolFilter, setSchoolFilter] = useState<'all' | 'approved' | 'pending'>('all')
    const [teacherFilter, setTeacherFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [stats, setStats] = useState({
        totalSchools: 0,
        approvedSchools: 0,
        pendingSchools: 0,
        totalUsers: 0
    })

    // Form state for adding new school
    const [newSchool, setNewSchool] = useState({
        schoolName: '',
        schoolType: 'PRIMARY',
        address: '',
        province: '',
        district: '',
        sector: '',
        email: '',
        phone: '',
        adminName: '',
        adminPassword: ''
    })

    useEffect(() => {
        if (status === 'loading') return // Still loading
        if (!session) {
            router.push('/auth/signin')
            return
        }
        if (session.user?.role !== 'SUPER_ADMIN') {
            router.push('/auth/signin')
            return
        }
        fetchSchoolsData()
    }, [session, status, router])

    const fetchSchoolsData = async () => {
        try {
            const response = await fetch('/api/schools')
            if (response.ok) {
                const schoolsData = await response.json()
                setSchools(schoolsData)
                
                // Calculate stats
                const totalSchools = schoolsData.length
                const approvedSchools = schoolsData.filter((s: School) => s.status === 'APPROVED').length
                const pendingSchools = schoolsData.filter((s: School) => s.status === 'PENDING').length
                const totalUsers = schoolsData.reduce((sum: number, school: School) => sum + school._count.users, 0)
                
                setStats({
                    totalSchools,
                    approvedSchools,
                    pendingSchools,
                    totalUsers
                })
            }
        } catch (error) {
            console.error('Error fetching schools:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTeachersData = async () => {
        try {
            setTeachersLoading(true)
            const response = await fetch('/api/super-admin/teachers')
            if (response.ok) {
                const data = await response.json()
                setTeachersData(data)
            }
        } catch (error) {
            console.error('Error fetching teachers:', error)
        } finally {
            setTeachersLoading(false)
        }
    }

    const updateSchoolStatus = async (schoolId: string, status: string) => {
        try {
            const response = await fetch(`/api/schools`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schoolId,
                    status
                }),
            })

            if (response.ok) {
                await fetchSchoolsData() // Refresh data
            }
        } catch (error) {
            console.error('Error updating school status:', error)
        }
    }

    const deleteSchool = async (schoolId: string, schoolName: string) => {
        const confirmation = confirm(
            `⚠️ WARNING: You are about to delete "${schoolName}"\n\n` +
            `This action will PERMANENTLY remove the school and ALL its data including:\n` +
            `• All users (admins, teachers)\n` +
            `• All classes and subjects\n` +
            `• All timetables and schedules\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Are you absolutely sure you want to proceed?`
        )
         
        if (!confirmation) {
            return
        }

        try {
            const response = await fetch(`/api/schools`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schoolId
                }),
            })

            const data = await response.json()

            if (response.ok) {
                alert(`✅ School "${schoolName}" has been permanently deleted along with all its data.`)
                await fetchSchoolsData() // Refresh data
            } else {
                alert(`❌ Failed to delete school: ${data.error || 'Unknown error occurred'}`)
            }
        } catch (error) {
            console.error('Error deleting school:', error)
            alert('❌ An error occurred while deleting the school. Please try again.')
        }
    }

    const updateTeacherStatus = async (teacherId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/teachers`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId,
                    isActive
                }),
            })

            if (response.ok) {
                // Refresh teachers data to show updated status
                if (teachersData) {
                    fetchTeachersData()
                }
            }
        } catch (error) {
            console.error('Error updating teacher status:', error)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const addSchool = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/schools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSchool),
            })

            const data = await response.json()

            if (response.ok) {
                alert(`✅ School "${newSchool.schoolName}" has been created successfully!`)
                setShowAddSchool(false)
                setNewSchool({
                    schoolName: '',
                    schoolType: 'PRIMARY',
                    address: '',
                    province: '',
                    district: '',
                    sector: '',
                    email: '',
                    phone: '',
                    adminName: '',
                    adminPassword: ''
                })
                await fetchSchoolsData() // Refresh the schools list
            } else {
                alert(`❌ Failed to create school: ${data.error || 'Unknown error occurred'}`)
            }
        } catch (error) {
            console.error('Error creating school:', error)
            alert('❌ An error occurred while creating the school. Please try again.')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'PENDING':
                return <Clock className="h-5 w-5 text-yellow-500" />
            case 'REJECTED':
                return <XCircle className="h-5 w-5 text-red-500" />
            default:
                return <Clock className="h-5 w-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800'
            case 'REJECTED':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getSchoolTypeColor = (type: string) => {
        switch (type) {
            case 'PRIMARY':
                return 'bg-blue-100 text-blue-800'
            case 'SECONDARY':
                return 'bg-purple-100 text-purple-800'
            case 'TSS':
                return 'bg-indigo-100 text-indigo-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Filter functions
    const filteredSchools = schools.filter((school) => {
        // Apply school status filter
        if (schoolFilter === 'approved' && school.status !== 'APPROVED') return false
        if (schoolFilter === 'pending' && school.status !== 'PENDING') return false
        
        // Apply search filter
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
            school.name.toLowerCase().includes(searchLower) ||
            school.email.toLowerCase().includes(searchLower) ||
            school.type.toLowerCase().includes(searchLower) ||
            (school.phone && school.phone.toLowerCase().includes(searchLower)) ||
            (school.address && school.address.toLowerCase().includes(searchLower))
        )
    })

    const filteredTeachersBySchool = teachersData ? Object.entries(teachersData.teachersBySchool).reduce((acc, [schoolId, schoolData]: [string, any]) => {
        const filteredTeachers = schoolData.teachers.filter((teacher: any) => {
            // Apply teacher status filter
            if (teacherFilter === 'active' && !teacher.isActive) return false
            if (teacherFilter === 'inactive' && teacher.isActive) return false
            
            // Apply search filter
            if (!searchTerm) return true
            const searchLower = searchTerm.toLowerCase()
            return (
                teacher.name.toLowerCase().includes(searchLower) ||
                teacher.email.toLowerCase().includes(searchLower) ||
                schoolData.school.name.toLowerCase().includes(searchLower) ||
                schoolData.school.email.toLowerCase().includes(searchLower) ||
                (teacher.teachingStreams && teacher.teachingStreams.toLowerCase().includes(searchLower))
            )
        })

        if (filteredTeachers.length > 0 || (!searchTerm && !teacherFilter && schoolData.teachers.length > 0)) {
            acc[schoolId] = {
                ...schoolData,
                teachers: filteredTeachers.length > 0 ? filteredTeachers : schoolData.teachers
            }
        }

        return acc
    }, {} as Record<string, any>) : {}

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-center flex-1">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    Super Admin Dashboard
                                </h1>
                                <p className="text-lg text-gray-600 mb-6">
                                    Welcome, {session.user.name}! Manage all schools in the system.
                                </p>
                                
                                {/* Tab Navigation */}
                                <div className="flex justify-center space-x-4 mb-6">
                                    <button
                                        onClick={() => setActiveTab('schools')}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                            activeTab === 'schools'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Building2 className="w-5 h-5 inline mr-2" />
                                        Schools
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('teachers')
                                            if (!teachersData) {
                                                fetchTeachersData()
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                            activeTab === 'teachers'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Users className="w-5 h-5 inline mr-2" />
                                        Teachers & Trainers
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 ml-4"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="mb-6">
                            <div className="relative max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={activeTab === 'schools' ? "Search schools by name, email, or type..." : "Search teachers by name, email, or school..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content based on active tab */}
                        {activeTab === 'schools' && (
                            <>
                                {/* Statistics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div
                                        className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                            schoolFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                        onClick={() => setSchoolFilter('all')}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Building2 className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Total Schools
                                                        </dt>
                                                        <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                            {stats.totalSchools}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                            schoolFilter === 'approved' ? 'ring-2 ring-green-500' : ''
                                        }`}
                                        onClick={() => setSchoolFilter('approved')}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Approved Schools
                                                        </dt>
                                                        <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                            {stats.approvedSchools}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                            schoolFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                                        }`}
                                        onClick={() => setSchoolFilter('pending')}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Clock className="h-6 w-6 text-yellow-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Pending Schools
                                                        </dt>
                                                        <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                            {stats.pendingSchools}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                            schoolFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                        onClick={() => setSchoolFilter('all')}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Users className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Total Users
                                                        </dt>
                                                        <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                            {stats.totalUsers}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schools Management */}
                                <div className="bg-white shadow rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center space-x-4">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                    Registered Schools
                                                </h3>
                                                {schoolFilter !== 'all' && (
                                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                                                        schoolFilter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {schoolFilter === 'approved' ? 'Approved Schools Only' : 'Pending Schools Only'}
                                                        <button
                                                            onClick={() => setSchoolFilter('all')}
                                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowAddSchool(true)}
                                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span>Add School</span>
                                            </button>
                                        </div>
                                        
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex">
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-amber-800">
                                                        ⚠️ School Deletion Policy
                                                    </h3>
                                                    <div className="mt-2 text-sm text-amber-700">
                                                        <p><strong>Super Admins can delete ANY registered school at any time.</strong> Deletion will permanently remove the school and ALL associated data including users, classes, subjects, and timetables. This action cannot be undone.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            School
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Contact
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Stats
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredSchools.map((school) => (
                                                        <tr key={school.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {school.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {school.email}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSchoolTypeColor(school.type)}`}>
                                                                    {school.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                <div>
                                                                    {school.phone && <div>{school.phone}</div>}
                                                                    {school.address && <div className="text-gray-500">{school.address}</div>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    {getStatusIcon(school.status)}
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(school.status)}`}>
                                                                        {school.status}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                <div className="flex space-x-4">
                                                                    <span className="flex items-center">
                                                                        <Users className="h-4 w-4 mr-1" />
                                                                        {school._count.users}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <BookOpen className="h-4 w-4 mr-1" />
                                                                        {school._count.classes}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Calendar className="h-4 w-4 mr-1" />
                                                                        {school._count.subjects}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                {school.status === 'PENDING' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => updateSchoolStatus(school.id, 'APPROVED')}
                                                                            className="text-green-600 hover:text-green-900"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateSchoolStatus(school.id, 'REJECTED')}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {school.status === 'APPROVED' && (
                                                                    <button
                                                                        onClick={() => updateSchoolStatus(school.id, 'PENDING')}
                                                                        className="text-yellow-600 hover:text-yellow-900"
                                                                    >
                                                                        Suspend
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteSchool(school.id, school.name)}
                                                                    className="text-red-600 hover:text-red-900 font-medium"
                                                                    title={`Delete this school and all its data (${school._count.users} users, ${school._count.classes} classes, ${school._count.subjects} subjects, ${school._count.timetables} timetables)`}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {filteredSchools.length === 0 && (
                                            <div className="text-center py-8">
                                                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                    {searchTerm ? 'No schools match your search' :
                                                     schoolFilter !== 'all' ? `No ${schoolFilter} schools found` :
                                                     'No schools registered'}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {searchTerm
                                                        ? 'Try adjusting your search terms'
                                                        : schoolFilter !== 'all'
                                                        ? `No schools with ${schoolFilter} status found.`
                                                        : 'Schools will appear here once they register with the system.'
                                                    }
                                                </p>
                                                <div className="mt-3 space-x-2">
                                                    {searchTerm && (
                                                        <button
                                                            onClick={() => setSearchTerm('')}
                                                            className="text-primary-600 hover:text-primary-800 font-medium"
                                                        >
                                                            Clear search
                                                        </button>
                                                    )}
                                                    {schoolFilter !== 'all' && (
                                                        <button
                                                            onClick={() => setSchoolFilter('all')}
                                                            className="text-primary-600 hover:text-primary-800 font-medium"
                                                        >
                                                            Show all schools
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Teachers & Trainers Section */}
                        {activeTab === 'teachers' && (
                            <div className="space-y-6">
                                {/* Teacher Statistics */}
                                {teachersData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div
                                            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                teacherFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                                            }`}
                                            onClick={() => {
                                                setTeacherFilter('all')
                                                setActiveTab('teachers')
                                                if (!teachersData) {
                                                    fetchTeachersData()
                                                }
                                            }}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <Users className="h-6 w-6 text-blue-400" />
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                                Total Teachers
                                                            </dt>
                                                            <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                                {teachersData.totalTeachers}
                                                            </dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                teacherFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                                            }`}
                                            onClick={() => {
                                                setTeacherFilter('all')
                                                setActiveTab('teachers')
                                                if (!teachersData) {
                                                    fetchTeachersData()
                                                }
                                            }}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <Building2 className="h-6 w-6 text-green-400" />
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                                Schools with Teachers
                                                            </dt>
                                                            <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                                {teachersData.totalSchools}
                                                            </dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                teacherFilter === 'active' ? 'ring-2 ring-green-500' : ''
                                            }`}
                                            onClick={() => {
                                                setTeacherFilter('active')
                                                setActiveTab('teachers')
                                                if (!teachersData) {
                                                    fetchTeachersData()
                                                }
                                            }}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <UserCheck className="h-6 w-6 text-purple-400" />
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                                Active Teachers
                                                            </dt>
                                                            <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                                {teachersData.teachers.filter((t: any) => t.isActive).length}
                                                            </dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                                teacherFilter === 'inactive' ? 'ring-2 ring-red-500' : ''
                                            }`}
                                            onClick={() => {
                                                setTeacherFilter('inactive')
                                                setActiveTab('teachers')
                                                if (!teachersData) {
                                                    fetchTeachersData()
                                                }
                                            }}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <XCircle className="h-6 w-6 text-red-400" />
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                                Inactive Teachers
                                                            </dt>
                                                            <dd className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                                {teachersData.teachers.filter((t: any) => !t.isActive).length}
                                                            </dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Teachers by School */}
                                <div className="bg-white shadow rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                    All Teachers & Trainers by School
                                                </h3>
                                                {teacherFilter !== 'all' && (
                                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                                                        teacherFilter === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {teacherFilter === 'active' ? 'Active Teachers Only' : 'Inactive Teachers Only'}
                                                        <button
                                                            onClick={() => setTeacherFilter('all')}
                                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {teachersLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                                <p className="mt-4 text-gray-500">Loading teachers...</p>
                                            </div>
                                        ) : teachersData ? (
                                            <div className="space-y-8">
                                                {Object.values(filteredTeachersBySchool).map((schoolData: any) => (
                                                    <div key={schoolData.school.id} className="border border-gray-200 rounded-lg p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-xl font-semibold text-gray-900">
                                                                    {schoolData.school.name}
                                                                </h4>
                                                                <p className="text-sm text-gray-500">
                                                                    {schoolData.school.type} • {schoolData.school.email}
                                                                </p>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(schoolData.school.status)}`}>
                                                                    {schoolData.school.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-gray-900">
                                                                    {schoolData.teachers.length}
                                                                </p>
                                                                <p className="text-sm text-gray-500">Teachers</p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Teacher Name
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Email
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Teaching Streams
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Status
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Actions
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Assignments
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {schoolData.teachers.map((teacher: any) => (
                                                                        <tr key={teacher.id} className="hover:bg-gray-50">
                                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                                <div className="flex items-center">
                                                                                    <div>
                                                                                        <div className="text-sm font-medium text-gray-900">
                                                                                            {teacher.name}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-500">
                                                                                            Max: {teacher.maxWeeklyHours}hrs/week
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                                <div className="flex items-center text-sm text-gray-900">
                                                                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                                                    {teacher.email}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                    teacher.teachingStreams === 'PRIMARY' ? 'bg-blue-100 text-blue-800' :
                                                                                    teacher.teachingStreams === 'SECONDARY' ? 'bg-purple-100 text-purple-800' :
                                                                                    teacher.teachingStreams === 'TSS' ? 'bg-indigo-100 text-indigo-800' :
                                                                                    'bg-orange-100 text-orange-800'
                                                                                }`}>
                                                                                    {teacher.teachingStreams ? teacher.teachingStreams.replace('_', ' & ') : 'Not Set'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                    teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                    {teacher.isActive ? 'Active' : 'Inactive'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                                {teacher.isActive ? (
                                                                                    <button
                                                                                        onClick={() => updateTeacherStatus(teacher.id, false)}
                                                                                        className="text-red-600 hover:text-red-900"
                                                                                        title="Deactivate this teacher"
                                                                                    >
                                                                                        Deactivate
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => updateTeacherStatus(teacher.id, true)}
                                                                                        className="text-green-600 hover:text-green-900"
                                                                                        title="Activate this teacher"
                                                                                    >
                                                                                        Activate
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                <div className="flex space-x-3">
                                                                                    <span className="flex items-center">
                                                                                        <BookOpen className="h-4 w-4 mr-1" />
                                                                                        {teacher._count.teacherSubjects}
                                                                                    </span>
                                                                                    <span className="flex items-center">
                                                                                        <Calendar className="h-4 w-4 mr-1" />
                                                                                        {teacher._count.trainerModules}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {schoolData.teachers.length === 0 && (
                                                            <div className="text-center py-8">
                                                                <Users className="mx-auto h-8 w-8 text-gray-400" />
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    No teachers registered for this school yet.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {Object.keys(filteredTeachersBySchool).length === 0 && teachersData.teachers.length > 0 && (
                                                    <div className="text-center py-12">
                                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                            {searchTerm ? 'No teachers match your search' :
                                                             teacherFilter !== 'all' ? `No ${teacherFilter} teachers found` :
                                                             'No teachers match your criteria'}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {searchTerm
                                                                ? 'Try adjusting your search terms to find teachers.'
                                                                : teacherFilter !== 'all'
                                                                ? `No teachers with ${teacherFilter} status found.`
                                                                : 'Try adjusting your search terms to find teachers.'
                                                            }
                                                        </p>
                                                        <div className="mt-3 space-x-2">
                                                            {searchTerm && (
                                                                <button
                                                                    onClick={() => setSearchTerm('')}
                                                                    className="text-primary-600 hover:text-primary-800 font-medium"
                                                                >
                                                                    Clear search
                                                                </button>
                                                            )}
                                                            {teacherFilter !== 'all' && (
                                                                <button
                                                                    onClick={() => setTeacherFilter('all')}
                                                                    className="text-primary-600 hover:text-primary-800 font-medium"
                                                                >
                                                                    Show all teachers
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {teachersData.teachers.length === 0 && (
                                                    <div className="text-center py-12">
                                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers registered</h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Teachers will appear here once they are added by school administrators.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">Click the Teachers & Trainers tab to load teacher data.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add School Modal */}
                {showAddSchool && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Add New School</h3>
                                <button
                                    onClick={() => setShowAddSchool(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <form onSubmit={addSchool} className="space-y-6">
                                {/* School Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">School Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.schoolName}
                                                onChange={(e) => setNewSchool({...newSchool, schoolName: e.target.value})}
                                                placeholder="Enter school name"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">School Type *</label>
                                            <select
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.schoolType}
                                                onChange={(e) => setNewSchool({...newSchool, schoolType: e.target.value})}
                                            >
                                                <option value="PRIMARY">Primary School</option>
                                                <option value="SECONDARY">Secondary School</option>
                                                <option value="TSS">Technical Secondary School</option>
                                            </select>
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.address}
                                                onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                                                placeholder="Enter school address"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Province/City *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.province}
                                                onChange={(e) => setNewSchool({...newSchool, province: e.target.value})}
                                                placeholder="Enter province or city"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.district}
                                                onChange={(e) => setNewSchool({...newSchool, district: e.target.value})}
                                                placeholder="Enter district"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Sector *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.sector}
                                                onChange={(e) => setNewSchool({...newSchool, sector: e.target.value})}
                                                placeholder="Enter sector"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.email}
                                                onChange={(e) => setNewSchool({...newSchool, email: e.target.value})}
                                                placeholder="school@example.com"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.phone}
                                                onChange={(e) => setNewSchool({...newSchool, phone: e.target.value})}
                                                placeholder="+250 XXX XXX XXX"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Information */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">School Administrator</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.adminName}
                                                onChange={(e) => setNewSchool({...newSchool, adminName: e.target.value})}
                                                placeholder="Enter admin full name"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password *</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={8}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                value={newSchool.adminPassword}
                                                onChange={(e) => setNewSchool({...newSchool, adminPassword: e.target.value})}
                                                placeholder="Minimum 8 characters"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-blue-600 mt-2">
                                        💡 The school will be created as APPROVED and the admin account will be ACTIVE immediately.
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 transition-colors font-medium"
                                    >
                                        Create School
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSchool(false)}
                                        className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}