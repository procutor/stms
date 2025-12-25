'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, LogOut, ArrowLeft, Download, Eye, Printer, FileText, Trash2, Grid, List, BookOpen, File, Clock, X, Search, Filter, User } from 'lucide-react'
import Link from 'next/link'
import CompactA4Timetable from '@/components/timetable/CompactA4Timetable'
import { SinglePDFExportButton } from '@/components/pdf/PDFExportButton'
import { CSVGridExportButton, CSVListExportButton } from '@/components/csv/CSVExportButton'
import '@/styles/compact-timetable.css'

interface TimetableEntry {
    id: string
    schoolId: string
    classId: string
    teacherId: string
    subjectId?: string
    moduleId?: string
    timeSlotId: string
    createdAt: string
    updatedAt: string
    class: {
        name: string
        level: string
    }
    teacher: {
        name: string
    }
    subject?: {
        name: string
    }
    module?: {
        name: string
        category: string
    }
    timeSlot: {
        day: string
        period: number
        startTime: string
        endTime: string
        name: string
        isBreak: boolean
        breakType?: string
    }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_LABELS = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday'
}

// Updated P1-P10 period schedule (08:00-16:50 only)
const PERIOD_SCHEDULE = [
    { period: 1, start: '08:00', end: '08:40', isBreak: false },
    { period: 2, start: '08:40', end: '09:20', isBreak: false },
    { period: 3, start: '09:20', end: '10:00', isBreak: false },
    { period: 4, start: '10:20', end: '11:00', isBreak: false },
    { period: 5, start: '11:00', end: '11:40', isBreak: false },
    { period: 6, start: '13:10', end: '13:50', isBreak: false },
    { period: 7, start: '13:50', end: '14:30', isBreak: false },
    { period: 8, start: '14:30', end: '15:10', isBreak: false },
    { period: 9, start: '15:30', end: '16:10', isBreak: false },
    { period: 10, start: '16:10', end: '16:50', isBreak: false }
]

// Break definitions for display (separate from periods)
const BREAKS = [
    { name: 'MORNING BREAK', start: '10:00', end: '10:20' },
    { name: 'LUNCH BREAK', start: '11:40', end: '13:10' },
    { name: 'AFTERNOON BREAK', start: '15:10', end: '15:30' }
]

