'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Wrench,
  LogOut,
  ArrowLeft,
  Users,
  BookOpen,
  Plus,
  X,
  Save,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Filter,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Teacher {
    id: string
    name: string
    email: string
    role: string
    teachingStreams?: string
    maxWeeklyHours?: number
    isActive: boolean
    unavailableDays?: string
    unavailablePeriods?: string
    _count?: {
        teacherSubjects: number
        trainerModules: number
        timetablesAsTeacher: number
    }
}

interface Module {
    id: string
    name: string
    code: string
    level: string
    trade?: string
    totalHours: number
    category: string
    blockSize: number
    isActive: boolean
}

export default function CreateTrainerAssignmentPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    
    // Data states
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Tab states
    const [activeTab, setActiveTab] = useState('single')
    
    // Form states
    const [selectedTrainer, setSelectedTrainer] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')
    const [selectedTrade, setSelectedTrade] = useState('')
    const [selectedModules, setSelectedModules] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)
    
    // Filter states
    const [trainerSearch, setTrainerSearch] = useState('')
    const [moduleSearch, setModuleSearch] = useState('')

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const fetchAllData = async () => {
        try {
            setIsLoading(true)
            
            // Fetch all required data
            const [teachersRes, modulesRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/modules')
            ])

            if (teachersRes.ok) {
                const teachersData = await teachersRes.json()
                setTeachers(teachersData)
            }

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                setModules(modulesData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
        }
    }, [session])

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

    // Filter trainers (teachers with TSS or trainer role)
    const trainers = teachers.filter(teacher => 
        teacher.isActive && 
        (teacher.role === 'TRAINER' || teacher.teachingStreams?.includes('TSS'))
    )

    const handleModuleToggle = (moduleId: string) => {
        setSelectedModules(prev => 
            prev.includes(moduleId) 
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        )
    }

    const handleSelectAllModules = () => {
        const filteredModules = getFilteredModules()
        if (selectedModules.length === filteredModules.length) {
            setSelectedModules([])
        } else {
            setSelectedModules(filteredModules.map(m => m.id))
        }
    }

    const handleCreateAssignment = async () => {
        if (!selectedTrainer || selectedModules.length === 0) {
            alert('Please select a trainer and at least one module.')
            return
        }

        setIsSubmitting(true)

        try {
            const assignments = selectedModules.map(moduleId => ({
                teacherId: selectedTrainer,
                moduleId: moduleId
            }))

            const responses = await Promise.allSettled(
                assignments.map(assignment => 
                    fetch('/api/trainer-modules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(assignment)
                    })
                )
            )

            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length
            const failed = responses.length - successful

            if (successful > 0) {
                alert(`Successfully created ${successful} assignment(s). ${failed > 0 ? `${failed} failed due to duplicates.` : ''}`)
                router.push('/dashboard/school-admin/trainer-assignments')
            } else {
                alert('All assignments failed. They may already exist.')
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating assignments')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setSelectedTrainer('')
        setSelectedLevel('')
        setSelectedTrade('')
        setSelectedModules([])
        setTrainerSearch('')
        setModuleSearch('')
    }

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/bulk-upload/templates/trainer_assignments')
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'trainer_assignments_template.csv'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            } else {
                alert('Failed to download template')
            }
        } catch (error) {
            console.error('Template download error:', error)
            alert('Error downloading template')
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file')
            return
        }

        setIsUploading(true)
        setUploadResult(null)

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'trainer_assignments')

        try {
            const response = await fetch('/api/bulk-upload', {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            setUploadResult(result)

            if (result.success) {
                // Refresh the page data after successful upload
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            }
        } catch (error) {
            console.error('Upload error:', error)
            setUploadResult({
                success: false,
                message: 'Upload failed. Please try again.',
                processed: 0
            })
        } finally {
            setIsUploading(false)
            // Clear the file input
            event.target.value = ''
        }
    }

    const getFilteredTrainers = () => {
        return trainers.filter(trainer => 
            trainer.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
            trainer.email.toLowerCase().includes(trainerSearch.toLowerCase())
        )
    }

    const getFilteredModules = () => {
        return modules.filter(module => {
            const matchesSearch = module.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                                module.code.toLowerCase().includes(moduleSearch.toLowerCase())
            const matchesLevel = !selectedLevel || module.level === selectedLevel
            const matchesTrade = !selectedTrade || module.trade === selectedTrade
            return matchesSearch && matchesLevel && matchesTrade
        })
    }

    const getUniqueLevels = () => {
        return Array.from(new Set(modules.map(m => m.level).filter(Boolean))).sort()
    }

    const getUniqueTrades = () => {
        return Array.from(new Set(modules.map(m => m.trade).filter(Boolean))).sort()
    }

    const getLevelBadgeColor = (level: string) => {
        if (['L3', 'L4', 'L5'].includes(level)) return 'bg-purple-100 text-purple-800'
        if (level.startsWith('S')) return 'bg-indigo-100 text-indigo-800'
        if (level.startsWith('P')) return 'bg-blue-100 text-blue-800'
        return 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin/trainer-assignments"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Trainer Assignments</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Plus className="h-8 w-8" />
                                    <span>Create Trainer Assignment</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Assign trainers to modules
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
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

            {/* Main Content */}
            <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    
                    {/* Form Card */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200 mb-4">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('single')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'single'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Wrench className="h-4 w-4" />
                                            <span>Create Single Assignment</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('bulk')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'bulk'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Upload className="h-4 w-4" />
                                            <span>Upload Assignments</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                                Assign Modules to Trainer
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Select a trainer and the modules they will be assigned to teach
                            </p>
                        </div>

                        {/* Single Assignment Form */}
                        {activeTab === 'single' && (
                            <div className="p-6 space-y-6">
                            {/* Trainer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Trainer *
                                </label>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search trainers..."
                                        value={trainerSearch}
                                        onChange={(e) => setTrainerSearch(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <select
                                    value={selectedTrainer}
                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Choose a trainer...</option>
                                    {getFilteredTrainers().map(trainer => (
                                        <option key={trainer.id} value={trainer.id}>
                                            {trainer.name} ({trainer.email}) {trainer.teachingStreams ? `(${trainer.teachingStreams})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {trainers.length === 0 && (
                                    <p className="mt-2 text-sm text-amber-600 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        No trainers with TSS specialization found. You need teachers with TSS or TRAINER role.
                                    </p>
                                )}
                            </div>

                            {/* Module Filters */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter Modules
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search modules..."
                                            value={moduleSearch}
                                            onChange={(e) => setModuleSearch(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={selectedLevel}
                                            onChange={(e) => setSelectedLevel(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Levels</option>
                                            {getUniqueLevels().map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={selectedTrade}
                                            onChange={(e) => setSelectedTrade(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Trades</option>
                                            {getUniqueTrades().map(trade => (
                                                <option key={trade} value={trade}>{trade}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Module Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Modules *
                                    </label>
                                    {getFilteredModules().length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleSelectAllModules}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {selectedModules.length === getFilteredModules().length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                {/* Module List */}
                                <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                                    {getFilteredModules().length === 0 ? (
                                        <div className="p-8 text-center">
                                            <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-gray-500 text-sm">
                                                No modules found matching the search criteria.
                                            </p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                Total modules in system: {modules.length}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {getFilteredModules().map(module => (
                                                <label key={module.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center h-5">
                                                        {selectedModules.includes(module.id) ? (
                                                            <CheckSquare className="h-5 w-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {module.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                {module.code}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeColor(module.level)}`}>
                                                                Level: {module.level}
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                {module.trade || 'General'}
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                {module.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModules.includes(module.id)}
                                                        onChange={() => handleModuleToggle(module.id)}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {selectedModules.length} of {getFilteredModules().length} modules selected
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedTrainer && selectedModules.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Assignment Preview
                                    </h4>
                                    <div className="text-sm text-blue-800">
                                        <p className="mb-2">
                                            Will create <strong>{selectedModules.length}</strong> assignment(s) for{' '}
                                            <strong>{trainers.find(t => t.id === selectedTrainer)?.name}</strong>{' '}
                                            to teach the following modules:
                                        </p>
                                        <div className="bg-white rounded border p-3 max-h-32 overflow-y-auto">
                                            <ul className="text-xs space-y-1">
                                                {selectedModules.map(moduleId => {
                                                    const module = modules.find(m => m.id === moduleId)
                                                    return (
                                                        <li key={moduleId} className="flex items-center">
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                                            {module?.name} ({module?.code}) - Level: {module?.level}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                                {/* Form Actions */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                                    <Link
                                        href="/dashboard/school-admin/trainer-assignments"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Link>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Reset Form
                                        </button>
                                        <button
                                            onClick={handleCreateAssignment}
                                            disabled={isSubmitting || !selectedTrainer || selectedModules.length === 0}
                                            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Create {selectedModules.length} Assignment{selectedModules.length !== 1 ? 's' : ''}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bulk Upload Section */}
                        {activeTab === 'bulk' && (
                            <div className="p-6 space-y-6">
                                {/* Template Download */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                            <div>
                                                <h3 className="text-sm font-medium text-green-900">Trainer Assignment Template</h3>
                                                <p className="text-sm text-green-700">Download CSV template with required fields</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={downloadTemplate}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download Template
                                        </button>
                                    </div>
                                    <div className="mt-3 text-xs text-green-600">
                                        <strong>Template Fields:</strong> Trainer Email, Module Code, Level, Trade
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <div className="space-y-2">
                                        <label htmlFor="assignment-file-upload" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">
                                                Upload CSV file with trainer assignments
                                            </span>
                                            <span className="mt-1 block text-sm text-gray-500">
                                                or drag and drop your CSV file here
                                            </span>
                                        </label>
                                        <input
                                            id="assignment-file-upload"
                                            name="assignment-file-upload"
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                            className="sr-only"
                                        />
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('assignment-file-upload')?.click()}
                                                disabled={isUploading}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Select File
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Instructions */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>1. Download the CSV template above</li>
                                        <li>2. Fill in your assignment data following the column headers</li>
                                        <li>3. Save the file as CSV format</li>
                                        <li>4. Upload the completed file using the button above</li>
                                    </ul>
                                </div>

                                {/* Upload Results */}
                                {uploadResult && (
                                    <div className={`rounded-lg border p-4 ${
                                        uploadResult.success 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <div className="flex">
                                            {uploadResult.success ? (
                                                <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <h3 className={`text-sm font-medium ${
                                                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                                                </h3>
                                                <div className={`mt-2 text-sm ${
                                                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                    <p>{uploadResult.message}</p>
                                                    {uploadResult.processed > 0 && (
                                                        <p className="mt-1">
                                                            Processed {uploadResult.processed} assignment{uploadResult.processed !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="font-medium">Errors:</p>
                                                            <ul className="list-disc list-inside mt-1">
                                                                {uploadResult.errors.map((error: string, index: number) => (
                                                                    <li key={index} className="text-xs">{error}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}