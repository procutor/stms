'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Clock, LogOut, ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface TimeSlot {
    id: string
    day: string
    period: number
    name: string
    startTime: string
    endTime: string
    session: string
    isBreak: boolean
    breakType?: string
    isActive: boolean
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const SESSIONS = ['MORNING', 'AFTERNOON']
const BREAK_TYPES = ['ASSEMBLY', 'MORNING_BREAK', 'LUNCH_BREAK', 'AFTERNOON_BREAK', 'END_OF_DAY']

export default function TimeSlotsManagement() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        day: 'MONDAY',
        period: 1,
        name: '',
        startTime: '',
        endTime: '',
        session: 'MORNING',
        isBreak: false,
        breakType: ''
    })

    useEffect(() => {
        if (session?.user) {
            fetchTimeSlots()
        }
    }, [session])

    const fetchTimeSlots = async () => {
        try {
            const response = await fetch('/api/time-slots')
            if (response.ok) {
                const data = await response.json()
                setTimeSlots(data)
            }
        } catch (error) {
            console.error('Error fetching time slots:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/time-slots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                alert('Time slot created successfully!')
                setShowAddModal(false)
                setFormData({
                    day: 'MONDAY',
                    period: 1,
                    name: '',
                    startTime: '',
                    endTime: '',
                    session: 'MORNING',
                    isBreak: false,
                    breakType: ''
                })
                fetchTimeSlots()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create time slot')
            }
        } catch (error) {
            console.error('Time slot creation error:', error)
            alert('An error occurred while creating the time slot')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this time slot?')) return

        try {
            const response = await fetch(`/api/time-slots/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Time slot deleted successfully!')
                fetchTimeSlots()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete time slot')
            }
        } catch (error) {
            console.error('Time slot deletion error:', error)
            alert('An error occurred while deleting the time slot')
        }
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const getSlotsByDay = (day: string) => {
        return timeSlots
            .filter(slot => slot.day === day)
            .sort((a, b) => a.period - b.period)
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
                                    <Clock className="h-8 w-8" />
                                    <span>Time Slots Management</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Configure periods and breaks
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Time Slot
                            </button>
                            <span className="text-sm text-gray-700">
                                Welcome, {session.user.name}
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
                    {/* Weekly Schedule Grid */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Weekly Schedule Overview
                            </h3>

                            {timeSlots.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No time slots configured
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Set up your school's daily schedule with periods and breaks.
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Time Slot
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {DAYS.map(day => (
                                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                                                {day.toLowerCase()}
                                            </h4>
                                            <div className="space-y-2">
                                                {getSlotsByDay(day).map(slot => (
                                                    <div
                                                        key={slot.id}
                                                        className={`flex items-center justify-between p-2 rounded-md text-sm ${
                                                            slot.isBreak
                                                                ? 'bg-red-50 border border-red-200'
                                                                : 'bg-blue-50 border border-blue-200'
                                                        }`}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium">{slot.name}</span>
                                                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                                                    slot.session === 'MORNING'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-orange-100 text-orange-800'
                                                                }`}>
                                                                    {slot.session}
                                                                </span>
                                                                {slot.isBreak && (
                                                                    <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-800">
                                                                        BREAK
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(slot.id)}
                                                            className="text-red-600 hover:text-red-900 ml-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {getSlotsByDay(day).length === 0 && (
                                                    <p className="text-sm text-gray-500 italic">No slots configured</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {timeSlots.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Clock className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Total Time Slots
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {timeSlots.length}
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
                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-blue-600">P</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Teaching Periods
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {timeSlots.filter(slot => !slot.isBreak).length}
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
                                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-red-600">B</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Break Periods
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {timeSlots.filter(slot => slot.isBreak).length}
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
                                            <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-yellow-600">M</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Morning Slots
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {timeSlots.filter(slot => slot.session === 'MORNING').length}
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

            {/* Add Time Slot Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Add Time Slot</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Day
                                </label>
                                <select
                                    value={formData.day}
                                    onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {DAYS.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Period Number
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.period}
                                    onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name (P1, P2, Break, Assembly, etc.)
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., P1, Morning Break, Assembly"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session
                                </label>
                                <select
                                    value={formData.session}
                                    onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {SESSIONS.map(session => (
                                        <option key={session} value={session}>{session}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isBreak}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isBreak: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700">This is a break period</span>
                                </label>
                            </div>

                            {formData.isBreak && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Break Type
                                    </label>
                                    <select
                                        value={formData.breakType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, breakType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select break type</option>
                                        {BREAK_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Time Slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}