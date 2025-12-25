'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, BookOpen, Wrench, Printer, AlertCircle } from 'lucide-react'
import { SinglePDFExportButton } from '@/components/pdf/PDFExportButton'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface TimetableEntry {
    id: string
    schoolId: string
    classId: string
    teacherId: string
    subjectId?: string
    moduleId?: string
    timeSlotId: string
    class: {
        id: string
        name: string
        level?: string
        stream?: string
    }
    teacher: {
        id: string
        name: string
    }
    subject?: {
        id: string
        name: string
        code?: string
    }
    module?: {
        id: string
        name: string
        code?: string
        trade?: string
        category: string
    }
    timeSlot: {
        id: string
        day: string
        period: number
        name: string
        startTime: string
        endTime: string
        session: string
        isBreak: boolean
    }
}

interface Class {
    id: string
    name: string
    level?: string
    stream?: string
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function DailyTimetablesPage() {
    const { data: session } = useSession()
    const [timetables, setTimetables] = useState<TimetableEntry[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [selectedDay, setSelectedDay] = useState('MONDAY')
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [session])

    const fetchData = async () => {
        if (!session?.user?.schoolId) return

        try {
            setLoading(true)
            const [timetablesRes, classesRes] = await Promise.all([
                fetch('/api/timetables'),
                fetch('/api/classes')
            ])

            if (timetablesRes.ok && classesRes.ok) {
                const timetablesData = await timetablesRes.json()
                const classesData = await classesRes.json()
                setTimetables(timetablesData)
                setClasses(classesData)
                if (classesData.length > 0) {
                    setSelectedClass(classesData[0].id)
                }
            } else {
                setError('Failed to fetch data')
            }
        } catch (err) {
            setError('Error fetching data')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timeString: string | Date) => {
        if (!timeString) return '00:00'

        let date: Date

        // If it's already a Date object
        if (timeString instanceof Date) {
            date = timeString
        } else {
            // If it's a string, try to parse it
            // Handle ISO strings like "1970-01-01T08:00:00.000Z"
            if (typeof timeString === 'string' && timeString.includes('T')) {
                // Extract time part from ISO string
                const timePart = timeString.split('T')[1]?.split('.')[0] || timeString
                const [hours, minutes] = timePart.split(':')
                if (hours && minutes) {
                    return `${hours}h${minutes}`
                }
            }

            // Try to parse as regular time string like "08:00"
            if (typeof timeString === 'string' && timeString.includes(':')) {
                const [hours, minutes] = timeString.split(':')
                if (hours && minutes) {
                    return `${hours}h${minutes}`
                }
            }

            // Try to parse as Date
            try {
                date = new Date(timeString)
                if (!isNaN(date.getTime())) {
                    const hours = date.getHours().toString().padStart(2, '0')
                    const minutes = date.getMinutes().toString().padStart(2, '0')
                    return `${hours}h${minutes}`
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }

        return '00:00'
    }

    const getLessonStatus = (startTime: string, endTime: string) => {
        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()

        // Parse start time
        const [startHour, startMin] = startTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin

        // Parse end time
        const [endHour, endMin] = endTime.split(':').map(Number)
        const endMinutes = endHour * 60 + endMin

        if (currentTime >= endMinutes) {
            return { status: 'end', color: 'bg-red-100 text-red-800', label: 'Ended' }
        } else if (currentTime >= startMinutes) {
            return { status: 'progress', color: 'bg-green-100 text-green-800', label: 'In Progress' }
        } else {
            return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' }
        }
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

    const getTimetableGrid = () => {
        const grid: { [key: number]: TimetableEntry | null } = {}

        PERIOD_SCHEDULE.forEach(({ period }) => {
            grid[period] = null
        })

        const filteredEntries = timetables.filter(entry =>
            entry.classId === selectedClass &&
            entry.timeSlot.day === selectedDay
        )

        filteredEntries.forEach(entry => {
            if (entry.timeSlot.period) {
                grid[entry.timeSlot.period] = entry
            }
        })

        return grid
    }

    const getCellContent = (entry: TimetableEntry | null) => {
        if (!entry) return 'FREE'

        const subjectName = entry.subject?.name || entry.module?.name || 'N/A'
        const teacherName = entry.teacher?.name || 'N/A'
        return `${subjectName}\n${teacherName}`
    }

    const getFilteredTimetables = () => {
        return timetables.filter(entry =>
            entry.classId === selectedClass &&
            entry.timeSlot.day === selectedDay &&
            !entry.timeSlot.isBreak
        ).sort((a, b) => a.timeSlot.period - b.timeSlot.period)
    }

    const handlePrint = () => {
        window.print()
    }

    const timetableGrid = getTimetableGrid()
    const filteredTimetables = getFilteredTimetables()
    const selectedClassData = classes.find(c => c.id === selectedClass)

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-red-600 text-center">
                            <p className="text-lg font-semibold">Error</p>
                            <p>{error}</p>
                        </div>
                    </div>
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
                <style jsx global>{`
                @media print {
                  .no-print { display: none !important; }
                  body { background: white !important; }
                  .print\:shadow-none { box-shadow: none !important; }
                  .print\:border { border: 1px solid #d1d5db !important; }
                  .print\:text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                  .print\:px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
                  .print\:px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
                  .print\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                  .print\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.25rem !important; }
                }
              `}</style>

            {/* Header */}
            <header className="bg-gray-800 shadow no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                                <Calendar className="h-8 w-8 text-white" />
                                <span>Daily Timetables</span>
                            </h1>
                            <p className="text-sm text-gray-300">
                                Monitor daily schedules for classes and trades
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg mb-6 no-print">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Day
                                    </label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {DAYS.map(day => (
                                            <option key={day} value={day}>
                                                {day.charAt(0) + day.slice(1).toLowerCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Class/Trade
                                    </label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timetable Grid */}
                    <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
                        <div className="p-4 sm:p-6">
                            {filteredTimetables.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No timetable found
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        No classes scheduled for {selectedClassData?.name} on {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300 print:text-sm" style={{ fontSize: '14px' }}>
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                    Time / Period
                                                </th>
                                                <th className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                                                    Subject & Teacher
                                                </th>
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
                                                    <td
                                                        className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                    >
                                                        <div className="text-xs leading-tight whitespace-pre-line">
                                                            {getCellContent(timetableGrid[period])}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Morning Break - Merged Row */}
                                            <tr className="bg-amber-50">
                                                <td
                                                    colSpan={2}
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-amber-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">🌅</span>
                                                        <div>
                                                            <div className="text-xl font-bold">MORNING BREAK</div>
                                                            <div className="text-sm">10:00 – 10:20</div>
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
                                                    <td
                                                        className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                    >
                                                        <div className="text-xs leading-tight whitespace-pre-line">
                                                            {getCellContent(timetableGrid[period])}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Lunch Break - Merged Row */}
                                            <tr className="bg-orange-50">
                                                <td
                                                    colSpan={2}
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-orange-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">🍽️</span>
                                                        <div>
                                                            <div className="text-xl font-bold">LUNCH BREAK</div>
                                                            <div className="text-sm">11:40 – 13:10</div>
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
                                                    <td
                                                        className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                    >
                                                        <div className="text-xs leading-tight whitespace-pre-line">
                                                            {getCellContent(timetableGrid[period])}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Afternoon Break - Merged Row */}
                                            <tr className="bg-purple-50">
                                                <td
                                                    colSpan={2}
                                                    className="border border-gray-300 px-4 py-6 text-center font-bold text-purple-800 print:px-2 print:py-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <span className="text-lg">☕</span>
                                                        <div>
                                                            <div className="text-xl font-bold">AFTERNOON BREAK</div>
                                                            <div className="text-sm">15:10 – 15:30</div>
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
                                                    <td
                                                        className="border border-gray-300 px-2 py-3 text-center align-top print:px-1 print:py-2"
                                                    >
                                                        <div className="text-xs leading-tight whitespace-pre-line">
                                                            {getCellContent(timetableGrid[period])}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Calendar className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Daily Timetable View
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        This view shows the daily schedule for the selected class/trade in a card format.
                                        Each card displays the subject/module, class details, period information, and current status.
                                        You can export it as a PDF for offline reference or print it for records.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            </div>
        </div>
    )
}