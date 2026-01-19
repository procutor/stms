'use client'

import { useSession, signOut } from 'next-auth/react'
import { Suspense } from 'react'

import { useRouter } from 'next/navigation'
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

function TeacherTimetablesContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [timetables, setTimetables] = useState<TimetableEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<string>('all')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'regular' | 'compact' | 'list'>('regular')
    const [isClearing, setIsClearing] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchTimetables()
            fetchClassesAndTeachers()
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

    const fetchClassesAndTeachers = async () => {
        try {
            const [classesRes, teachersRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/teachers')
            ])
            
            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setClasses(classesData)
            }
            
            if (teachersRes.ok) {
                const teachersData = await teachersRes.json()
                setTeachers(teachersData)
            }
        } catch (error) {
            console.error('Error fetching classes and teachers:', error)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

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

    const uniqueTeachers: Array<{ id: string, name: string }> = Array.from(new Set(timetables.map(t => t.teacherId))).map(teacherId => {
        const teacher = timetables.find(t => t.teacherId === teacherId)?.teacher
        return teacher ? { id: teacherId, name: teacher.name } : null
    }).filter(Boolean) as Array<{ id: string, name: string }>

    // Group timetables by teacher for list view
    const teacherTimetables = Array.from(new Set(timetables.map(t => t.teacherId))).map(teacherId => {
        const teacherTimetable = timetables.filter(t => t.teacherId === teacherId)
        return {
            type: 'teacher',
            id: teacherId,
            name: teacherTimetable[0]?.teacher?.name || 'Unknown Teacher',
            entries: teacherTimetable,
            createdAt: teacherTimetable[0]?.createdAt || new Date().toISOString()
        }
    })

    const getTimetableGrid = () => {
        const grid: { [key: string]: { [key: number]: TimetableEntry | null } } = {}

        DAYS.forEach(day => {
            grid[day] = {}
            PERIOD_SCHEDULE.forEach(({ period }) => {
                grid[day][period] = null
            })
        })

        filteredTimetables.forEach(entry => {
            if (grid[entry.timeSlot.day] && entry.timeSlot.period) {
                grid[entry.timeSlot.day][entry.timeSlot.period] = entry
            }
        })

        return grid
    }

    const getCellContent = (entry: TimetableEntry | null) => {
        if (!entry) return 'FREE'

        const subjectName = entry.subject?.name || entry.module?.name || 'N/A'
        return `${subjectName}\n${entry.class.name}`
    }

    const getBreakLabel = (breakType?: string) => {
        switch (breakType) {
            case 'MORNING_BREAK': return 'MORNING BREAK'
            case 'LUNCH_BREAK': return 'LUNCH BREAK'
            case 'AFTERNOON_BREAK': return 'AFTERNOON BREAK'
            default: return 'BREAK'
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

    const timetableGrid = getTimetableGrid()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow no-print">
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
                                    {isClearing ? 'Clearing...' : 'Clear All Timetables'}
                                </button>
                            )}
                            
                            <button
                                onClick={() => setViewMode(viewMode === 'regular' ? 'compact' : viewMode === 'compact' ? 'list' : 'regular')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {viewMode === 'regular' && <><FileText className="h-4 w-4 mr-2" />Compact A4 View</>}
                                {viewMode === 'compact' && <><Grid className="h-4 w-4 mr-2" />List View</>}
                                {viewMode === 'list' && <><FileText className="h-4 w-4 mr-2" />Regular View</>}
                            </button>
                            
                            {timetables.length > 0 && (
                                <CSVGridExportButton
                                    entries={filteredTimetables.map(t => ({
                                        day: t.timeSlot.day,
                                        period: t.timeSlot.period,
                                        startTime: t.timeSlot.startTime,
                                        endTime: t.timeSlot.endTime,
                                        class: t.class,
                                        teacher: t.teacher,
                                        subject: t.subject,
                                        module: t.module
                                    }))}
                                    title={`${session.user.schoolName} - Teacher Timetables`}
                                    schoolName={session.user.schoolName || undefined}
                                    onExportStart={() => console.log('CSV export started')}
                                    onExportComplete={() => console.log('CSV export completed')}
                                    onExportError={(error) => console.error('CSV export failed:', error)}
                                />
                            )}
                            
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
                    {/* Page Header */}
                    <div className="bg-white shadow rounded-lg mb-6 print:shadow-none print:border print:border-gray-300">
                        <div className="px-4 py-5 sm:p-6 text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                                {session.user.schoolName}
                            </div>
                            <div className="text-lg text-gray-700 mb-2">
                                Teacher Timetables | Generated: {timetables.length > 0 ? new Date(timetables[0].createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'No timetables generated yet'}
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                Teacher Timetables Overview
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </button>
                            </div>
                        </div>
                        {showFilters && (
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search teachers, classes, subjects..."
                                                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                                        <select
                                            value={selectedDay}
                                            onChange={(e) => setSelectedDay(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="all">All Days</option>
                                            {DAYS.map(day => (
                                                <option key={day} value={day}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                    <select
                                        value={selectedTeacher}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="all">All Teachers</option>
                                        {uniqueTeachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>
                                    Showing {filteredTimetables.length} of {timetables.length} entries
                                    {selectedDay !== 'all' && ` • Day: ${DAY_LABELS[selectedDay as keyof typeof DAY_LABELS]}`}
                                    {selectedTeacher !== 'all' && ` • Teacher: ${teachers.find(t => t.id === selectedTeacher)?.name || selectedTeacher}`}
                                    {searchTerm && ` • Search: "${searchTerm}"`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timetable Grid */}
                    {viewMode === 'list' ? (
                        // List View - Show all generated timetables with PDF download buttons
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">All Generated Timetables</h2>
                                <p className="text-sm text-gray-600">
                                    {teacherTimetables.length} teacher timetables available for download
                                </p>
                            </div>
                            <div className="p-6">
                                {/* Teacher Timetables */}
                                {teacherTimetables.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Timetables</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {teacherTimetables.map((timetable: any) => (
                                                <div key={timetable.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-md font-medium text-gray-900">{timetable.name}</h4>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Teacher
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {timetable.entries.length} periods • Generated {new Date(timetable.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <SinglePDFExportButton
                                                        entries={timetable.entries.map((t: any) => ({
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
                                                        title={`${session.user.schoolName} - Teacher Timetable - ${timetable.name}`}
                                                        schoolName={session.user.schoolName || undefined}
                                                        onExportStart={() => console.log('PDF export started')}
                                                        onExportComplete={() => console.log('PDF export completed')}
                                                        onExportError={(error) => console.error('PDF export failed:', error)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'compact' ? (
                        // Compact A4 View
                        <div className="bg-white shadow rounded-lg p-6">
                            <CompactA4Timetable
                                entries={filteredTimetables.map(t => ({
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
                                title={`${session.user.schoolName} - Teacher Timetables`}
                            />
                        </div>
                    ) : (
                        // Regular Grid View
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Timetable Grid</h2>
                                <p className="text-sm text-gray-600">
                                    {filteredTimetables.length} entries • {selectedDay !== 'all' ? `Day: ${DAY_LABELS[selectedDay as keyof typeof DAY_LABELS]}` : 'All days'} • {selectedTeacher !== 'all' ? `Teacher: ${teachers.find(t => t.id === selectedTeacher)?.name || selectedTeacher}` : 'All teachers'}
                                </p>
                            </div>
                            <div className="p-6">
                                {/* Timetable Grid */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time
                                                </th>
                                                {DAYS.map(day => (
                                                    <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {PERIOD_SCHEDULE.map(({ period, start, end }) => (
                                                <tr key={period}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        P{period}<br />
                                                        <span className="text-xs text-gray-500">{start} - {end}</span>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = timetableGrid[day]?.[period]
                                                        return (
                                                            <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                <div className="max-w-xs truncate">
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
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default function TeacherTimetablesClient() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
            <TeacherTimetablesContent />
        </Suspense>
    )
}