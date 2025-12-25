'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, LogOut, ArrowLeft, Download, Eye, Printer, FileText, Trash2, Grid, List, BookOpen, File, Clock, X, User } from 'lucide-react'
import Link from 'next/link'
import CompactA4Timetable from '@/components/timetable/CompactA4Timetable'
import { SinglePDFExportButton } from '@/components/pdf/PDFExportButton'
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

export default function ViewTimetables() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [timetables, setTimetables] = useState<TimetableEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<string>('all')
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'regular' | 'compact' | 'list'>('regular')
    const [isClearing, setIsClearing] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [pdfHistory, setPdfHistory] = useState<any[]>([])

    // Get filter params from URL
    const teacherId = searchParams.get('teacherId')
    const classId = searchParams.get('classId')

    useEffect(() => {
        if (session?.user) {
            fetchTimetables()
            fetchClassesAndTeachers()
            loadPdfHistory()
        }
    }, [session, teacherId, classId])

    const loadPdfHistory = () => {
        const history = JSON.parse(localStorage.getItem('timetablePdfHistory') || '[]')
        setPdfHistory(history)
    }

    const deletePdfHistoryItem = (id: string) => {
        const history = pdfHistory.filter((item: any) => item.id !== id)
        setPdfHistory(history)
        localStorage.setItem('timetablePdfHistory', JSON.stringify(history))
    }

    const fetchTimetables = async () => {
        try {
            const params = new URLSearchParams()
            if (teacherId) params.append('teacherId', teacherId)
            if (classId) params.append('classId', classId)

            const response = await fetch(`/api/timetables?${params}`)
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
        const matchesClass = selectedClass === 'all' || timetable.classId === selectedClass
        const matchesTeacher = selectedTeacher === 'all' || timetable.teacherId === selectedTeacher
        return matchesDay && matchesClass && matchesTeacher
    })

    const uniqueClasses = Array.from(new Set(timetables.map(t => t.classId))).map(classId =>
        timetables.find(t => t.classId === classId)?.class
    ).filter(Boolean)

    const uniqueTeachers = Array.from(new Set(timetables.map(t => t.teacherId))).map(teacherId =>
        timetables.find(t => t.teacherId === teacherId)?.teacher
    ).filter(Boolean)

    // Group timetables by class for list view
    const classTimetables = Array.from(new Set(timetables.map(t => t.classId))).map(classId => {
        const classTimetable = timetables.filter(t => t.classId === classId)
        return {
            type: 'class',
            id: classId,
            name: classTimetable[0]?.class?.name || 'Unknown Class',
            level: classTimetable[0]?.class?.level || '',
            entries: classTimetable,
            createdAt: classTimetable[0]?.createdAt || new Date().toISOString()
        }
    })

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

        if (classId) {
            // Class timetable: show subject/module + teacher
            return `${subjectName}\n${entry.teacher.name}`
        } else if (teacherId) {
            // Teacher timetable: show subject/module + class
            return `${subjectName}\n${entry.class.name}`
        } else {
            // General view: show subject/module + teacher + class
            return `${subjectName}\n${entry.teacher.name}\n${entry.class.name}`
        }
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

    const timetableGrid = getTimetableGrid()

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
                                href="/dashboard/school-admin"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Dashboard</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Calendar className="h-8 w-8" />
                                    <span>Timetables</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - View generated timetables
                                    {teacherId && ` for ${timetables[0]?.teacher?.name || 'Teacher'}`}
                                    {classId && ` for ${timetables[0]?.class?.name || 'Class'}`}
                                </p>
                                <div className="mt-2 flex space-x-4">
                                    <Link
                                        href="/dashboard/school-admin/timetables/class"
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Class Timetables
                                    </Link>
                                    <Link
                                        href="/dashboard/school-admin/timetables/teacher"
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Teacher Timetables
                                    </Link>
                                </div>
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
                                <SinglePDFExportButton
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
                                    title={`${session.user.schoolName} - ${classId ? `Class Timetable - ${timetables[0]?.class?.name || 'Class'}` :
                                                          teacherId ? `Teacher Timetable - ${timetables[0]?.teacher?.name || 'Teacher'}` :
                                                          'School Timetable'}`}
                                    schoolName={session.user.schoolName || undefined}
                                    onExportStart={() => console.log('PDF export started')}
                                    onExportComplete={() => console.log('PDF export completed')}
                                    onExportError={(error) => console.error('PDF export failed:', error)}
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
                                Academic Year 2025-2026 | Generated: {timetables.length > 0 ? new Date(timetables[0].createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'No timetables generated yet'}
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {classId ? `Class Timetable - ${timetables[0]?.class?.name || 'Class'}` :
                                 teacherId ? `Teacher Timetable - ${timetables[0]?.teacher?.name || 'Teacher'}` :
                                 'School Timetable'}
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
                                    {classTimetables.length + teacherTimetables.length} timetables available for download
                                </p>
                            </div>
                            <div className="p-6">
                                {/* PDF Files History Section */}
                                {pdfHistory.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <File className="h-5 w-5 mr-2" />
                                            PDF Files History ({pdfHistory.length})
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            File Name
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Classes
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Periods
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Generated
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {pdfHistory.map((pdf: any) => (
                                                        <tr key={pdf.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <File className="h-4 w-4 text-red-500 mr-2" />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {pdf.fileName}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {pdf.classCount} classes
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {pdf.totalPeriods} periods
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                <div className="flex items-center">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {new Date(pdf.generatedAt).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => deletePdfHistoryItem(pdf.id)}
                                                                    className="text-red-600 hover:text-red-900 inline-flex items-center"
                                                                    title="Remove from history"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Note: Click the Generate Timetables page with "Save as History" enabled to generate new PDF files.
                                        </p>
                                    </div>
                                )}
                                {timetables.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            No timetables found
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
                                    <div className="space-y-6">
                                        {/* Class Timetables Section */}
                                        {classTimetables.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <BookOpen className="h-5 w-5 mr-2" />
                                                    Class Timetables ({classTimetables.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {classTimetables.map((timetable) => (
                                                        <div 
                                                            key={timetable.id}
                                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900">{timetable.name}</h4>
                                                                    {timetable.level && (
                                                                        <p className="text-sm text-gray-600">Level: {timetable.level}</p>
                                                                    )}
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {timetable.entries.length} periods scheduled
                                                                    </p>
                                                                </div>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Class
                                                                </span>
                                                            </div>
                                                            <div className="mt-4 flex items-center justify-between">
                                                                <p className="text-xs text-gray-500">
                                                                    Generated: {new Date(timetable.createdAt).toLocaleDateString()}
                                                                </p>
                                                                <SinglePDFExportButton
                                                                    entries={timetable.entries.map(t => ({
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
                                                                    title={`${session.user.schoolName} - Class Timetable - ${timetable.name}`}
                                                                    schoolName={session.user.schoolName || undefined}
                                                                    onExportStart={() => console.log('PDF export started for class:', timetable.name)}
                                                                    onExportComplete={() => console.log('PDF export completed for class:', timetable.name)}
                                                                    onExportError={(error) => console.error('PDF export failed for class:', timetable.name, error)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Teacher Timetables Section */}
                                        {teacherTimetables.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <Calendar className="h-5 w-5 mr-2" />
                                                    Teacher Timetables ({teacherTimetables.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {teacherTimetables.map((timetable) => (
                                                        <div 
                                                            key={timetable.id}
                                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900">{timetable.name}</h4>
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {timetable.entries.length} periods scheduled
                                                                    </p>
                                                                </div>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Teacher
                                                                </span>
                                                            </div>
                                                            <div className="mt-4 flex items-center justify-between">
                                                                <p className="text-xs text-gray-500">
                                                                    Generated: {new Date(timetable.createdAt).toLocaleDateString()}
                                                                </p>
                                                                <SinglePDFExportButton
                                                                    entries={timetable.entries.map(t => ({
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
                                                                    onExportStart={() => console.log('PDF export started for teacher:', timetable.name)}
                                                                    onExportComplete={() => console.log('PDF export completed for teacher:', timetable.name)}
                                                                    onExportError={(error) => console.error('PDF export failed for teacher:', timetable.name, error)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Download All */}
                                        {timetables.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900">Download All Timetables</h4>
                                                        <p className="text-sm text-gray-600">
                                                            Download individual PDFs or use the button below to download all
                                                        </p>
                                                    </div>
                                                    <SinglePDFExportButton
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
                                                        title={`${session.user.schoolName} - Complete Timetable`}
                                                        schoolName={session.user.schoolName || undefined}
                                                        onExportStart={() => console.log('PDF export started for complete timetable')}
                                                        onExportComplete={() => console.log('PDF export completed for complete timetable')}
                                                        onExportError={(error) => console.error('PDF export failed for complete timetable', error)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'compact' ? (
                        <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
                            <div className="p-4 sm:p-6">
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
                                    title={`${session.user.schoolName} - ${classId ? `Class Timetable - ${timetables[0]?.class?.name || 'Class'}` :
                                                          teacherId ? `Teacher Timetable - ${timetables[0]?.teacher?.name || 'Teacher'}` :
                                                          'School Timetable'}`}
                                    className="compact-a4-container"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
                            <div className="p-4 sm:p-6">
                            {timetables.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No timetables found
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
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300 print:text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                    Time / Period
                                                </th>
                                                {DAYS.map(day => (
                                                    <th key={day} className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                        {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* P1-P3 */}
                                            {PERIOD_SCHEDULE.slice(0, 3).map(({ period, start, end }) => (
                                                <tr key={period}>
                                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                        <div>
                                                            <div className="font-bold">P{period}</div>
                                                            <div className="text-xs text-gray-600">
                                                                {start} – {end}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = timetableGrid[day]?.[period]
                                                        return (
                                                            <td
                                                                key={`${day}-${period}`}
                                                                className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                            >
                                                                <div className="text-xs leading-tight whitespace-pre-line">
                                                                    {getCellContent(entry)}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                            
                                            {/* Morning Break - Merged Row */}
                                            <tr className="bg-amber-50">
                                                <td 
                                                    colSpan={6} 
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-amber-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">🌅</span>
                                                        <div>
                                                            <div className="text-xl font-bold">MORNING BREAK</div>
                                                        </div>
                                                        <span className="text-lg">🌅</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* P4-P5 */}
                                            {PERIOD_SCHEDULE.slice(3, 5).map(({ period, start, end }) => (
                                                <tr key={period}>
                                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                        <div>
                                                            <div className="font-bold">P{period}</div>
                                                            <div className="text-xs text-gray-600">
                                                                {start} – {end}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = timetableGrid[day]?.[period]
                                                        return (
                                                            <td
                                                                key={`${day}-${period}`}
                                                                className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                            >
                                                                <div className="text-xs leading-tight whitespace-pre-line">
                                                                    {getCellContent(entry)}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                            
                                            {/* Lunch Break - Merged Row */}
                                            <tr className="bg-orange-50">
                                                <td 
                                                    colSpan={6} 
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-orange-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">🍽️</span>
                                                        <div>
                                                            <div className="text-xl font-bold">LUNCH BREAK</div>
                                                        </div>
                                                        <span className="text-lg">🍽️</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* P6-P8 */}
                                            {PERIOD_SCHEDULE.slice(5, 8).map(({ period, start, end }) => (
                                                <tr key={period}>
                                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                        <div>
                                                            <div className="font-bold">P{period}</div>
                                                            <div className="text-xs text-gray-600">
                                                                {start} – {end}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = timetableGrid[day]?.[period]
                                                        return (
                                                            <td
                                                                key={`${day}-${period}`}
                                                                className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                            >
                                                                <div className="text-xs leading-tight whitespace-pre-line">
                                                                    {getCellContent(entry)}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                            
                                            {/* Afternoon Break - Merged Row */}
                                            <tr className="bg-purple-50">
                                                <td 
                                                    colSpan={6} 
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-purple-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">☕</span>
                                                        <div>
                                                            <div className="text-xl font-bold">AFTERNOON BREAK</div>
                                                        </div>
                                                        <span className="text-lg">☕</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* P9-P10 */}
                                            {PERIOD_SCHEDULE.slice(8, 10).map(({ period, start, end }) => (
                                                <tr key={period}>
                                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium print:px-2 print:py-2">
                                                        <div>
                                                            <div className="font-bold">P{period}</div>
                                                            <div className="text-xs text-gray-600">
                                                                {start} – {end}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = timetableGrid[day]?.[period]
                                                        return (
                                                            <td
                                                                key={`${day}-${period}`}
                                                                className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
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
                    )}
                </div>
            </main>
        </div>
    )
}