export default function TeacherTimetables() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [timetables, setTimetables] = useState<TimetableEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<string>('all')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'regular' | 'compact' | 'list'>('regular')
    const [isClearing, setIsClearing] = useState(false)
    const [teachers, setTeachers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchTimetables()
            fetchTeachers()
        }
    }, [session])

    const fetchTimetables = async () => {
        try {
            const response = await fetch('/api/timetables')
            if (response.ok) {
                const data = await response.json()
                setTimetables(data)
            }
        } catch (error) {
            console.error('Error fetching timetables:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTeachers = async () => {
        try {
            const response = await fetch('/api/teachers')
            if (response.ok) {
                const data = await response.json()
                setTeachers(data)
            }
        } catch (error) {
            console.error('Error fetching teachers:', error)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    // Filter timetables by teacher and search term
    const filteredTimetables = timetables.filter(timetable => {
        const matchesDay = selectedDay === 'all' || timetable.timeSlot.day === selectedDay
        const matchesTeacher = selectedTeacher === 'all' || timetable.teacherId === selectedTeacher
        const matchesSearch = searchTerm === '' ||
            timetable.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            timetable.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (timetable.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (timetable.module?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        return matchesDay && matchesTeacher && matchesSearch
    })

    // Group timetables by teacher
    const teacherTimetables = Array.from(new Set(filteredTimetables.map(t => t.teacherId))).map(teacherId => {
        const teacherTimetable = filteredTimetables.filter(t => t.teacherId === teacherId)
        return {
            id: teacherId,
            name: teacherTimetable[0]?.teacher?.name || 'Unknown Teacher',
            entries: teacherTimetable,
            createdAt: teacherTimetable[0]?.createdAt || new Date().toISOString()
        }
    }).sort((a, b) => a.name.localeCompare(b.name))

    const getTimetableGrid = (teacherEntries: TimetableEntry[]) => {
        const grid: { [key: string]: { [key: number]: TimetableEntry | null } } = {}

        DAYS.forEach(day => {
            grid[day] = {}
            PERIOD_SCHEDULE.forEach(({ period }) => {
                grid[day][period] = null
            })
        })

        teacherEntries.forEach(entry => {
            if (grid[entry.timeSlot.day] && entry.timeSlot.period) {
                grid[entry.timeSlot.day][entry.timeSlot.period] = entry
            }
        })

        return grid
    }

    const getCellContent = (entry: TimetableEntry | null) => {
        if (!entry) return 'FREE'

        const subjectName = entry.subject?.name || entry.module?.name || 'N/A'
        const className = entry.class.name
        const isSubject = !!entry.subject
        const category = entry.module?.category || 'default'

        // For teacher view: show subject/module + class
        return { subjectName, className, isSubject, category }
    }

    const getSubjectColor = (isSubject: boolean, category: string) => {
        if (isSubject) {
            // Subject colors
            const subjectColors = {
                'MATHEMATICS': 'bg-blue-100 text-blue-800 border-blue-200',
                'ENGLISH': 'bg-green-100 text-green-800 border-green-200',
                'KINYARWANDA': 'bg-purple-100 text-purple-800 border-purple-200',
                'FRANCAIS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
                'SCIENCE': 'bg-red-100 text-red-800 border-red-200',
                'SOCIAL_STUDIES': 'bg-orange-100 text-orange-800 border-orange-200',
                'CREATIVE_ARTS': 'bg-pink-100 text-pink-800 border-pink-200',
                'PHYSICAL_EDUCATION': 'bg-teal-100 text-teal-800 border-teal-200',
                'RELIGION': 'bg-amber-100 text-amber-800 border-amber-200',
                'COMPUTER_SCIENCE': 'bg-cyan-100 text-cyan-800 border-cyan-200'
            }
            return subjectColors[subjectName.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
        } else {
            // Module colors based on category
            const moduleColors = {
                'TECHNICAL': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                'VOCATIONAL': 'bg-violet-100 text-violet-800 border-violet-200',
                'GENERAL': 'bg-slate-100 text-slate-800 border-slate-200',
                'default': 'bg-gray-100 text-gray-800 border-gray-200'
            }
            return moduleColors[category.toUpperCase()] || moduleColors.default
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleClearAllTimetables = async () => {
        if (!confirm('Are you sure you want to delete ALL timetables? This action cannot be undone.')) {
            return
        }

        setIsClearing(true)
        try {
            const response = await fetch('/api/timetables?clearAll=true', {
                method: 'DELETE'
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Successfully deleted ${result.deletedCount} timetables.`)
                setTimetables([])
                // Refresh the page to update all components
                window.location.reload()
            } else {
                const error = await response.json()
                alert('Failed to clear timetables: ' + error.error)
            }
        } catch (error) {
            console.error('Error clearing timetables:', error)
            alert('An error occurred while clearing timetables.')
        } finally {
            setIsClearing(false)
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
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border { border: 1px solid #d1d5db !important; }
                    .print\\:text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                    .print\\:px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
                    .print\\:px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
                    .print\\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                    .print\\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
                }
            `}</style>
            {/* Header */}
            <header className="bg-white shadow no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin/timetables"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to All Timetables</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <User className="h-8 w-8" />
                                    <span>Teacher Timetables</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - View teacher-specific timetables
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {timetables.length > 0 && (
                                <button
                                    onClick={handleClearAllTimetables}
                                    disabled={isClearing}
                                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isClearing ? 'Clearing...' : 'Clear All'}
                                </button>
                            )}

                            <button
                                onClick={() => setViewMode(viewMode === 'regular' ? 'compact' : viewMode === 'compact' ? 'list' : 'regular')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {viewMode === 'regular' && <><FileText className="h-4 w-4 mr-2" />Compact A4</>}
                                {viewMode === 'compact' && <><Grid className="h-4 w-4 mr-2" />List View</>}
                                {viewMode === 'list' && <><FileText className="h-4 w-4 mr-2" />Regular</>}
                            </button>

                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </button>
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

            {/* Filters */}
            <div className="bg-white shadow-sm border-b no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search teachers, classes, subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                                />
                            </div>

                            {/* Filters Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </button>
                        </div>

                        <div className="text-sm text-gray-600">
                            {teacherTimetables.length} teachers found
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="all">All Days</option>
                                        {DAYS.map(day => (
                                            <option key={day} value={day}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                    <select
                                        value={selectedTeacher}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="all">All Teachers</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSelectedDay('all')
                                            setSelectedTeacher('all')
                                            setSearchTerm('')
                                        }}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {viewMode === 'list' ? (
                        // List View - Show all teachers with their timetables
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">All Teacher Timetables</h2>
                                <p className="text-sm text-gray-600">
                                    {teacherTimetables.length} teachers with generated timetables
                                </p>
                            </div>
                            <div className="p-6">
                                {teacherTimetables.length === 0 ? (
                                    <div className="text-center py-12">
                                        <User className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            No teacher timetables found
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No timetables have been generated yet. Go to Generate Timetables to create one.
                                        </p>
                                        <div className="mt-6">
                                            <Link
                                                href="/dashboard/school-admin/generate-timetables"
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Generate Timetables
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {teacherTimetables.map((teacherTimetable) => (
                                            <div
                                                key={teacherTimetable.id}
                                                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{teacherTimetable.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {teacherTimetable.entries.length} periods scheduled
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Teacher
                                                    </span>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <p className="text-xs text-gray-500">
                                                        Generated: {new Date(teacherTimetable.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <SinglePDFExportButton
                                                        entries={teacherTimetable.entries.map(t => ({
                                                            id: t.id,
                                                            day: t.timeSlot.day,
                                                            period: t.timeSlot.period,
                                                            startTime: t.timeSlot.startTime,
                                                            endTime: t.timeSlot.endTime,
                                                            class: t.class,
                                                            teacher: t.teacher,
                                                            subject: t.subject,
                                                            module: t.module
                                                        }))}
                                                        title={`${session.user.schoolName} - Teacher Timetable - ${teacherTimetable.name}`}
                                                        schoolName={session.user.schoolName || undefined}
                                                        onExportStart={() => console.log('PDF export started for teacher:', teacherTimetable.name)}
                                                        onExportComplete={() => console.log('PDF export completed for teacher:', teacherTimetable.name)}
                                                        onExportError={(error) => console.error('PDF export failed for teacher:', teacherTimetable.name, error)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Regular/Compact View - Show individual teacher timetables
                        <div className="space-y-8">
                            {teacherTimetables.length === 0 ? (
                                <div className="bg-white shadow rounded-lg p-12 text-center">
                                    <User className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No teacher timetables found
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        No timetables have been generated yet. Go to Generate Timetables to create one.
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            href="/dashboard/school-admin/generate-timetables"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Generate Timetables
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                teacherTimetables.map((teacherTimetable) => {
                                    const timetableGrid = getTimetableGrid(teacherTimetable.entries)

                                    return (
                                        <div key={teacherTimetable.id} className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
                                            <div className="px-6 py-4 border-b border-gray-200 print:px-4 print:py-2">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900 print:text-xl">{teacherTimetable.name}</h2>
                                                        <p className="text-sm text-gray-500 print:text-xs">
                                                            {teacherTimetable.entries.length} periods scheduled • Generated: {new Date(teacherTimetable.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2 no-print">
                                                        <SinglePDFExportButton
                                                            entries={teacherTimetable.entries.map(t => ({
                                                                id: t.id,
                                                                day: t.timeSlot.day,
                                                                period: t.timeSlot.period,
                                                                startTime: t.timeSlot.startTime,
                                                                endTime: t.timeSlot.endTime,
                                                                class: t.class,
                                                                teacher: t.teacher,
                                                                subject: t.subject,
                                                                module: t.module
                                                            }))}
                                                            title={`${session.user.schoolName} - Teacher Timetable - ${teacherTimetable.name}`}
                                                            schoolName={session.user.schoolName || undefined}
                                                            onExportStart={() => console.log('PDF export started for teacher:', teacherTimetable.name)}
                                                            onExportComplete={() => console.log('PDF export completed for teacher:', teacherTimetable.name)}
                                                            onExportError={(error) => console.error('PDF export failed for teacher:', teacherTimetable.name, error)}
                                                        />
                                                        <CSVGridExportButton
                                                            entries={teacherTimetable.entries.map(t => ({
                                                                id: t.id,
                                                                day: t.timeSlot.day,
                                                                period: t.timeSlot.period,
                                                                startTime: t.timeSlot.startTime,
                                                                endTime: t.timeSlot.endTime,
                                                                class: t.class,
                                                                teacher: t.teacher,
                                                                subject: t.subject,
                                                                module: t.module
                                                            }))}
                                                            title={`${session.user.schoolName} - Teacher Timetable - ${teacherTimetable.name}`}
                                                            onExportStart={() => console.log('CSV export started for teacher:', teacherTimetable.name)}
                                                            onExportComplete={() => console.log('CSV export completed for teacher:', teacherTimetable.name)}
                                                            onExportError={(error) => console.error('CSV export failed for teacher:', teacherTimetable.name, error)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 print:p-4">
                                                {viewMode === 'compact' ? (
                                                    <CompactA4Timetable
                                                        entries={teacherTimetable.entries.map(t => ({
                                                            id: t.id,
                                                            day: t.timeSlot.day,
                                                            period: t.timeSlot.period,
                                                            startTime: t.timeSlot.startTime,
                                                            endTime: t.timeSlot.endTime,
                                                            class: t.class,
                                                            teacher: t.teacher,
                                                            subject: t.subject,
                                                            module: t.module
                                                        }))}
                                                        title={`${teacherTimetable.name} Timetable`}
                                                        className="compact-a4-container"
                                                    />
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full border-collapse border border-gray-300 print:text-sm">
                                                            <thead>
                                                                <tr className="bg-gray-50">
                                                                    <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                                        Time / Period
                                                                    </th>
                                                                    {DAYS.map(day => (
                                                                        <th key={day} className="border border-gray-300 px-2 sm:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                                            <span className="hidden sm:inline">{DAY_LABELS[day as keyof typeof DAY_LABELS]}</span>
                                                                            <span className="sm:hidden">{DAY_LABELS[day as keyof typeof DAY_LABELS].slice(0, 3)}</span>
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {/* P1-P3 */}
                                                                {PERIOD_SCHEDULE.slice(0, 3).map(({ period, start, end }) => (
                                                                    <tr key={period}>
                                                                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                                            <div>
                                                                                <div className="font-bold">P{period}</div>
                                                                                <div className="text-xs text-gray-600 hidden sm:block">
                                                                                    {start} – {end}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        {DAYS.map(day => {
                                                                            const entry = timetableGrid[day]?.[period]
                                                                            const cellData = getCellContent(entry)

                                                                            return (
                                                                                <td
                                                                                    key={`${day}-${period}`}
                                                                                    className="border border-gray-200 px-1 sm:px-2 py-2 text-center align-top print:px-1 print:py-2 min-h-[60px]"
                                                                                >
                                                                                    {typeof cellData === 'string' ? (
                                                                                        <div className="text-xs leading-tight whitespace-pre-line text-gray-500 font-medium">
                                                                                            {cellData}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className={`rounded-lg border p-2 h-full flex flex-col justify-center items-center text-center transition-all duration-200 hover:shadow-sm ${getSubjectColor(cellData.isSubject, cellData.category)}`}>
                                                                                            <div className="font-semibold text-xs leading-tight mb-1">
                                                                                                {cellData.subjectName}
                                                                                            </div>
                                                                                            <div className="text-xs opacity-80 font-medium">
                                                                                                {cellData.className}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                ))}

                                                                {/* Morning Break */}
                                                                <tr className="bg-amber-50">
                                                                    <td
                                                                        colSpan={6}
                                                                        className="border border-gray-300 px-2 sm:px-4 py-4 sm:py-6 text-center font-bold text-amber-800 print:px-2 print:py-4"
                                                                    >
                                                                        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                                                                            <span className="text-base sm:text-lg">🌅</span>
                                                                            <div>
                                                                                <div className="text-lg sm:text-xl font-bold">MORNING BREAK</div>
                                                                            </div>
                                                                            <span className="text-base sm:text-lg">🌅</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* P4-P5 */}
                                                                {PERIOD_SCHEDULE.slice(3, 5).map(({ period, start, end }) => (
                                                                    <tr key={period}>
                                                                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                                            <div>
                                                                                <div className="font-bold">P{period}</div>
                                                                                <div className="text-xs text-gray-600 hidden sm:block">
                                                                                    {start} – {end}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        {DAYS.map(day => {
                                                                            const entry = timetableGrid[day]?.[period]
                                                                            const cellData = getCellContent(entry)

                                                                            return (
                                                                                <td
                                                                                    key={`${day}-${period}`}
                                                                                    className="border border-gray-200 px-1 sm:px-2 py-2 text-center align-top print:px-1 print:py-2 min-h-[60px]"
                                                                                >
                                                                                    {typeof cellData === 'string' ? (
                                                                                        <div className="text-xs leading-tight whitespace-pre-line text-gray-500 font-medium">
                                                                                            {cellData}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className={`rounded-lg border p-2 h-full flex flex-col justify-center items-center text-center transition-all duration-200 hover:shadow-sm ${getSubjectColor(cellData.isSubject, cellData.category)}`}>
                                                                                            <div className="font-semibold text-xs leading-tight mb-1">
                                                                                                {cellData.subjectName}
                                                                                            </div>
                                                                                            <div className="text-xs opacity-80 font-medium">
                                                                                                {cellData.className}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                ))}

                                                                {/* Lunch Break */}
                                                                <tr className="bg-orange-50">
                                                                    <td
                                                                        colSpan={6}
                                                                        className="border border-gray-300 px-2 sm:px-4 py-4 sm:py-6 text-center font-bold text-orange-800 print:px-2 print:py-4"
                                                                    >
                                                                        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                                                                            <span className="text-base sm:text-lg">🍽️</span>
                                                                            <div>
                                                                                <div className="text-lg sm:text-xl font-bold">LUNCH BREAK</div>
                                                                            </div>
                                                                            <span className="text-base sm:text-lg">🍽️</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* P6-P8 */}
                                                                {PERIOD_SCHEDULE.slice(5, 8).map(({ period, start, end }) => (
                                                                    <tr key={period}>
                                                                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                                            <div>
                                                                                <div className="font-bold">P{period}</div>
                                                                                <div className="text-xs text-gray-600 hidden sm:block">
                                                                                    {start} – {end}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        {DAYS.map(day => {
                                                                            const entry = timetableGrid[day]?.[period]
                                                                            const cellData = getCellContent(entry)

                                                                            return (
                                                                                <td
                                                                                    key={`${day}-${period}`}
                                                                                    className="border border-gray-200 px-1 sm:px-2 py-2 text-center align-top print:px-1 print:py-2 min-h-[60px]"
                                                                                >
                                                                                    {typeof cellData === 'string' ? (
                                                                                        <div className="text-xs leading-tight whitespace-pre-line text-gray-500 font-medium">
                                                                                            {cellData}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className={`rounded-lg border p-2 h-full flex flex-col justify-center items-center text-center transition-all duration-200 hover:shadow-sm ${getSubjectColor(cellData.isSubject, cellData.category)}`}>
                                                                                            <div className="font-semibold text-xs leading-tight mb-1">
                                                                                                {cellData.subjectName}
                                                                                            </div>
                                                                                            <div className="text-xs opacity-80 font-medium">
                                                                                                {cellData.className}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                ))}

                                                                {/* Afternoon Break */}
                                                                <tr className="bg-purple-50">
                                                                    <td
                                                                        colSpan={6}
                                                                        className="border border-gray-300 px-2 sm:px-4 py-4 sm:py-6 text-center font-bold text-purple-800 print:px-2 print:py-4"
                                                                    >
                                                                        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                                                                            <span className="text-base sm:text-lg">☕</span>
                                                                            <div>
                                                                                <div className="text-lg sm:text-xl font-bold">AFTERNOON BREAK</div>
                                                                            </div>
                                                                            <span className="text-base sm:text-lg">☕</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* P9-P10 */}
                                                                {PERIOD_SCHEDULE.slice(8, 10).map(({ period, start, end }) => (
                                                                    <tr key={period}>
                                                                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                                            <div>
                                                                                <div className="font-bold">P{period}</div>
                                                                                <div className="text-xs text-gray-600 hidden sm:block">
                                                                                    {start} – {end}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        {DAYS.map(day => {
                                                                            const entry = timetableGrid[day]?.[period]
                                                                            return (
                                                                                <td
                                                                                    key={`${day}-${period}`}
                                                                                    className="border border-gray-300 px-1 sm:px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                                                >
                                                                                    <div className="text-xs leading-tight whitespace-pre-line">
                                                                                        {getCellContent(entry)}
                                                                                    </div>
                                                                                </td>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}