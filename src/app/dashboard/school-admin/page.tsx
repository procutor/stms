'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, Users, BookOpen, Clock, LogOut, Plus, FileText, Wrench, Upload, MapPin, Phone, Mail, Building2, ChevronDown, ChevronUp, Edit, Save, X, User } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface DashboardStats {
    totalTeachers: number
    totalClasses: number
    totalModules: number
    totalSubjects: number
    totalTimetables: number
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
}


export default function SchoolAdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [stats, setStats] = useState<DashboardStats>({
        totalTeachers: 0,
        totalClasses: 0,
        totalModules: 0,
        totalSubjects: 0,
        totalTimetables: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    
    // School info state
    const [schoolInfo, setSchoolInfo] = useState<School | null>(null)
    const [isProfileExpanded, setIsProfileExpanded] = useState(false)
    const [isSchoolInfoLoading, setIsSchoolInfoLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedSchoolInfo, setEditedSchoolInfo] = useState<School | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    
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

    const fetchSchoolInfo = async () => {
        if (session?.user?.schoolId) {
            try {
                const response = await fetch('/api/schools')
                if (response.ok) {
                    const schools = await response.json()
                    const currentSchool = schools.find((school: School) => school.id === session.user.schoolId)
                    setSchoolInfo(currentSchool || null)
                    setEditedSchoolInfo(currentSchool || null)
                }
            } catch (error) {
                console.error('Error fetching school info:', error)
            }
        }
        setIsSchoolInfoLoading(false)
    }

    const updateSchoolInfo = async () => {
        if (!editedSchoolInfo || !session?.user?.schoolId) return
        
        setIsUpdating(true)
        try {
            const response = await fetch(`/api/schools/${session.user.schoolId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editedSchoolInfo.name,
                    address: editedSchoolInfo.address,
                    province: editedSchoolInfo.province,
                    district: editedSchoolInfo.district,
                    sector: editedSchoolInfo.sector,
                    email: editedSchoolInfo.email,
                    phone: editedSchoolInfo.phone,
                }),
            })

            if (response.ok) {
                const updatedSchool = await response.json()
                setSchoolInfo(updatedSchool)
                setEditedSchoolInfo(updatedSchool)
                setIsEditMode(false)
                alert('School information updated successfully!')
            } else {
                const error = await response.json()
                alert('Failed to update school information: ' + error.error)
            }
        } catch (error) {
            console.error('Error updating school info:', error)
            alert('An error occurred while updating school information.')
        } finally {
            setIsUpdating(false)
        }
    }

    const cancelEdit = () => {
        setEditedSchoolInfo(schoolInfo)
        setIsEditMode(false)
    }

    const handleInputChange = (field: keyof School, value: string) => {
        if (editedSchoolInfo) {
            setEditedSchoolInfo({
                ...editedSchoolInfo,
                [field]: value
            })
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
                            setSubjects(await response.json())
                        }
                    }
                    break
                case 'classes':
                    if (classes.length === 0) {
                        const response = await fetch('/api/classes')
                        if (response.ok) {
                            setClasses(await response.json())
                        }
                    }
                    break
                case 'modules':
                    if (modules.length === 0) {
                        const response = await fetch('/api/modules')
                        if (response.ok) {
                            setModules(await response.json())
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
                            setTimetables(await response.json())
                        }
                    }
                    break
            }
        } catch (error) {
            console.error('Error fetching category data:', error)
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
            
            // Fetch timetables count
            const timetablesResponse = await fetch('/api/timetables')
            const timetablesData = timetablesResponse.ok ? await timetablesResponse.json() : []

            setStats({
                totalTeachers: teachersData.length,
                totalClasses: classesData.length,
                totalModules: modulesData.length,
                totalSubjects: subjectsData.length,
                totalTimetables: timetablesData.length
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
                                    {session.user.schoolName} Dashboard
                                </h1>
                                <p className="text-sm text-gray-600">
                                    School Admin - {session.user.schoolType}
                                </p>
                            </div>
                            <div className="flex items-center space-x-6">
                                {/* School Profile Section */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                                        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        <div className="relative">
                                            <User className="h-8 w-8 text-gray-600 bg-gray-100 rounded-full p-1.5" />
                                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-gray-900">
                                                {session.user.name}
                                            </div>
                                            {!isSchoolInfoLoading && schoolInfo && (
                                                <div className="text-xs text-gray-500">
                                                    {schoolInfo.name}
                                                </div>
                                            )}
                                        </div>
                                        {isProfileExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        )}
                                    </button>

                                    {/* Expanded Profile Information */}
                                    {isProfileExpanded && !isSchoolInfoLoading && (schoolInfo || editedSchoolInfo) && (
                                        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                            <div className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                                        <h4 className="font-semibold text-gray-900 flex items-center">
                                                            <Building2 className="h-4 w-4 mr-2" />
                                                            School Information
                                                        </h4>
                                                        {!isEditMode ? (
                                                            <button
                                                                onClick={() => setIsEditMode(true)}
                                                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                                <span>Edit</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={updateSchoolInfo}
                                                                    disabled={isUpdating}
                                                                    className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                                                                >
                                                                    <Save className="h-3 w-3" />
                                                                    <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    disabled={isUpdating}
                                                                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                    <span>Cancel</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditMode && editedSchoolInfo ? (
                                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                                            <div className="flex items-center space-x-2">
                                                                <Building2 className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium text-gray-600 w-16">Type:</span>
                                                                <span className="uppercase text-gray-900 bg-gray-100 px-2 py-1 rounded">{editedSchoolInfo.type}</span>
                                                            </div>

                                                            <div className="flex items-start space-x-2">
                                                                <Building2 className="h-3 w-3 text-gray-400 mt-1" />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-600 mb-1">Name:</div>
                                                                    <input
                                                                        type="text"
                                                                        value={editedSchoolInfo.name || ''}
                                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                                                                        placeholder="School name"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-start space-x-2">
                                                                <MapPin className="h-3 w-3 text-gray-400 mt-1" />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-600 mb-1">Address:</div>
                                                                    <textarea
                                                                        value={editedSchoolInfo.address || ''}
                                                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                                                                        placeholder="School address"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="flex items-start space-x-1">
                                                                    <MapPin className="h-3 w-3 text-gray-400 mt-1" />
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-600 mb-1 text-xs">Sector:</div>
                                                                        <input
                                                                            type="text"
                                                                            value={editedSchoolInfo.sector || ''}
                                                                            onChange={(e) => handleInputChange('sector', e.target.value)}
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-xs"
                                                                            placeholder="Sector"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start space-x-1">
                                                                    <MapPin className="h-3 w-3 text-gray-400 mt-1" />
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-600 mb-1 text-xs">District:</div>
                                                                        <input
                                                                            type="text"
                                                                            value={editedSchoolInfo.district || ''}
                                                                            onChange={(e) => handleInputChange('district', e.target.value)}
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-xs"
                                                                            placeholder="District"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start space-x-1">
                                                                    <MapPin className="h-3 w-3 text-gray-400 mt-1" />
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-600 mb-1 text-xs">Province:</div>
                                                                        <input
                                                                            type="text"
                                                                            value={editedSchoolInfo.province || ''}
                                                                            onChange={(e) => handleInputChange('province', e.target.value)}
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-xs"
                                                                            placeholder="Province"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <Mail className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium text-gray-600 w-16">Email:</span>
                                                                <input
                                                                    type="email"
                                                                    value={editedSchoolInfo.email || ''}
                                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                                                    placeholder="Email"
                                                                />
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <Phone className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium text-gray-600 w-16">Phone:</span>
                                                                <input
                                                                    type="tel"
                                                                    value={editedSchoolInfo.phone || ''}
                                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                                                    placeholder="Phone number"
                                                                />
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium text-gray-600 w-16">Status:</span>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    editedSchoolInfo.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                                    editedSchoolInfo.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    editedSchoolInfo.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {editedSchoolInfo.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : schoolInfo ? (
                                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                                            <div className="flex items-center space-x-2">
                                                                <Building2 className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium text-gray-600">Type:</span>
                                                                <span className="uppercase text-gray-900">{schoolInfo.type}</span>
                                                            </div>

                                                            <div className="flex items-start space-x-2">
                                                                <Building2 className="h-3 w-3 text-gray-400 mt-0.5" />
                                                                <div>
                                                                    <div className="font-medium text-gray-600">Name:</div>
                                                                    <div className="text-gray-900 ml-4">{schoolInfo.name}</div>
                                                                </div>
                                                            </div>

                                                            {schoolInfo.address && (
                                                                <div className="flex items-start space-x-2">
                                                                    <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                                                                    <div>
                                                                        <div className="font-medium text-gray-600">Address:</div>
                                                                        <div className="text-gray-900 ml-4">{schoolInfo.address}</div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(schoolInfo.province || schoolInfo.district || schoolInfo.sector) && (
                                                                <div className="flex items-start space-x-2">
                                                                    <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                                                                    <div>
                                                                        <div className="font-medium text-gray-600">Location:</div>
                                                                        <div className="text-gray-900 ml-4">
                                                                            {schoolInfo.sector && <div>Sector: {schoolInfo.sector}</div>}
                                                                            {schoolInfo.district && <div>District: {schoolInfo.district}</div>}
                                                                            {schoolInfo.province && <div>Province: {schoolInfo.province}</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center space-x-2">
                                                                <Mail className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium text-gray-600">Email:</span>
                                                                <span className="text-gray-900 break-all">{schoolInfo.email}</span>
                                                            </div>

                                                            {schoolInfo.phone && (
                                                                <div className="flex items-center space-x-2">
                                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                                    <span className="font-medium text-gray-600">Phone:</span>
                                                                    <span className="text-gray-900">{schoolInfo.phone}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium text-gray-600">Status:</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                                    schoolInfo.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                                    schoolInfo.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    schoolInfo.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {schoolInfo.status}
                                                                </span>
                                                            </div>

                                                            {schoolInfo.approvedAt && (
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="font-medium text-gray-600">Approved:</span>
                                                                    <span className="text-gray-900">{new Date(schoolInfo.approvedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isSchoolInfoLoading && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                                            <div className="text-sm text-gray-500">Loading school information...</div>
                                        </div>
                                    )}
                                </div>

                                {/* Sign Out Button - Right of Profile */}
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
                                <button
                                    onClick={() => handleCategorySelect('classes')}
                                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full ${
                                        selectedCategory === 'classes' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Users className={`h-8 w-8 ${
                                                    selectedCategory === 'classes' ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className={`text-base font-medium truncate ${
                                                        selectedCategory === 'classes' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        Total Classes
                                                    </dt>
                                                    <dd className={`text-2xl font-bold ${
                                                        selectedCategory === 'classes' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                        {stats.totalClasses}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <button
                                    onClick={() => handleCategorySelect('modules')}
                                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full ${
                                        selectedCategory === 'modules' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Wrench className={`h-8 w-8 ${
                                                    selectedCategory === 'modules' ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className={`text-base font-medium truncate ${
                                                        selectedCategory === 'modules' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        Total Modules
                                                    </dt>
                                                    <dd className={`text-2xl font-bold ${
                                                        selectedCategory === 'modules' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                        {stats.totalModules}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <button
                                    onClick={() => handleCategorySelect('subjects')}
                                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full ${
                                        selectedCategory === 'subjects' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <BookOpen className={`h-8 w-8 ${
                                                    selectedCategory === 'subjects' ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className={`text-base font-medium truncate ${
                                                        selectedCategory === 'subjects' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        Total Subjects
                                                    </dt>
                                                    <dd className={`text-2xl font-bold ${
                                                        selectedCategory === 'subjects' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                        {stats.totalSubjects}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <button
                                    onClick={() => handleCategorySelect('teachers')}
                                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full ${
                                        selectedCategory === 'teachers' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Users className={`h-8 w-8 ${
                                                    selectedCategory === 'teachers' ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className={`text-base font-medium truncate ${
                                                        selectedCategory === 'teachers' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        Total Teachers
                                                    </dt>
                                                    <dd className={`text-2xl font-bold ${
                                                        selectedCategory === 'teachers' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                        {stats.totalTeachers}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex-shrink-0 w-56">
                                <button
                                    onClick={() => handleCategorySelect('timetables')}
                                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-all text-left block w-full ${
                                        selectedCategory === 'timetables' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Clock className={`h-8 w-8 ${
                                                    selectedCategory === 'timetables' ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className={`text-base font-medium truncate ${
                                                        selectedCategory === 'timetables' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        Generated Timetables
                                                    </dt>
                                                    <dd className={`text-2xl font-bold ${
                                                        selectedCategory === 'timetables' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                        {stats.totalTimetables}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </button>
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
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">No subjects found.</p>
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periods/Week</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {subjects.map((subject) => (
                                                            <tr key={subject.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.periodsPerWeek}</td>
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
                                                    <span className="text-sm font-medium text-gray-600">Generated Timetables:</span>
                                                    <span className="text-sm font-bold text-orange-600">{stats.totalTimetables}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <span className="font-medium">Click on any category above</span> to view detailed information. Selected categories will be highlighted in blue.
                                        </p>
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