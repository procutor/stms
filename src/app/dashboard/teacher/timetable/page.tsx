'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, User, Calendar, Download, Clock, Printer } from 'lucide-react'
import Link from 'next/link'
import SimpleWeeklyGrid, { TimetableEntry } from '@/components/timetable/SimpleWeeklyGrid'
import ExportMenu from '@/components/timetable/ExportMenu'
import { SinglePDFExportButton } from '@/components/pdf/PDFExportButton'
import '@/styles/compact-timetable.css'

export default function TeacherPersonalTimetable() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [conflicts, setConflicts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      if (session.user.role === 'TEACHER' || session.user.role === 'TRAINER') {
        fetchPersonalTimetable()
      } else {
        setIsLoading(false)
      }
    }
  }, [session])

  const fetchPersonalTimetable = async () => {
    try {
      const response = await fetch('/api/teacher/timetable')
      if (response.ok) {
        const data = await response.json()
        setTimetableEntries(data.timetables || [])
        
        // For now, we'll simulate conflict detection
        // In a real implementation, this would come from the API
        const detectedConflicts = detectConflicts(data.timetables || [])
        setConflicts(detectedConflicts)
      } else {
        console.error('Failed to fetch timetable:', response.statusText)
        setTimetableEntries([])
      }
    } catch (error) {
      console.error('Error fetching personal timetable:', error)
      setTimetableEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  const detectConflicts = (entries: TimetableEntry[]): string[] => {
    const conflicts: string[] = []
    const timeSlots = new Map<string, TimetableEntry[]>()

    // Group entries by time slot
    entries.forEach(entry => {
      const key = `${entry.day}-${entry.period}`
      if (!timeSlots.has(key)) {
        timeSlots.set(key, [])
      }
      timeSlots.get(key)!.push(entry)
    })

    // Check for conflicts (multiple lessons in same time slot - this is always a problem)
    timeSlots.forEach((entries, key) => {
      if (entries.length > 1) {
        const [day, period] = key.split('-')
        const classNames = entries.map(e => e.class?.name).filter((name): name is string => Boolean(name))
        const uniqueClasses = Array.from(new Set(classNames))
        conflicts.push(`You are double-booked for ${day} Period ${period} (Classes: ${uniqueClasses.join(', ')})`)
      }
    })

    // Check for consecutive periods for the same class (more than 2)
    const consecutivePeriods = checkConsecutivePeriods(entries)
    conflicts.push(...consecutivePeriods)

    return conflicts
  }

  const checkConsecutivePeriods = (entries: TimetableEntry[]): string[] => {
    const conflicts: string[] = []
    
    // Group entries by day
    const entriesByDay: { [day: string]: TimetableEntry[] } = {}
    entries.forEach(entry => {
      if (!entriesByDay[entry.day]) {
        entriesByDay[entry.day] = []
      }
      entriesByDay[entry.day].push(entry)
    })

    // Check each day separately
    Object.entries(entriesByDay).forEach(([day, dayEntries]) => {
      // Sort by period
      const sortedPeriods = dayEntries.sort((a, b) => a.period - b.period)
      
      let consecutiveCount = 1
      let currentClass = sortedPeriods[0]?.class?.name
      let currentDay = day

      for (let i = 1; i < sortedPeriods.length; i++) {
        const current = sortedPeriods[i]
        const previous = sortedPeriods[i - 1]

        // Check if periods are consecutive AND for the same class
        if (
          current.period === previous.period + 1 && 
          current.class?.name === previous.class?.name
        ) {
          consecutiveCount++
          currentClass = current.class?.name
          if (consecutiveCount > 2) {
            conflicts.push(`You have ${consecutiveCount} consecutive periods for ${currentClass} on ${currentDay}`)
          }
        } else if (current.period === previous.period + 1 && current.class?.name !== previous.class?.name) {
          // Consecutive periods but different classes - this is fine, reset counter
          consecutiveCount = 1
          currentClass = current.class?.name
        } else if (current.period > previous.period + 1) {
          // Gap in periods - reset counter
          consecutiveCount = 1
          currentClass = current.class?.name
        }
      }
    })

    return conflicts
  }


  const getWeeklyStats = () => {
    const totalLessons = timetableEntries.length
    const uniqueDays = new Set(timetableEntries.map(e => e.day)).size
    const maxPeriod = Math.max(...timetableEntries.map(e => e.period), 0)
    
    // Calculate average lessons per day
    const lessonsPerDay = totalLessons / uniqueDays || 0
    
    return {
      totalLessons,
      uniqueDays,
      maxPeriod,
      averageLessonsPerDay: Math.round(lessonsPerDay * 10) / 10
    }
  }

  const stats = getWeeklyStats()

  // Constants matching school admin format
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

  const getTimetableGrid = () => {
    const grid: { [key: string]: { [key: number]: TimetableEntry | null } } = {}

    DAYS.forEach(day => {
      grid[day] = {}
      PERIOD_SCHEDULE.forEach(({ period }) => {
        grid[day][period] = null
      })
    })

    timetableEntries.forEach(entry => {
      if (grid[entry.day] && entry.period) {
        grid[entry.day][entry.period] = entry
      }
    })

    return grid
  }

  const getCellContent = (entry: TimetableEntry | null) => {
    if (!entry) return 'FREE'

    const subjectName = entry.subject?.name || entry.module?.name || 'N/A'
    return `${subjectName}\n${entry.class?.name || 'N/A'}`
  }

  const handlePrint = () => {
    window.print()
  }

  const timetableGrid = getTimetableGrid()

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'TRAINER')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Access denied. Teacher/Trainer role required.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          .print\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        }
      `}</style>
      {/* Header */}
      <header className="bg-gray-800 shadow no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/teacher"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                  <User className="h-8 w-8 text-white" />
                  <span>My Timetable</span>
                </h1>
                <p className="text-sm text-gray-300">
                  {session.user.name} - Your weekly schedule
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {timetableEntries.length > 0 && (
                <SinglePDFExportButton
                  entries={timetableEntries}
                  title={`My Timetable - ${session.user.name}`}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Timetable Statistics */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Timetable Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center cursor-pointer hover:bg-white/20 transition-colors duration-200">
                <div className="text-2xl font-bold text-white">{stats.totalLessons}</div>
                <div className="text-sm text-blue-100">Total Lessons</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center cursor-pointer hover:bg-white/20 transition-colors duration-200">
                <div className="text-2xl font-bold text-white">{stats.uniqueDays}</div>
                <div className="text-sm text-blue-100">Teaching Days</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center cursor-pointer hover:bg-white/20 transition-colors duration-200">
                <div className="text-2xl font-bold text-white">{stats.maxPeriod}</div>
                <div className="text-sm text-blue-100">Latest Period</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center cursor-pointer hover:bg-white/20 transition-colors duration-200">
                <div className="text-2xl font-bold text-white">{stats.averageLessonsPerDay}</div>
                <div className="text-sm text-blue-100">Avg Lessons/Day</div>
              </div>
            </div>
          </div>

          {/* Conflict Alerts */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Schedule Conflicts Detected
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {conflicts.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        href="/dashboard/teacher"
                        className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                      >
                        Contact Admin
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="bg-white shadow rounded-lg mb-6 print:shadow-none print:border print:border-gray-300">
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {session.user.schoolName || 'School Name'}
              </div>
              <div className="text-lg text-gray-700 mb-2">
                Academic Year 2025-2026 | Generated: {timetableEntries.length > 0 ? new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No timetable generated yet'}
              </div>
              <div className="text-xl font-bold text-gray-900">
                Teacher Timetable - {session.user.name}
              </div>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
            <div className="p-4 sm:p-6">
              {timetableEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No timetable found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your timetable has not been generated yet. Please contact your school administrator.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/teacher"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
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


          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Your Personal Timetable
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This is your complete weekly timetable showing all your teaching periods from P1 to P10. 
                    You can export it as a PDF for offline reference or print it for your records.
                    If you notice any conflicts or need schedule adjustments, please contact your school administrator.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/dashboard/teacher"
                    className="text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                  >
                    Back to Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}