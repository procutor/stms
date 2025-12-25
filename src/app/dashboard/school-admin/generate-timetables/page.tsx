'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, LogOut, ArrowLeft, Play, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { SinglePDFExportButton, BatchPDFExportButton } from '@/components/pdf/PDFExportButton'
import { TimetableEntry } from '@/lib/pdf-export'

interface Class {
    id: string
    name: string
    level: string
    stream: string
}

interface Teacher {
    id: string
    name: string
    role: string
}

interface GenerationResult {
    message: string
    conflicts: any[]
    conflictCount: number
    classId?: string
    className?: string
    teacherId?: string
    teacherName?: string
    mode?: string
    error?: string
}

export default function GenerateTimetables() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [generationType, setGenerationType] = useState<'class' | 'teacher' | 'school'>('class')
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [schoolScope, setSchoolScope] = useState<'all-classes' | 'all-teachers' | 'both'>('both')
    const [classes, setClasses] = useState<Class[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<GenerationResult | null>(null)
    const [regenerate, setRegenerate] = useState(false)
    const [incremental, setIncremental] = useState(false)
    const [generatedTimetables, setGeneratedTimetables] = useState<{ className: string; entries: TimetableEntry[] }[]>([])

    useEffect(() => {
        if (session?.user) {
            fetchClasses()
            fetchTeachers()
        }
    }, [session])

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes')
            if (response.ok) {
                const data = await response.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Error fetching classes:', error)
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

    const fetchGeneratedTimetables = async (generationResult: GenerationResult) => {
        try {
            let timetables: any[] = []
            
            if (generationResult.classId) {
                // Fetch single class timetable
                const response = await fetch(`/api/timetables?classId=${generationResult.classId}`)
                if (response.ok) {
                    timetables = await response.json()
                }
                
                if (timetables.length > 0) {
                    const classData = classes.find(c => c.id === generationResult.classId)
                    setGeneratedTimetables([{
                        className: classData?.name || 'Unknown Class',
                        entries: timetables.map(t => ({
                            id: t.id,
                            day: t.timeSlot.day,
                            period: t.timeSlot.period,
                            startTime: t.timeSlot.startTime,
                            endTime: t.timeSlot.endTime,
                            class: t.class,
                            teacher: t.teacher,
                            subject: t.subject,
                            module: t.module
                        }))
                    }])
                }
            } else if (generationResult.teacherId) {
                // Fetch single teacher timetable
                const response = await fetch(`/api/timetables?teacherId=${generationResult.teacherId}`)
                if (response.ok) {
                    timetables = await response.json()
                }
                
                if (timetables.length > 0) {
                    const teacherData = teachers.find(t => t.id === generationResult.teacherId)
                    setGeneratedTimetables([{
                        className: teacherData?.name || 'Unknown Teacher',
                        entries: timetables.map(t => ({
                            id: t.id,
                            day: t.timeSlot.day,
                            period: t.timeSlot.period,
                            startTime: t.timeSlot.startTime,
                            endTime: t.timeSlot.endTime,
                            class: t.class,
                            teacher: t.teacher,
                            subject: t.subject,
                            module: t.module
                        }))
                    }])
                }
            } else {
                // Fetch school timetables based on scope
                const response = await fetch('/api/timetables')
                if (response.ok) {
                    timetables = await response.json()

                    if (schoolScope === 'all-teachers') {
                        // Group by teacher
                        const teacherMap = new Map<string, { className: string; entries: TimetableEntry[] }>()
                        timetables.forEach(entry => {
                            const teacherId = entry.teacherId
                            if (!teacherMap.has(teacherId)) {
                                const teacherData = teachers.find(t => t.id === teacherId)
                                teacherMap.set(teacherId, {
                                    className: teacherData?.name || 'Unknown Teacher',
                                    entries: []
                                })
                            }
                            teacherMap.get(teacherId)!.entries.push({
                                id: entry.id,
                                day: entry.timeSlot.day,
                                period: entry.timeSlot.period,
                                startTime: entry.timeSlot.startTime,
                                endTime: entry.timeSlot.endTime,
                                class: entry.class,
                                teacher: entry.teacher,
                                subject: entry.subject,
                                module: entry.module
                            })
                        })

                        setGeneratedTimetables(Array.from(teacherMap.values()))
                    } else {
                        // Group by class (for 'all-classes' and 'both' scopes)
                        const classMap = new Map<string, { className: string; entries: TimetableEntry[] }>()
                        timetables.forEach(entry => {
                            const classId = entry.classId
                            if (!classMap.has(classId)) {
                                const classData = classes.find(c => c.id === classId)
                                classMap.set(classId, {
                                    className: classData?.name || 'Unknown Class',
                                    entries: []
                                })
                            }
                            classMap.get(classId)!.entries.push({
                                id: entry.id,
                                day: entry.timeSlot.day,
                                period: entry.timeSlot.period,
                                startTime: entry.timeSlot.startTime,
                                endTime: entry.timeSlot.endTime,
                                class: entry.class,
                                teacher: entry.teacher,
                                subject: entry.subject,
                                module: entry.module
                            })
                        })

                        setGeneratedTimetables(Array.from(classMap.values()))
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching generated timetables:', error)
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        setResult(null)
        setGeneratedTimetables([])

        try {
            const payload: any = {
                regenerate,
                incremental
            }

            if (generationType === 'class' && selectedClass) {
                payload.classId = selectedClass
            } else if (generationType === 'teacher' && selectedTeacher) {
                payload.teacherId = selectedTeacher
            } else if (generationType === 'school') {
                payload.scope = schoolScope
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (response.ok) {
                setResult(data)
                // Fetch generated timetables for PDF export
                if (!data.error) {
                    fetchGeneratedTimetables(data)
                }
            } else {
                setResult({ ...data, error: data.error || 'Generation failed' })
            }
        } catch (error) {
            console.error('Generation error:', error)
            setResult({ message: '', conflicts: [], conflictCount: 0, error: 'An error occurred during generation' })
        } finally {
            setIsGenerating(false)
        }
    }

    const canGenerate = () => {
        if (generationType === 'class') return selectedClass !== ''
        if (generationType === 'teacher') return selectedTeacher !== ''
        return true
    }

    if (status === 'loading') {
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
                                    <Calendar className="h-8 w-8" />
                                    <span>Generate Timetables</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Create automated timetables
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
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
            <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="space-y-6">
                                {/* Generation Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        What would you like to generate timetables for?
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="generationType"
                                                value="class"
                                                checked={generationType === 'class'}
                                                onChange={(e) => setGenerationType(e.target.value as 'class')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Specific Class - Generate timetable for a particular class
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="generationType"
                                                value="teacher"
                                                checked={generationType === 'teacher'}
                                                onChange={(e) => setGenerationType(e.target.value as 'teacher')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Specific Teacher - Generate timetable for a particular teacher
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="generationType"
                                                value="school"
                                                checked={generationType === 'school'}
                                                onChange={(e) => setGenerationType(e.target.value as 'school')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Entire School - Generate timetables for all classes and teachers
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Class Selection */}
                                {generationType === 'class' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Class
                                        </label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Choose a class...</option>
                                            {classes.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} {cls.level && `(${cls.level}${cls.stream ? ` ${cls.stream}` : ''})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Teacher Selection */}
                                {generationType === 'teacher' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Teacher
                                        </label>
                                        <select
                                            value={selectedTeacher}
                                            onChange={(e) => setSelectedTeacher(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Choose a teacher...</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.name} ({teacher.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* School Scope Selection */}
                                {generationType === 'school' && (
                                    <div className="ml-6 space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Scope:
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="schoolScope"
                                                value="all-classes"
                                                checked={schoolScope === 'all-classes'}
                                                onChange={(e) => setSchoolScope(e.target.value as 'all-classes')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                All Classes - Generate timetables for all classes
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="schoolScope"
                                                value="all-teachers"
                                                checked={schoolScope === 'all-teachers'}
                                                onChange={(e) => setSchoolScope(e.target.value as 'all-teachers')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                All Teachers - Generate timetables for all teachers
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="schoolScope"
                                                value="both"
                                                checked={schoolScope === 'both'}
                                                onChange={(e) => setSchoolScope(e.target.value as 'both')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Both - Generate timetables for all classes and teachers
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {/* Generation Options */}
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={regenerate}
                                            onChange={(e) => setRegenerate(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 block text-sm font-medium text-gray-700">
                                            Regenerate - Replace existing timetables (if any)
                                        </span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={incremental}
                                            onChange={(e) => setIncremental(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 block text-sm font-medium text-gray-700">
                                            Incremental - Only generate if no timetables exist
                                        </span>
                                    </label>
                                </div>

                                {/* Generate Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !canGenerate()}
                                        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Generating Timetables...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 mr-2" />
                                                Generate Timetables
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Result */}
                                {result && (
                                    <div className={`mt-6 p-4 rounded-md ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                        <div className="flex items-start">
                                            {result.error ? (
                                                <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                                            ) : (
                                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                                            )}
                                            <div className="ml-3 flex-1">
                                                <h3 className={`text-sm font-medium ${result.error ? 'text-red-800' : 'text-green-800'}`}>
                                                    {result.error ? 'Generation Failed' : 'Generation Successful'}
                                                </h3>
                                                <div className={`mt-2 text-sm ${result.error ? 'text-red-700' : 'text-green-700'}`}>
                                                    <p>{result.message || result.error}</p>
                                                    {!result.error && (
                                                        <div className="mt-3 space-y-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                <Link
                                                                    href={`/dashboard/school-admin/timetables${result.teacherId ? `?teacherId=${result.teacherId}` : result.classId ? `?classId=${result.classId}` : ''}`}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    View Generated Timetable
                                                                </Link>
                                                                
                                                                {/* Combined PDF Export */}
                                                                {generatedTimetables.length > 0 && (
                                                                    <BatchPDFExportButton
                                                                        classTimetables={generatedTimetables}
                                                                        title={`${session.user.schoolName} Timetables - ${new Date().toLocaleDateString()}`}
                                                                        schoolName={session.user.schoolName || undefined}
                                                                        onExportStart={() => console.log('PDF export started')}
                                                                        onExportComplete={() => console.log('PDF export completed')}
                                                                        onExportError={(error: any) => console.error('PDF export failed:', error)}
                                                                    />
                                                                )}
                                                            </div>
                                                            
                                                            {/* Individual PDF Downloads */}
                                                            {generatedTimetables.length > 0 && (
                                                                <div className="mt-4">
                                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                                        Download Individual PDFs:
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {generatedTimetables.map((timetable, index) => (
                                                                            <div key={index} className="flex items-center space-x-2">
                                                                                <SinglePDFExportButton
                                                                                    entries={timetable.entries}
                                                                                    title={`${timetable.className} Timetable`}
                                                                                    schoolName={session.user.schoolName || undefined}
                                                                                    onExportStart={() => console.log(`Exporting ${timetable.className}...`)}
                                                                                    onExportComplete={() => console.log(`${timetable.className} downloaded!`)}
                                                                                    onExportError={(error: any) => console.error(`Export failed for ${timetable.className}:`, error)}
                                                                                />
                                                                                <span className="text-xs text-gray-500">
                                                                                    {timetable.className}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {generatedTimetables.length > 0 && (
                                                                <p className="text-xs text-gray-600">
                                                                    {generatedTimetables.length} timetable{generatedTimetables.length !== 1 ? 's' : ''} ready for PDF export
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {result.conflictCount > 0 && (
                                                        <div className="mt-2">
                                                            <div className="flex items-center">
                                                                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                                                                <span className="font-medium">Conflicts: {result.conflictCount}</span>
                                                            </div>
                                                            {result.conflicts.slice(0, 3).map((conflict, index) => (
                                                                <p key={index} className="text-xs mt-1 ml-5">
                                                                    • {conflict.message}
                                                                </p>
                                                            ))}
                                                            {result.conflicts.length > 3 && (
                                                                <p className="text-xs mt-1 ml-5 text-gray-500">
                                                                    ... and {result.conflicts.length - 3} more conflicts
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
