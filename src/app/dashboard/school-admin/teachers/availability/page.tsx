'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Clock, LogOut, ArrowLeft, Save, UserCheck, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Teacher {
    id: string
    name: string
    email: string
    role: string
    teachingStreams: string | null
    unavailableDays: string[] | null
    unavailablePeriods: string[] | null
    maxWeeklyHours: number
    isActive: boolean
}

const DAYS_OF_WEEK = [
    { id: 'MONDAY', label: 'Monday' },
    { id: 'TUESDAY', label: 'Tuesday' },
    { id: 'WEDNESDAY', label: 'Wednesday' },
    { id: 'THURSDAY', label: 'Thursday' },
    { id: 'FRIDAY', label: 'Friday' },
    { id: 'SATURDAY', label: 'Saturday' },
    { id: 'SUNDAY', label: 'Sunday' }
]

const TIME_PERIODS = [
    { id: 'P1', label: 'Period 1 (8:00-9:00)', time: '8:00-9:00' },
    { id: 'P2', label: 'Period 2 (9:00-10:00)', time: '9:00-10:00' },
    { id: 'P3', label: 'Period 3 (10:00-11:00)', time: '10:00-11:00' },
    { id: 'BREAK1', label: 'Break (11:00-11:15)', time: '11:00-11:15' },
    { id: 'P4', label: 'Period 4 (11:15-12:15)', time: '11:15-12:15' },
    { id: 'P5', label: 'Period 5 (12:15-13:15)', time: '12:15-13:15' },
    { id: 'LUNCH', label: 'Lunch (13:15-14:00)', time: '13:15-14:00' },
    { id: 'P6', label: 'Period 6 (14:00-15:00)', time: '14:00-15:00' },
    { id: 'P7', label: 'Period 7 (15:00-16:00)', time: '15:00-16:00' },
    { id: 'P8', label: 'Period 8 (16:00-17:00)', time: '16:00-17:00' }
]

export default function TeacherAvailabilityPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Availability state
    const [unavailableDays, setUnavailableDays] = useState<string[]>([])
    const [unavailablePeriods, setUnavailablePeriods] = useState<string[]>([])

    useEffect(() => {
        if (session?.user) {
            fetchTeachers()
        }
    }, [session])

    const fetchTeachers = async () => {
        try {
            // Fetch teachers
            const teachersResponse = await fetch('/api/teachers')
            if (teachersResponse.ok) {
                const teachersData = await teachersResponse.json()
                setTeachers(teachersData)
            }

            // Also fetch trainers
            const trainersResponse = await fetch('/api/trainers')
            if (trainersResponse.ok) {
                const trainersData = await trainersResponse.json()
                setTeachers(prev => [...prev, ...trainersData])
            }
        } catch (error) {
            console.error('Error fetching teachers:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleTeacherSelect = (teacher: Teacher) => {
        setSelectedTeacher(teacher)
        setUnavailableDays(teacher.unavailableDays || [])
        setUnavailablePeriods(teacher.unavailablePeriods || [])
    }

    const handleDayToggle = (dayId: string) => {
        setUnavailableDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }

    const handlePeriodToggle = (periodId: string) => {
        setUnavailablePeriods(prev =>
            prev.includes(periodId)
                ? prev.filter(p => p !== periodId)
                : [...prev, periodId]
        )
    }

    const handleSave = async () => {
        if (!selectedTeacher) return

        setIsSaving(true)
        try {
            const response = await fetch(`/api/teachers/${selectedTeacher.id}/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unavailableDays,
                    unavailablePeriods
                }),
            })

            if (response.ok) {
                alert('Teacher availability updated successfully!')
                // Refresh teacher data
                await fetchTeachers()
                // Keep the same teacher selected but with updated data
                const updatedTeacher = teachers.find(t => t.id === selectedTeacher.id)
                if (updatedTeacher) {
                    setSelectedTeacher(updatedTeacher)
                }
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update availability')
            }
        } catch (error) {
            console.error('Save error:', error)
            alert('An error occurred while saving availability')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const getStreamBadgeColor = (streams: string | null) => {
        if (!streams) return 'bg-gray-100 text-gray-800'

        if (streams.includes('PRIMARY')) return 'bg-blue-100 text-blue-800'
        if (streams.includes('SECONDARY')) return 'bg-green-100 text-green-800'
        if (streams.includes('TSS')) return 'bg-purple-100 text-purple-800'
        return 'bg-gray-100 text-gray-800'
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'TEACHER': return 'bg-blue-100 text-blue-800'
            case 'TRAINER': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin"
                                className="flex items-center space-x-2 text-sky-100 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Dashboard</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                                    <Clock className="h-8 w-8" />
                                    <span>Teacher Availability</span>
                                </h1>
                                <p className="text-sm text-sky-100">
                                    {session.user.schoolName} - Manage teacher and trainer availability constraints
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-sky-100">
                                Welcome, {session.user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-sky-100 hover:text-white transition-colors"
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Teachers List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Select Teacher/Trainer
                                    </h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {teachers.map((teacher) => (
                                            <button
                                                key={teacher.id}
                                                onClick={() => handleTeacherSelect(teacher)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                                    selectedTeacher?.id === teacher.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <UserCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                                {teacher.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {teacher.email}
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(teacher.role)}`}>
                                                                {teacher.role}
                                                            </span>
                                                            {teacher.teachingStreams && (
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStreamBadgeColor(teacher.teachingStreams)}`}>
                                                                    {teacher.teachingStreams}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Availability Settings */}
                        <div className="lg:col-span-2">
                            {selectedTeacher ? (
                                <div className="space-y-6">
                                    {/* Teacher Info */}
                                    <div className="bg-white shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Availability for {selectedTeacher.name}
                                            </h3>
                                            <div className="flex items-center space-x-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedTeacher.role)}`}>
                                                    {selectedTeacher.role}
                                                </span>
                                                {selectedTeacher.teachingStreams && (
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStreamBadgeColor(selectedTeacher.teachingStreams)}`}>
                                                        {selectedTeacher.teachingStreams}
                                                    </span>
                                                )}
                                                <span className="text-sm text-gray-600">
                                                    Max {selectedTeacher.maxWeeklyHours} hours/week
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unavailable Days */}
                                    <div className="bg-white shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                                <Calendar className="h-5 w-5 mr-2" />
                                                Unavailable Days
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Select days when this teacher/trainer is not available for teaching.
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <label key={day.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={unavailableDays.includes(day.id)}
                                                            onChange={() => handleDayToggle(day.id)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-900">
                                                            {day.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unavailable Periods */}
                                    <div className="bg-white shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                                <Clock className="h-5 w-5 mr-2" />
                                                Unavailable Periods
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Select specific time periods when this teacher/trainer is not available.
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {TIME_PERIODS.map((period) => (
                                                    <label key={period.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={unavailablePeriods.includes(period.id)}
                                                            onChange={() => handlePeriodToggle(period.id)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-900">
                                                            {period.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Rules */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="flex">
                                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-yellow-800">
                                                        System Rules Applied
                                                    </h3>
                                                    <div className="mt-2 text-sm text-yellow-700">
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            <li>Maximum 2 consecutive teaching periods per teacher</li>
                                                            <li>Unavailable days and periods will be respected</li>
                                                            <li>Weekly hour limits will not be exceeded</li>
                                                            <li>Teaching stream constraints will be enforced</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5 mr-2" />
                                                    Save Availability
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white shadow rounded-lg">
                                    <div className="px-4 py-5 sm:p-6 text-center">
                                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            Select a Teacher or Trainer
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Choose a teacher or trainer from the list to manage their availability constraints.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}