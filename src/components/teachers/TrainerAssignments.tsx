import { useState, useEffect } from 'react'
import { Wrench, Users, Plus, X, Save, BookOpen } from 'lucide-react'

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
    _count?: {
        trainerModules: number
    }
}

interface TrainerAssignment {
    id: string
    teacherId: string
    moduleId: string
    assignedAt: string
    teacher: Teacher
    module: Module
}

interface TrainerAssignmentsProps {
    teachers: Teacher[]
    onAssignmentUpdate: () => void
}

export default function TrainerAssignments({ teachers, onAssignmentUpdate }: TrainerAssignmentsProps) {
    const [modules, setModules] = useState<Module[]>([])
    const [assignments, setAssignments] = useState<TrainerAssignment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')
    const [selectedTrade, setSelectedTrade] = useState('')
    const [selectedModules, setSelectedModules] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)

    const [filterByStatus, setFilterByStatus] = useState('all')
    const [sortBy, setSortBy] = useState('name')
    const [bulkMode, setBulkMode] = useState(false)
    const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
    const [trainerSpecializationFilter, setTrainerSpecializationFilter] = useState('all')
    const [trainerWorkloadFilter, setTrainerWorkloadFilter] = useState('all')
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [modulesRes, assignmentsRes] = await Promise.all([
                fetch('/api/modules'),
                fetch('/api/trainer-modules')
            ])

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                setModules(modulesData)
            }

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json()
                setAssignments(assignmentsData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddAssignment = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Create assignments for all selected modules
            const assignmentPromises = selectedModules.map(moduleId =>
                fetch('/api/trainer-modules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        teacherId: selectedTeacher,
                        moduleId: moduleId
                    }),
                })
            )

            const responses = await Promise.all(assignmentPromises)
            const failedAssignments = responses.filter(response => !response.ok)

            if (failedAssignments.length === 0) {
                alert(`Successfully assigned ${selectedModules.length} module(s) to the trainer!`)
                resetForm()
                setShowAddModal(false)
                fetchData()
                onAssignmentUpdate()
            } else {
                // Show detailed error information
                const errorMessages = []
                for (let i = 0; i < failedAssignments.length; i++) {
                    const response = failedAssignments[i]
                    try {
                        const errorData = await response.json()
                        errorMessages.push(`Assignment ${i + 1}: ${errorData.error || 'Unknown error'} (${response.status})`)
                    } catch {
                        errorMessages.push(`Assignment ${i + 1}: ${response.status} ${response.statusText}`)
                    }
                }
                
                const errorMessage = `Failed to create ${failedAssignments.length} assignment(s):\n\n${errorMessages.join('\n')}\n\nPlease check that you are logged in as a School Admin and try again.`
                alert(errorMessage)
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating the assignments')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return

        try {
            const response = await fetch(`/api/trainer-modules?id=${assignmentId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Assignment deleted successfully!')
                fetchData()
                onAssignmentUpdate()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete assignment')
            }
        } catch (error) {
            console.error('Assignment deletion error:', error)
            alert('An error occurred while deleting the assignment')
        }
    }

    const resetForm = () => {
        setSelectedTeacher('')
        setSelectedLevel('')
        setSelectedTrade('')
        setSelectedModules([])

        setSelectedTrainers([])
        setBulkMode(false)
    }

    const getFilteredModules = () => {
        // Show all modules regardless of isActive status
        let filtered = modules
        
        if (selectedLevel) {
            filtered = filtered.filter(m => m.level === selectedLevel)
        }
        
        if (selectedTrade) {
            filtered = filtered.filter(m => m.trade === selectedTrade)
        }
        
        // Exclude already assigned modules
        const assignedModuleIds = assignments.filter(a => a.teacherId === selectedTeacher).map(a => a.moduleId)
        
        return filtered.filter(m => !assignedModuleIds.includes(m.id))
    }

    const getAvailableLevels = () => {
        // Show all modules to ensure data appears
        const allModules = modules
        
        const modulesWithLevels = allModules.filter(m => m.level && m.level.trim() !== '')
        const levels = Array.from(new Set(modulesWithLevels.map(m => m.level)))
        
        // Fallback: if no levels found, show default levels
        if (levels.length === 0) {
            return ['L3', 'L4', 'L5']
        }
        
        return levels.sort()
    }

    const getAvailableTrades = () => {
        // Show all modules regardless of isActive status
        const allModules = modules
        
        const filteredByLevel = selectedLevel ? allModules.filter(m => m.level === selectedLevel) : allModules
        
        const modulesWithTrades = filteredByLevel.filter(m => m.trade && m.trade.trim() !== '')
        
        const trades = Array.from(new Set(modulesWithTrades.map(m => m.trade).filter(Boolean)))
        
        // Fallback: if no trades found, show default trades
        if (trades.length === 0) {
            return ['ELT', 'English', 'Mathematics', 'ICT', 'General']
        }
        
        return trades.sort()
    }

    const getAvailableSpecializations = () => {
        const specializations = Array.from(new Set(teachers.filter(t => t.isActive && t.teachingStreams).map(t => t.teachingStreams).filter(Boolean)))
        return specializations.sort()
    }

    const getTrainerWorkloadLevel = (teacherId: string) => {
        const assignmentCount = getTeacherAssignments(teacherId).length
        if (assignmentCount === 0) return 'none'
        if (assignmentCount <= 2) return 'light'
        if (assignmentCount <= 5) return 'moderate'
        return 'heavy'
    }

    const handleModuleToggle = (moduleId: string) => {
        setSelectedModules(prev => 
            prev.includes(moduleId) 
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        )
    }

    const toggleBulkTrainerSelection = (teacherId: string) => {
        setSelectedTrainers(prev => 
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        )
    }

    const exportAssignments = () => {
        const filteredTeachers = getFilteredTeachers()
        const exportData = filteredTeachers.map(teacher => {
            const teacherAssignments = getTeacherAssignments(teacher.id)
            return {
                trainerName: teacher.name,
                email: teacher.email,
                specialization: teacher.teachingStreams || 'N/A',
                status: teacher.isActive ? 'Active' : 'Inactive',
                workload: getTrainerWorkloadLevel(teacher.id),
                assignmentCount: teacherAssignments.length,
                assignedModules: teacherAssignments.map(a => `${a.module.name} (${a.module.code})`).join('; '),
                assignedDate: teacherAssignments.length > 0 
                    ? new Date(Math.max(...teacherAssignments.map(a => new Date(a.assignedAt).getTime()))).toLocaleDateString()
                    : 'N/A'
            }
        })
        
        const csvContent = [
            ['Trainer Name', 'Email', 'Specialization', 'Status', 'Workload', 'Assignment Count', 'Assigned Modules', 'Latest Assignment Date'],
            ...exportData.map(row => [
                row.trainerName,
                row.email,
                row.specialization,
                row.status,
                row.workload,
                row.assignmentCount.toString(),
                row.assignedModules,
                row.assignedDate
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `trainer_assignments_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getTeacherAssignments = (teacherId: string) => {
        return assignments.filter(a => a.teacherId === teacherId)
    }

    const getFilteredTeachers = () => {
        let filtered = teachers.filter(t => t.isActive && (t.role === 'TEACHER' || t.role === 'TRAINER'))
        
        // Apply status filter
        if (filterByStatus !== 'all') {
            if (filterByStatus === 'active') {
                filtered = filtered.filter(t => t.isActive)
            } else if (filterByStatus === 'inactive') {
                filtered = filtered.filter(t => !t.isActive)
            }
        }
        
        // Apply specialization filter
        if (trainerSpecializationFilter !== 'all') {
            filtered = filtered.filter(t => t.teachingStreams === trainerSpecializationFilter)
        }
        
        // Apply workload filter
        if (trainerWorkloadFilter !== 'all') {
            filtered = filtered.filter(t => {
                const workload = getTrainerWorkloadLevel(t.id)
                return workload === trainerWorkloadFilter
            })
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'date':
                    // Sort by assignment count (descending)
                    const aAssignments = getTeacherAssignments(a.id).length
                    const bAssignments = getTeacherAssignments(b.id).length
                    return bAssignments - aAssignments
                case 'modules':
                    // Sort by current assignments
                    const aModuleCount = getTeacherAssignments(a.id).length
                    const bModuleCount = getTeacherAssignments(b.id).length
                    return bModuleCount - aModuleCount
                case 'workload':
                    // Sort by workload level
                    const aWorkload = getTrainerWorkloadLevel(a.id)
                    const bWorkload = getTrainerWorkloadLevel(b.id)
                    const workloadOrder = { 'none': 0, 'light': 1, 'moderate': 2, 'heavy': 3 }
                    return workloadOrder[aWorkload] - workloadOrder[bWorkload]
                default:
                    return 0
            }
        })
        
        return filtered
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Wrench className="h-6 w-6 mr-2" />
                            Teacher Assignments Management
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Assign modules to teacher
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setBulkMode(!bulkMode)}
                            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors ${
                                bulkMode 
                                    ? 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100'
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Assignment'}
                        </button>
                        <button
                            onClick={exportAssignments}
                            className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-colors"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Assignment
                        </button>
                    </div>
                </div>
                
                {/* Enhanced Controls */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Filter & Search</h3>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Search Box */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Trainers
                            </label>
                            <input
                                type="text"
                                placeholder="Search by name, email, or specialization..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filterByStatus}
                                onChange={(e) => setFilterByStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                        
                        {/* Sort Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">Name</option>
                                <option value="date">Recent Activity</option>
                                <option value="modules">Module Count</option>
                                <option value="workload">Workload</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Specialization Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Specialization
                                    </label>
                                    <select
                                        value={trainerSpecializationFilter}
                                        onChange={(e) => setTrainerSpecializationFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Specializations</option>
                                        {getAvailableSpecializations().map(spec => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Workload Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Workload
                                    </label>
                                    <select
                                        value={trainerWorkloadFilter}
                                        onChange={(e) => setTrainerWorkloadFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Workloads</option>
                                        <option value="none">No Assignments</option>
                                        <option value="light">Light (1-2 modules)</option>
                                        <option value="moderate">Moderate (3-5 modules)</option>
                                        <option value="heavy">Heavy (6+ modules)</option>
                                    </select>
                                </div>
                                
                                {/* Reset Filters */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setFilterByStatus('all')
                                            setSortBy('name')
                                            setTrainerSpecializationFilter('all')
                                            setTrainerWorkloadFilter('all')
                                        }}
                                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Filter Summary */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                            Showing {getFilteredTeachers().length} of {teachers.filter(t => t.isActive && (t.role === 'TEACHER' || t.role === 'TRAINER')).length} active teachers/trainers
                        </div>
                        
                        {/* Bulk Selection Info */}
                        {bulkMode && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                    {selectedTrainers.length} trainer(s) selected
                                </span>
                                {selectedTrainers.length > 0 && (
                                    <button
                                        onClick={() => setSelectedTrainers([])}
                                        className="text-xs text-red-600 hover:text-red-800"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Overview */}
            {(() => {
                const allAssignments = assignments.filter(a => teachers.find(t => t.id === a.teacherId && t.isActive && (t.role === 'TEACHER' || t.role === 'TRAINER')))
                if (allAssignments.length === 0) return null
                
                return (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <Wrench className="h-5 w-5 mr-2" />
                            All Trainer Assignments Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allAssignments.slice(0, 6).map((assignment) => {
                                const teacher = teachers.find(t => t.id === assignment.teacherId)
                                const module = assignment.module
                                if (!teacher) return null
                                
                                return (
                                    <div key={assignment.id} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 text-sm">{teacher.name}</h4>
                                                <p className="text-xs text-gray-600">{module.name}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remove assignment"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                {module.level}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                {module.trade || 'General'}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {module.code}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {allAssignments.length > 6 && (
                            <p className="text-sm text-blue-700 mt-3 text-center">
                                ... and {allAssignments.length - 6} more assignments
                            </p>
                        )}
                    </div>
                )
            })()}

            {/* Teachers List with Expandable Details */}
            <div className="space-y-4">
                {getFilteredTeachers().map((teacher) => {
                    const teacherAssignments = getTeacherAssignments(teacher.id)
                    const isExpanded = expandedTeacher === teacher.id
                    const isSelectedInBulk = selectedTrainers.includes(teacher.id)
                    return (
                        <div key={teacher.id} className="bg-white shadow rounded-lg overflow-hidden border">
                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Bulk Selection Checkbox */}
                                        {bulkMode && (
                                            <input
                                                type="checkbox"
                                                checked={isSelectedInBulk}
                                                onChange={() => toggleBulkTrainerSelection(teacher.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                        
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{teacher.name}</h3>
                                            <p className="text-sm text-gray-500">{teacher.email}</p>
                                            {teacher.teachingStreams && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    {teacher.teachingStreams}
                                                </p>
                                            )}
                                            {/* Workload Indicator */}
                                            {(() => {
                                                const workload = getTrainerWorkloadLevel(teacher.id)
                                                const workloadColors = {
                                                    none: 'bg-gray-100 text-gray-800',
                                                    light: 'bg-green-100 text-green-800',
                                                    moderate: 'bg-yellow-100 text-yellow-800',
                                                    heavy: 'bg-red-100 text-red-800'
                                                }
                                                const workloadLabels = {
                                                    none: 'No assignments',
                                                    light: 'Light workload',
                                                    moderate: 'Moderate workload',
                                                    heavy: 'Heavy workload'
                                                }
                                                return (
                                                    <div className="flex items-center mt-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${workloadColors[workload]}`}>
                                                            {workloadLabels[workload]}
                                                        </span>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                teacher.isActive 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {teacher.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <p className="text-sm font-medium text-gray-900">
                                                {teacherAssignments.length} Module{teacherAssignments.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setExpandedTeacher(isExpanded ? null : teacher.id)}
                                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                            {isExpanded ? 'Hide details' : 'View details'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {teacherAssignments.length > 0 ? (
                                <div className="bg-gray-50 p-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Assigned Modules ({teacherAssignments.length})
                                    </h4>
                                    <div className="space-y-4">
                                        {teacherAssignments.map((assignment) => {
                                            const module = assignment.module
                                            return (
                                                <div key={assignment.id} className="bg-white rounded-lg border p-4 shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            {/* Module Name - Prominent */}
                                                            <div className="flex items-center mb-2">
                                                                <h5 className="text-lg font-semibold text-gray-900 mr-3">
                                                                    {module.name}
                                                                </h5>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {module.code}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Level, Trade & Category Row */}
                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                    Level: {module.level}
                                                                </span>
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                                    Trade: {module.trade || 'General'}
                                                                </span>
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                                                    Category: {module.category}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Duration & Assignment Date */}
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <span className="flex items-center">
                                                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {module.totalHours} hours/week
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Actions */}
                                                        <div className="ml-4">
                                                            <button
                                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-8 text-center">
                                    <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">
                                        No modules assigned to this teacher yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add Assignment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">Assign Modules to Teacher</h3>
                            <button onClick={() => { setShowAddModal(false); resetForm() }}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAssignment} className="space-y-6">
                            {/* Trainer Selection */}
                            <div>
                                <label htmlFor="trainer" className="block text-sm font-medium text-gray-700">
                                    Teacher *
                                </label>
                                <select
                                    name="trainer"
                                    id="trainer"
                                    required
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Trainer</option>
                                    {teachers.filter(t => t.isActive && (t.role === 'TEACHER' || t.role === 'TRAINER')).map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name} - {teacher.email} {teacher.teachingStreams ? `(${teacher.teachingStreams})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    Select the teacher to assign modules to.
                                </p>
                            </div>

                            {/* Level Selection */}
                            <div>
                                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                    Level *
                                </label>
                                <select
                                    name="level"
                                    id="level"
                                    required
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Level</option>
                                    {getAvailableLevels().map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    The level determines which modules will be available for assignment.
                                </p>
                            </div>

                            {/* Trade Selection */}
                            <div>
                                <label htmlFor="trade" className="block text-sm font-medium text-gray-700">
                                    Trade (Optional)
                                </label>
                                <select
                                    name="trade"
                                    id="trade"
                                    value={selectedTrade}
                                    onChange={(e) => setSelectedTrade(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Trades</option>
                                    {getAvailableTrades().map(trade => (
                                        <option key={trade || 'general'} value={trade || ''}>
                                            {trade || 'General'}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    Optional: Filter modules by trade specialization.
                                </p>
                            </div>

                            {/* Module Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Modules to Assign *
                                </label>
                                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                                    {(() => {
                                        // Show all modules regardless of isActive status
                                        let modulesToShow = modules
                                        if (selectedLevel) {
                                            modulesToShow = modulesToShow.filter(m => m.level === selectedLevel)
                                        }
                                        if (selectedTrade) {
                                            modulesToShow = modulesToShow.filter(m => m.trade === selectedTrade)
                                        }
                                        
                                        return modulesToShow.length > 0 ? (
                                            <div className="space-y-2 p-4">
                                                {modulesToShow.map(module => (
                                                    <label key={module.id} className="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-blue-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedModules.includes(module.id)}
                                                            onChange={() => handleModuleToggle(module.id)}
                                                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{module.name}</div>
                                                            <div className="text-sm text-gray-600">
                                                                <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                                                                    {module.code}
                                                                </span>
                                                                <span className="inline-block bg-green-100 px-2 py-1 rounded text-xs mr-2">
                                                                    Level: {module.level}
                                                                </span>
                                                                <span className="inline-block bg-purple-100 px-2 py-1 rounded text-xs mr-2">
                                                                    Trade: {module.trade || 'General'}
                                                                </span>
                                                                <span className="inline-block bg-blue-100 px-2 py-1 rounded text-xs">
                                                                    {module.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-gray-500 text-sm">
                                                    No modules available for the selected criteria.
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Selected Level: {selectedLevel || 'None'} | Selected Trade: {selectedTrade || 'None'}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Total modules in system: {modules.length}
                                                </p>
                                            </div>
                                        )
                                    })()}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    Select one or more modules to assign to the trainer.
                                </p>
                            </div>



                            {/* Preview */}
                            {selectedTeacher && selectedModules.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Assignment Preview</h3>
                                    <div className="text-sm text-gray-600">
                                        <div><strong>Teacher:</strong> {teachers.find(t => t.id === selectedTeacher)?.name}</div>
                                        <div><strong>Level:</strong> {selectedLevel || 'Not selected'}</div>
                                        {selectedTrade && <div><strong>Trade:</strong> {selectedTrade}</div>}
                                        <div><strong>Modules:</strong> {selectedModules.length} selected</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); resetForm() }}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedTeacher || selectedModules.length === 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Assign {selectedModules.length} Module{selectedModules.length !== 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}