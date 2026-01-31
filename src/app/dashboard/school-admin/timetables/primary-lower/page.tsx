'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Calendar, ArrowLeft, Play, Eye, Download, 
  AlertTriangle, CheckCircle, XCircle, BookOpen, Clock, FileText, Users
} from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'
import PDFExportButton from '@/components/pdf/PDFExportButton'
import { TimetableEntry } from '@/lib/pdf-export'

interface TimetableSlot {
  day: string
  period: number
  startTime: string
  endTime: string
  subject: string
  subjectId: string
  teacher: string
  teacherId: string
  session: string
  shift?: 'MORNING' | 'AFTERNOON'
}

interface TimetableData {
  classId: string
  className: string
  classLevel: string
  stream: string
  shift?: 'MORNING' | 'AFTERNOON' | 'BOTH'
  slots: TimetableSlot[]
}

interface GenerationResult {
  success: boolean
  message: string
  conflicts: any[]
  conflictCount: number
  classesGenerated?: number
  totalSlots?: number
  timetables?: TimetableData[]
  isDoubleShift?: boolean
  error?: string
}

interface ExistingClass {
  id: string
  name: string
  level: string
  stream: string
}

export default function PrimaryLowerTimetables() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [existingClasses, setExistingClasses] = useState<ExistingClass[]>([])
  const [action, setAction] = useState<'preview' | 'generate'>('generate')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [previewData, setPreviewData] = useState<TimetableData[]>([])
  const [autoExportPDF, setAutoExportPDF] = useState(false)
  const [isDoubleShift, setIsDoubleShift] = useState(false)
  
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  // Primary Lower shows all 10 periods in morning shift (8:00-11:40)
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  // Fetch existing P1-P3 classes on load
  useEffect(() => {
    const fetchClasses = async () => {
      if (!session?.user?.schoolId) return
      
      try {
        const response = await fetch('/api/classes')
        if (response.ok) {
          const data = await response.json()
          const classes = data.classes || data
          
          // Filter only P1, P2, P3 classes
          const primaryClasses = classes.filter((cls: ExistingClass) => 
            ['P1', 'P2', 'P3'].includes(cls.level)
          )
          
          setExistingClasses(primaryClasses)
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setIsLoadingClasses(false)
      }
    }
    
    if (session?.user?.schoolId) {
      fetchClasses()
    }
  }, [session])

  // Auto-export PDF after successful generation
  useEffect(() => {
    if (autoExportPDF && previewData.length > 0 && result?.success) {
      console.log('Auto-export triggered: previewData entries =', previewData.length)
      
      // Small delay to allow UI to update
      const timer = setTimeout(async () => {
        try {
          const classTimetables = convertToPDFEntriesByClass()
          console.log('Converting to PDF entries:', classTimetables.length, 'classes')
          
          if (classTimetables.length > 0) {
            const { exportBatchTimetablesToPDF } = await import('@/lib/pdf-export')
            
            const schoolName = session?.user?.schoolName || ''
            
            await exportBatchTimetablesToPDF(classTimetables, {
              includeLegend: true,
              fileName: `primary_lower_timetables_${new Date().toISOString().split('T')[0]}.pdf`,
              title: 'Primary Lower Timetable',
              schoolName: schoolName,
              shift: 'MORNING' as const,
              shiftLabel: isDoubleShift ? 'Morning Shift Only (8:00-11:40)' : undefined
            })
            
            console.log('PDF export completed')
          } else {
            console.warn('No entries to export')
          }
        } catch (error) {
          console.error('PDF export error:', error)
        } finally {
          // Reset auto-export flag after export completes (or fails)
          setAutoExportPDF(false)
        }
      }, 1500)
      
      return () => {
        clearTimeout(timer)
        // Also reset flag on cleanup to prevent stuck state
        setAutoExportPDF(false)
      }
    }
  }, [autoExportPDF, previewData, result, session])

  // Period time labels - All periods in morning shift (8:00-11:40)
  const getPeriodTime = (period: number) => {
    const times: Record<number, string> = {
      1: '08:00-08:40',
      2: '08:40-09:20',
      3: '09:20-10:00',
      4: '10:20-11:00',
      5: '11:00-11:40',
      6: '08:00-08:40',
      7: '08:40-09:20',
      8: '09:20-10:00',
      9: '10:20-11:00',
      10: '11:00-11:40'
    }
    return times[period] || ''
  }

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(c => c !== classId)
        : [...prev, classId]
    )
  }

  const handleSelectAll = () => {
    if (selectedClasses.length === existingClasses.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(existingClasses.map(c => c.id))
    }
  }

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) {
      setResult({
        success: false,
        message: '',
        conflicts: [],
        conflictCount: 0,
        error: 'Please select at least one class'
      })
      return
    }

    setIsLoading(true)
    setResult(null)
    setPreviewData([])

    try {
      // Get selected class details
      const selectedClassDetails = existingClasses.filter(c => selectedClasses.includes(c.id))
      const classLevels = Array.from(new Set(selectedClassDetails.map(c => c.level)))
      const classStreams = Array.from(new Set(selectedClassDetails.map(c => c.stream)))

      const response = await fetch('/api/generate/primary-lower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevels,
          classStreams,
          action
        })
      })

      const data: GenerationResult = await response.json()

      if (response.ok) {
        setResult(data)
        setIsDoubleShift(data.isDoubleShift || false)
        if (data.timetables) {
          setPreviewData(data.timetables)
          // Auto-export PDF after successful generation
          setAutoExportPDF(true)
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Generation failed',
          conflicts: [],
          conflictCount: 0,
          error: data.error || 'An error occurred'
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      setResult({
        success: false,
        message: '',
        conflicts: [],
        conflictCount: 0,
        error: 'An error occurred during generation'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const printableContent = generatePrintableHTML(previewData)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printableContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generatePrintableHTML = (timetables: TimetableData[]) => {
    // Group timetables by class (all periods in morning shift)
    const classGroups = new Map<string, TimetableData>()
    
    for (const t of timetables) {
      const key = t.className + (t.stream ? ` (${t.stream})` : '')
      // Use morning shift or the first timetable
      if (!classGroups.has(key)) {
        classGroups.set(key, t.shift === 'MORNING' ? t : t)
      }
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Primary Lower Timetables</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .timetable { margin-bottom: 40px; page-break-after: always; }
          .timetable h2 { text-align: center; margin-bottom: 10px; }
          .school-name { text-align: center; color: #666; margin-bottom: 20px; }
          .morning { background-color: #e3f2fd; }
          @media print {
            .timetable { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <h1 style="text-align: center;">Primary Lower Weekly Timetables</h1>
        <p style="text-align: center;">All Periods in Morning Session: 08:00 - 11:40</p>
        <p style="text-align: center;">Generated: ${new Date().toLocaleDateString()}</p>
    `

    for (const entry of Array.from(classGroups.entries())) {
      const [className, timetable] = entry
      html += `
        <div class="timetable">
          <h2>${className}</h2>
          <p class="school-name">${session?.user?.schoolName || 'School Name'}</p>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Time</th>
                ${days.map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => `
                <tr class="morning">
                  <td><strong>P${p}</strong></td>
                  <td>${getPeriodTime(p)}</td>
                  ${days.map(d => {
                    const slot = timetable.slots.find((s: TimetableSlot) => s.day === d && s.period === p)
                    return slot 
                      ? `<td>${slot.subject}<br><small>${slot.teacher}</small></td>`
                      : '<td>-</td>'
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
    }

    html += `
      </body>
      </html>
    `

    return html
  }

  // Convert preview data to PDF export format
  const convertToPDFEntries = (): TimetableEntry[] => {
    const entries: TimetableEntry[] = []
    
    for (const timetable of previewData) {
      for (const slot of timetable.slots) {
        entries.push({
          id: `${timetable.classId}-${slot.day}-${slot.period}`,
          day: slot.day,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          class: {
            name: timetable.className,
            level: timetable.classLevel
          },
          teacher: {
            name: slot.teacher
          },
          subject: {
            name: slot.subject
          }
        })
      }
    }
    
    return entries
  }

  // Convert preview data to PDF export format grouped by class and shift
  const convertToPDFEntriesByClass = (): { className: string; shift?: 'MORNING' | 'AFTERNOON' | 'BOTH'; entries: TimetableEntry[] }[] => {
    const classShiftMap = new Map<string, { className: string; shift: 'MORNING' | 'AFTERNOON' | 'BOTH'; entries: TimetableEntry[] }>()
    const schoolName = session?.user?.schoolName || ''
    
    for (const timetable of previewData) {
      const key = `${timetable.classId}-${timetable.shift || 'ALL'}`
      
      const entries: TimetableEntry[] = []
      for (const slot of timetable.slots) {
        entries.push({
          id: `${timetable.classId}-${slot.day}-${slot.period}`,
          day: slot.day,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          class: {
            name: schoolName ? `${schoolName} - ${timetable.className}` : timetable.className,
            level: timetable.classLevel
          },
          teacher: {
            name: slot.teacher
          },
          subject: {
            name: slot.subject
          }
        })
      }
      
      classShiftMap.set(key, {
        className: schoolName ? `${schoolName} - ${timetable.className}` : timetable.className,
        shift: 'MORNING',
        entries
      })
    }
    
    return Array.from(classShiftMap.values())
  }

  // Group classes by level for display
  const classesByLevel = {
    P1: existingClasses.filter(c => c.level === 'P1'),
    P2: existingClasses.filter(c => c.level === 'P2'),
    P3: existingClasses.filter(c => c.level === 'P3')
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Access control
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
          <p className="text-gray-600">Your account is not associated with any school.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SchoolAdminSidebar />

      <div className="ml-64 flex flex-col min-h-screen">
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
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <span>Primary Lower Timetables</span>
                    {isDoubleShift && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 ml-3">
                        <Clock className="h-4 w-4 mr-1" />
                        Double Shift
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {session.user.schoolName} - Generate P1, P2, P3 timetables
                    {isDoubleShift && ' (Morning & Afternoon Shifts)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Select Classes
                  </h3>

                  {isLoadingClasses ? (
                    <div className="flex items-center justify-center py-8">
                      <Clock className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading classes...</span>
                    </div>
                  ) : existingClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No P1-P3 classes registered yet.</p>
                      <p className="text-sm mt-2">Add classes first using "Add/View Classes".</p>
                      <Link
                        href="/dashboard/school-admin/add-classes"
                        className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add Classes
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Select All */}
                      <div className="mb-4 pb-4 border-b">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedClasses.length === existingClasses.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-700">
                            Select All ({existingClasses.length} classes)
                          </span>
                        </label>
                      </div>

                      {/* P1 Classes */}
                      {classesByLevel.P1.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Primary 1 (P1)</h4>
                          <div className="space-y-2">
                            {classesByLevel.P1.map(cls => (
                              <label key={cls.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(cls.id)}
                                  onChange={() => handleClassToggle(cls.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  {cls.name} {cls.stream && `(${cls.stream})`}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* P2 Classes */}
                      {classesByLevel.P2.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Primary 2 (P2)</h4>
                          <div className="space-y-2">
                            {classesByLevel.P2.map(cls => (
                              <label key={cls.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(cls.id)}
                                  onChange={() => handleClassToggle(cls.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  {cls.name} {cls.stream && `(${cls.stream})`}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* P3 Classes */}
                      {classesByLevel.P3.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Primary 3 (P3)</h4>
                          <div className="space-y-2">
                            {classesByLevel.P3.map(cls => (
                              <label key={cls.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(cls.id)}
                                  onChange={() => handleClassToggle(cls.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  {cls.name} {cls.stream && `(${cls.stream})`}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Type */}
                  {existingClasses.length > 0 && (
                    <div className="mb-6 mt-6 pt-6 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="action"
                            value="generate"
                            checked={action === 'generate'}
                            onChange={() => setAction('generate')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            Generate & Save (permanent)
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="action"
                            value="preview"
                            checked={action === 'preview'}
                            onChange={() => setAction('preview')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            Preview Only (temporary)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {existingClasses.length > 0 && (
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || selectedClasses.length === 0}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                        isLoading || selectedClasses.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : action === 'generate'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="animate-spin h-5 w-5 mr-2" />
                          Generating...
                        </>
                      ) : action === 'generate' ? (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Generate Timetables
                        </>
                      ) : (
                        <>
                          <Eye className="h-5 w-5 mr-2" />
                          Preview Timetables
                        </>
                      )}
                    </button>
                  )}

                  {/* Result Message */}
                  {result && (
                    <div className={`mt-4 p-4 rounded-md ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {result.success ? (
                        <div className="flex">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                              {result.message}
                            </p>
                            {result.classesGenerated && (
                              <p className="text-sm text-green-700 mt-1">
                                Classes: {result.classesGenerated}, Total Slots: {result.totalSlots}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex">
                          <XCircle className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                              {result.error || 'Generation failed'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conflicts */}
                  {result && result.conflicts && result.conflicts.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-800">
                            {result.conflicts.length} conflicts found
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button */}
              {previewData.length > 0 && (
                <div className="mt-6 bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-3">
                      <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Print Timetables
                      </button>
                      
                      {/* PDF Export Button - Batch mode with School Name - Class Name */}
                      <PDFExportButton
                        classTimetables={convertToPDFEntriesByClass()}
                        title={session?.user?.schoolName ? `${session.user.schoolName} - Timetable` : 'Timetable'}
                        schoolName={session?.user?.schoolName || undefined}
                        className="w-full"
                        variant="batch"
                      />
                    </div>
                    
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      {previewData.length} class(es) ready for export
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Timetable Preview
                  </h3>

                  {previewData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Select classes and click Generate/Preview to see timetables</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {previewData.map(timetable => (
                        <div key={timetable.classId} className="border rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-blue-900">
                                  {timetable.className}
                                  {timetable.stream && ` (${timetable.stream})`}
                                </h4>
                                <p className="text-sm text-blue-700">
                                  {timetable.slots.length} periods scheduled (All in Morning Session 08:00-11:40)
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Period
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                  </th>
                                  {days.map(day => (
                                    <th key={day} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {day.charAt(0) + day.slice(1).toLowerCase()}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {periods.map(period => (
                                  <tr key={period} className="bg-blue-50/50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      P{period}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {getPeriodTime(period)}
                                    </td>
                                    {days.map(day => {
                                      const slot = timetable.slots.find(s => s.day === day && s.period === period)
                                      return (
                                        <td key={`${day}-${period}`} className="px-3 py-2 text-sm text-center">
                                          {slot ? (
                                            <div>
                                              <span className="font-medium text-gray-900">{slot.subject}</span>
                                              <span className="block text-xs text-gray-500">{slot.teacher}</span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-300">-</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
