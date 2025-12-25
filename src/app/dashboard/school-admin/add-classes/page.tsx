'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X, BookOpen, Users, CheckSquare, Square, Search, Save, Upload } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

interface Class {
    id: string
    name: string
    level: string
    stream?: string
    _count: {
        subjects: number
        timetables: number
        trainerClassModules: number
    }
}

interface Subject {
    id: string
    name: string
    code: string
    level: string
}

interface Module {
    id: string
    name: string
    code: string
    level: string
    trade?: string
    category: string
}

interface Trainer {
    id: string
    name: string
    email: string
    role: string
}

export default function AddClassesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [classes, setClasses] = useState<Class[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [assignmentType, setAssignmentType] = useState<'subjects' | 'modules'>('subjects')
    const [assignmentStep, setAssignmentStep] = useState<'type' | 'stream' | 'items'>('type')
    const [selectedClassForAssignment, setSelectedClassForAssignment] = useState<Class | null>(null)

    const [showEditModal, setShowEditModal] = useState(false)
    const [editingClass, setEditingClass] = useState<Class | null>(null)

    // Form state
    const [newClass, setNewClass] = useState({
        level: '',
        stream: ''
    })

    // Assignment state
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
    const [selectedTrainer, setSelectedTrainer] = useState('')
    const [selectedModule, setSelectedModule] = useState('')
    const [selectedModules, setSelectedModules] = useState<string[]>([])
    const [subjectSearch, setSubjectSearch] = useState('')
    const [trainerSearch, setTrainerSearch] = useState('')
    const [moduleSearch, setModuleSearch] = useState('')
    const [moduleLevelFilter, setModuleLevelFilter] = useState('')
    const [moduleTradeFilter, setModuleTradeFilter] = useState('')
    const [currentAssignments, setCurrentAssignments] = useState<any[]>([])
    const [showEditAssignments, setShowEditAssignments] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<any>(null)
    const [showClassDetails, setShowClassDetails] = useState(false)
    const [selectedClassForDetails, setSelectedClassForDetails] = useState<Class | null>(null)
    const [classDetailsAssignments, setClassDetailsAssignments] = useState<any[]>([])
    const [classSearchTerm, setClassSearchTerm] = useState('')
    // Teacher selection for automatic assignment creation
    const [selectedTeacherForSubjects, setSelectedTeacherForSubjects] = useState('')
    const [showTeacherSelection, setShowTeacherSelection] = useState(false)

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
        cls.level.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
        (cls.stream && cls.stream.toLowerCase().includes(classSearchTerm.toLowerCase()))
    )

    useEffect(() => {
        if (session?.user) {
            fetchAllData()
        }
    }, [session])

    const fetchAllData = async () => {
        try {
            setIsLoading(true)

            const [classesRes, subjectsRes, modulesRes, trainersRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/subjects'),
                fetch('/api/modules'),
                fetch('/api/teachers') // TSS trainers are teachers
            ])

            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setClasses(classesData)
            } else if (classesRes.status === 400) {
                // No school assigned
                router.push('/dashboard/school-admin')
            }

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                setSubjects(subjectsData)
            }

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                setModules(modulesData)
            }

            if (trainersRes.ok) {
                const trainersData = await trainersRes.json()
                setTrainers(trainersData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const addClass = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const classData = {
                name: `${newClass.level}${newClass.stream}`,
                level: newClass.level,
                stream: newClass.stream
            }

            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData),
            })

            const data = await response.json()

            if (response.ok) {
                alert('Class added successfully!')
                setShowAddModal(false)
                setNewClass({ level: '', stream: '' })
                fetchAllData()
            } else {
                alert('Failed to add class: ' + data.error)
            }
        } catch (error) {
            console.error('Error adding class:', error)
            alert('An error occurred while adding the class.')
        }
    }

    const fetchCurrentAssignments = async (classId: string) => {
        try {
            const [subjectsRes, modulesRes] = await Promise.all([
                fetch(`/api/class-assignments?classId=${classId}`),
                fetch('/api/teacher-class-assignments')
            ])

            const assignments = []

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                assignments.push(...subjectsData.classSubjects.map((s: any) => ({ ...s, type: 'subject' })))
            }

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                // Filter by classId
                const filteredModules = [
                    ...modulesData.teacherClassSubjects.filter((s: any) => s.classId === classId),
                    ...modulesData.trainerClassModules.filter((m: any) => m.classId === classId)
                ]
                assignments.push(...filteredModules.map((m: any) => ({ ...m, type: m.trainer ? 'module' : 'subject' })))
            }

            setCurrentAssignments(assignments)
        } catch (error) {
            console.error('Error fetching current assignments:', error)
        }
    }

    const fetchClassDetails = async (classId: string) => {
        try {
            const [subjectsRes, modulesRes, teachersRes] = await Promise.all([
                fetch(`/api/class-assignments?classId=${classId}`),
                fetch('/api/teacher-class-assignments'),
                fetch('/api/teachers')
            ])

            const assignments = []
            let allTeachers = []

            // Get all teachers/trainers
            if (teachersRes.ok) {
                allTeachers = await teachersRes.json()
            }

            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                assignments.push(...subjectsData.classSubjects.map((s: any) => ({ ...s, type: 'subject' })))
            }

            if (modulesRes.ok) {
                const modulesData = await modulesRes.json()
                // Filter by classId
                const filteredModules = [
                    ...modulesData.teacherClassSubjects.filter((s: any) => s.classId === classId),
                    ...modulesData.trainerClassModules.filter((m: any) => m.classId === classId)
                ]
                assignments.push(...filteredModules.map((m: any) => ({ ...m, type: m.trainer ? 'module' : 'subject' })))
            }

            setClassDetailsAssignments(assignments)
        } catch (error) {
            console.error('Error fetching class details:', error)
        }
    }

    const handleAssignToClass = (cls: Class) => {
        setSelectedClassForAssignment(cls)
        setAssignmentType('subjects')
        setAssignmentStep('type')
        setSelectedSubjects([])
        setSelectedTrainer('')
        setSelectedModule('')
        setSelectedModules([])
        setSubjectSearch('')
        setTrainerSearch('')
        setModuleSearch('')
        setModuleLevelFilter('')
        setModuleTradeFilter('')
        setSelectedTeacherForSubjects('')
        setShowTeacherSelection(false)
        fetchCurrentAssignments(cls.id)
        setShowAssignmentModal(true)
    }

    const handleClassDetails = (cls: Class) => {
        setSelectedClassForDetails(cls)
        fetchClassDetails(cls.id)
        setShowClassDetails(true)
    }

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        )
    }

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

    const handleUpdateAssignment = async (assignment: any) => {
        try {
            const teacherId = assignment.trainer?.id || assignment.teacher?.id

            if (!teacherId) {
                alert('Please select a teacher')
                return
            }

            // Delete old assignment
            await fetch(`/api/teacher-class-assignments?id=${assignment.id}`, {
                method: 'DELETE'
            })

            // Create new assignment
            const response = await fetch('/api/teacher-class-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: teacherId,
                    classId: selectedClassForAssignment?.id,
                    [assignment.type === 'module' ? 'moduleId' : 'subjectId']: assignment.module?.id || assignment.subject?.id
                })
            })

            if (response.ok) {
                alert('Assignment updated successfully!')
                setEditingAssignment(null)
                fetchCurrentAssignments(selectedClassForAssignment?.id || '')
                // Refresh class details if open
                if (selectedClassForDetails) {
                    fetchClassDetails(selectedClassForDetails.id)
                }
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update assignment')
            }
        } catch (error) {
            console.error('Error updating assignment:', error)
            alert('An error occurred while updating the assignment')
        }
    }

    const handleDeleteAssignment = async (assignment: any) => {
        if (!confirm(`Are you sure you want to remove this assignment?`)) return

        try {
            const response = await fetch(`/api/teacher-class-assignments?id=${assignment.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert('Assignment removed successfully!')
                fetchCurrentAssignments(selectedClassForAssignment?.id || '')
                // Refresh class details if open
                if (selectedClassForDetails) {
                    fetchClassDetails(selectedClassForDetails.id)
                }
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to remove assignment')
            }
        } catch (error) {
            console.error('Error deleting assignment:', error)
            alert('An error occurred while removing the assignment')
        }
    }

    const getFilteredTrainers = () => {
        return trainers.filter(trainer =>
            trainer.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
            trainer.email.toLowerCase().includes(trainerSearch.toLowerCase())
        )
    }

    const handleCreateAssignments = async () => {
        if (!selectedClassForAssignment) return

        try {
            if (assignmentType === 'subjects') {
                if (selectedSubjects.length === 0) return

                const assignments = selectedSubjects.map(subjectId => ({
                    classId: selectedClassForAssignment.id,
                    subjectId: subjectId
                }))

                const responses = await Promise.allSettled(
                    assignments.map(assignment =>
                        fetch('/api/class-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(assignment)
                        })
                    )
                )

                const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length
                const failed = responses.length - successful

                // Automatically create teacher-subject assignments if teacher is selected
                if (successful > 0 && selectedTeacherForSubjects) {
                    try {
                        const teacherSubjectAssignments = selectedSubjects.map(subjectId => ({
                            type: 'teacher-subject',
                            teacherId: selectedTeacherForSubjects,
                            subjectId: subjectId
                        }))

                        const assignmentResponses = await Promise.allSettled(
                            teacherSubjectAssignments.map(assignment =>
                                fetch('/api/assignments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(assignment)
                                })
                            )
                        )

                        const assignmentSuccessful = assignmentResponses.filter(r => r.status === 'fulfilled' && r.value.ok).length
                        if (assignmentSuccessful > 0) {
                            console.log(`Automatically created ${assignmentSuccessful} teacher-subject assignment(s)`)
                        }
                    } catch (assignmentError) {
                        console.warn('Failed to create automatic teacher-subject assignments:', assignmentError)
                    }
                }

                if (successful > 0) {
                    const message = `Successfully assigned ${successful} subject(s) to class.${selectedTeacherForSubjects ? ' Automatic teacher-subject assignments created.' : ''}${failed > 0 ? ` ${failed} failed due to duplicates.` : ''}`
                    alert(message)
                    setShowAssignmentModal(false)
                    setSelectedClassForAssignment(null)
                    setSelectedTeacherForSubjects('')
                    setShowTeacherSelection(false)
                    fetchAllData()
                } else {
                    alert('All assignments failed. They may already exist.')
                }
            } else {
                if (!selectedTrainer || selectedModules.length === 0) return

                const assignments = selectedModules.map(moduleId => ({
                    teacherId: selectedTrainer,
                    classId: selectedClassForAssignment.id,
                    moduleId: moduleId
                }))

                const responses = await Promise.allSettled(
                    assignments.map(assignment =>
                        fetch('/api/teacher-class-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(assignment)
                        })
                    )
                )

                const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length
                const failed = responses.length - successful

                // Automatically create trainer-module assignments
                if (successful > 0) {
                    try {
                        const trainerModuleAssignments = selectedModules.map(moduleId => ({
                            type: 'trainer-module',
                            trainerId: selectedTrainer,
                            moduleId: moduleId
                        }))

                        const assignmentResponses = await Promise.allSettled(
                            trainerModuleAssignments.map(assignment =>
                                fetch('/api/assignments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(assignment)
                                })
                            )
                        )

                        const assignmentSuccessful = assignmentResponses.filter(r => r.status === 'fulfilled' && r.value.ok).length
                        if (assignmentSuccessful > 0) {
                            console.log(`Automatically created ${assignmentSuccessful} trainer-module assignment(s)`)
                        }
                    } catch (assignmentError) {
                        console.warn('Failed to create automatic trainer-module assignments:', assignmentError)
                    }
                }

                if (successful > 0) {
                    const message = `Successfully assigned ${successful} module(s) to trainer.${failed > 0 ? ` ${failed} failed due to duplicates.` : ''} Automatic trainer-module assignments created.`
                    alert(message)
                    setShowAssignmentModal(false)
                    setSelectedClassForAssignment(null)
                    fetchAllData()
                } else {
                    alert('All assignments failed. They may already exist.')
                }
            }
        } catch (error) {
            console.error('Assignment creation error:', error)
            alert('An error occurred while creating assignments')
        }
    }

    const getFilteredSubjects = () => {
        return subjects.filter(subject =>
            subject.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
            subject.code.toLowerCase().includes(subjectSearch.toLowerCase())
        )
    }

    const getFilteredModules = () => {
        return modules.filter(module => {
            const matchesSearch = module.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                                module.code.toLowerCase().includes(moduleSearch.toLowerCase())
            const matchesLevel = !moduleLevelFilter || module.level === moduleLevelFilter
            const matchesTrade = !moduleTradeFilter || module.trade === moduleTradeFilter

            return matchesSearch && matchesLevel && matchesTrade
        })
    }

    const getUniqueTrades = () => {
        return Array.from(new Set(modules.map(m => m.trade).filter(Boolean)))
    }

    const handleEditClass = (cls: Class) => {
        setEditingClass(cls)
        setNewClass({
            level: cls.level,
            stream: cls.stream || ''
        })
        setShowEditModal(true)
    }

    const updateClass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingClass) return

        try {
            const classData = {
                name: `${newClass.level}${newClass.stream}`,
                level: newClass.level,
                stream: newClass.stream
            }

            const response = await fetch(`/api/classes?id=${editingClass.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData),
            })

            const data = await response.json()

            if (response.ok) {
                alert('Class updated successfully!')
                setShowEditModal(false)
                setEditingClass(null)
                setNewClass({ level: '', stream: '' })
                fetchAllData()
            } else {
                alert('Failed to update class: ' + data.error)
            }
        } catch (error) {
            console.error('Error updating class:', error)
            alert('An error occurred while updating the class.')
        }
    }

    const deleteClass = async (classId: string, className: string) => {
        if (!confirm(`Are you sure you want to delete the class "${className}"? This will also delete all associated assignments and timetables. This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/classes?id=${classId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('Class deleted successfully!')
                fetchAllData()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete class')
            }
        } catch (error) {
            console.error('Class deletion error:', error)
            alert('An error occurred while deleting the class')
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
                {/* Header */}
                <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin"
                                className="flex items-center text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Back to Dashboard
                            </Link>
                            <div className="border-l border-gray-300 h-6"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manage Classes</h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - {session.user.schoolType}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Welcome, {session.user.name}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Action Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Class Management</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Add and manage classes for your school
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add New Class</span>
                                </button>
                                <Link
                                    href="/dashboard/school-admin/classes/create"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Classes</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Class Statistics
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary-600">
                                        {classes.length}
                                    </div>
                                    <div className="text-sm text-gray-500">Total Classes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {classes.reduce((sum, cls) => sum + cls._count.subjects, 0)}
                                    </div>
                                    <div className="text-sm text-gray-500">Total Subjects Assigned</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600">
                                        {classes.reduce((sum, cls) => sum + cls._count.trainerClassModules, 0)}
                                    </div>
                                    <div className="text-sm text-gray-500">Total Modules Assigned</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {classes.reduce((sum, cls) => sum + cls._count.timetables, 0)}
                                    </div>
                                    <div className="text-sm text-gray-500">Timetable Entries</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classes Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Classes List
                            </h3>

                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search classes by name, level, or stream..."
                                        value={classSearchTerm}
                                        onChange={(e) => setClassSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {classes.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No classes added yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Classes will appear here once they are added to the system.
                                    </p>
                                </div>
                            ) : filteredClasses.length === 0 ? (
                                <div className="text-center py-8">
                                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        No classes match your search criteria. Try adjusting your search.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Class
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Assign Subjects/Modules
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Edit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredClasses.map((cls) => (
                                                <tr key={cls.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <BookOpen className="h-5 w-5 text-green-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => handleClassDetails(cls)}>
                                                                    {cls.name}
                                                                </div>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                        {cls.level}
                                                                    </span>
                                                                    {cls.stream && (
                                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                            {cls.stream}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {cls.level.startsWith('L') ? cls._count.trainerClassModules : cls._count.subjects} {cls.level.startsWith('L') ? 'modules' : 'subjects'} • {cls._count.timetables} timetables
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleAssignToClass(cls)}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Assign
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedClassForAssignment(cls)
                                                                    fetchCurrentAssignments(cls.id)
                                                                    setShowEditAssignments(true)
                                                                }}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="View/Edit Assignments"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditClass(cls)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="Edit Class"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => deleteClass(cls.id, cls.name)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete Class"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
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

                    {/* Empty State */}
                    {classes.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes added yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by adding your first class.
                            </p>
                            <div className="mt-6 flex space-x-3 justify-center">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Class
                                </button>
                                <Link
                                    href="/dashboard/school-admin/classes/create"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Classes
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Add New Class</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={addClass} className="space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newClass.level}
                                    onChange={(e) => setNewClass({...newClass, level: e.target.value})}
                                    placeholder="e.g., P1, S1, L3, U3"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the level (e.g., P1 for Primary 1, S1 for Secondary 1, L3 for Lower 3)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stream *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newClass.stream}
                                    onChange={(e) => setNewClass({...newClass, stream: e.target.value})}
                                    placeholder="e.g., A, B, C, ELTA"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the stream (e.g., A, B, C for regular streams, ELTA, ELTB for special streams)
                                </p>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 transition-colors font-medium"
                                >
                                    Add Class
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Class Modal */}
            {showEditModal && editingClass && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Edit Class</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={updateClass} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newClass.level}
                                    onChange={(e) => setNewClass({...newClass, level: e.target.value})}
                                    placeholder="e.g., P1, S1, L3, U3"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the level (e.g., P1 for Primary 1, S1 for Secondary 1, L3 for Lower 3)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stream *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newClass.stream}
                                    onChange={(e) => setNewClass({...newClass, stream: e.target.value})}
                                    placeholder="e.g., A, B, C, ELTA"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the stream (e.g., A, B, C for regular streams, ELTA, ELTB for special streams)
                                </p>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Update Class
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignmentModal && selectedClassForAssignment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">
                                Assign to {selectedClassForAssignment.name}
                            </h3>
                            <button onClick={() => setShowAssignmentModal(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center mb-6">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${assignmentStep === 'type' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                1
                            </div>
                            <span className="ml-2 text-sm font-medium">Type</span>
                            <div className={`flex-1 h-1 mx-4 ${assignmentStep !== 'type' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${assignmentStep === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                2
                            </div>
                            <span className="ml-2 text-sm font-medium">Items</span>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1: Assignment Type */}
                            {assignmentStep === 'type' && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">What would you like to assign?</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="assignmentType"
                                                value="subjects"
                                                checked={assignmentType === 'subjects'}
                                                onChange={(e) => setAssignmentType(e.target.value as 'subjects')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Subjects - Assign academic subjects to the class
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="assignmentType"
                                                value="modules"
                                                checked={assignmentType === 'modules'}
                                                onChange={(e) => setAssignmentType(e.target.value as 'modules')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-3 block text-sm font-medium text-gray-700">
                                                Modules - Assign TSS modules to trainers for the class
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}



                            {/* Step 3: Item Selection */}
                            {assignmentStep === 'items' && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                                        Select {assignmentType === 'subjects' ? 'Subjects' : 'Module & Trainer'}
                                    </h4>

                                    {assignmentType === 'subjects' ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">Select Subjects</label>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedSubjects(getFilteredSubjects().map(s => s.id))}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedSubjects([])}
                                                        className="text-xs text-gray-600 hover:text-gray-800"
                                                    >
                                                        Deselect All
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Search subjects..."
                                                    value={subjectSearch}
                                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                                                {getFilteredSubjects().length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500">
                                                        No subjects found matching the search.
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-gray-200">
                                                        {getFilteredSubjects().map(subject => (
                                                            <label key={subject.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                                                                <div className="flex items-center h-5">
                                                                    {selectedSubjects.includes(subject.id) ? (
                                                                        <CheckSquare className="h-5 w-5 text-blue-600" />
                                                                    ) : (
                                                                        <Square className="h-5 w-5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="ml-3 flex-1">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {subject.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        Code: {subject.code} • Level: {subject.level}
                                                                    </div>
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSubjects.includes(subject.id)}
                                                                    onChange={() => handleSubjectToggle(subject.id)}
                                                                    className="sr-only"
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600">
                                                {selectedSubjects.length} of {getFilteredSubjects().length} subjects selected
                                            </div>

                                            {/* Teacher Selection for Automatic Assignment */}
                                            <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Teacher Assignment (Optional)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTeacherSelection(!showTeacherSelection)}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        {showTeacherSelection ? 'Hide' : 'Show'} Teacher Selection
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-3">
                                                    Select a teacher to automatically create teacher-subject assignments that will appear in the Assignments dashboard.
                                                </p>
                                                
                                                {showTeacherSelection && (
                                                    <div>
                                                        <div className="relative mb-3">
                                                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search teachers..."
                                                                value={trainerSearch}
                                                                onChange={(e) => setTrainerSearch(e.target.value)}
                                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <select
                                                            value={selectedTeacherForSubjects}
                                                            onChange={(e) => setSelectedTeacherForSubjects(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">Choose a teacher for automatic assignment...</option>
                                                            {getFilteredTrainers().map(trainer => (
                                                                <option key={trainer.id} value={trainer.id}>
                                                                    {trainer.name} ({trainer.email})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher Name</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search teachers..."
                                                        value={trainerSearch}
                                                        onChange={(e) => setTrainerSearch(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    />
                                                </div>
                                                <select
                                                    value={selectedTrainer}
                                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                >
                                                    <option value="">Choose a teacher...</option>
                                                    {getFilteredTrainers().map(trainer => (
                                                        <option key={trainer.id} value={trainer.id}>
                                                            {trainer.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Select Modules</label>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleSelectAllModules}
                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                            {selectedModules.length === getFilteredModules().length ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Module Filters */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Search modules..."
                                                            value={moduleSearch}
                                                            onChange={(e) => setModuleSearch(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <select
                                                            value={moduleLevelFilter}
                                                            onChange={(e) => setModuleLevelFilter(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        >
                                                            <option value="">All Levels</option>
                                                            <option value="L3">L3</option>
                                                            <option value="L4">L4</option>
                                                            <option value="L5">L5</option>
                                                            <option value="SECONDARY">SECONDARY</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <select
                                                            value={moduleTradeFilter}
                                                            onChange={(e) => setModuleTradeFilter(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        >
                                                            <option value="">All Trades</option>
                                                            {getUniqueTrades().map(trade => (
                                                                <option key={trade} value={trade}>{trade}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Module List */}
                                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                                                    {getFilteredModules().length === 0 ? (
                                                        <div className="p-4 text-center text-gray-500">
                                                            No modules found matching the filters.
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-200">
                                                            {getFilteredModules().map(module => (
                                                                <label key={module.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                                                                    <div className="flex items-center h-5">
                                                                        {selectedModules.includes(module.id) ? (
                                                                            <CheckSquare className="h-5 w-5 text-green-600" />
                                                                        ) : (
                                                                            <Square className="h-5 w-5 text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-3 flex-1">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {module.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            Code: {module.code} • Level: {module.level}
                                                                            {module.trade && ` • Trade: ${module.trade}`}
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
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-6 pt-6 border-t">
                            <button
                                onClick={() => setAssignmentStep('type')}
                                disabled={assignmentStep === 'type'}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>

                                {assignmentStep === 'items' ? (
                                    <button
                                        onClick={handleCreateAssignments}
                                        disabled={
                                            assignmentType === 'subjects'
                                                ? selectedSubjects.length === 0
                                                : !selectedTrainer || selectedModules.length === 0
                                        }
                                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Assign {assignmentType === 'subjects' ? `${selectedSubjects.length} Subject${selectedSubjects.length !== 1 ? 's' : ''}` : `${selectedModules.length} Module${selectedModules.length !== 1 ? 's' : ''}`}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setAssignmentStep('items')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Assignments Modal */}
            {showEditAssignments && selectedClassForAssignment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">
                                Edit Assignments for {selectedClassForAssignment.name}
                            </h3>
                            <button onClick={() => setShowEditAssignments(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h4>

                                    {currentAssignments.length === 0 ? (
                                        <p className="text-gray-500">No assignments found for this class.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Item
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Current Teacher
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentAssignments.map((assignment) => (
                                                        <tr key={assignment.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    assignment.type === 'module' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {assignment.type === 'module' ? 'Module' : 'Subject'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {assignment.module?.name || assignment.subject?.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {assignment.module?.code || assignment.subject?.code}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {assignment.trainer?.name || assignment.teacher?.name || 'Not Assigned'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <button
                                                                    onClick={() => setEditingAssignment(assignment)}
                                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                                >
                                                                    Edit Teacher
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAssignment(assignment)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 pt-6 border-t">
                            <button
                                onClick={() => setShowEditAssignments(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {editingAssignment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">
                                Change Teacher for {editingAssignment.module?.name || editingAssignment.subject?.name}
                            </h3>
                            <button
                                onClick={() => setEditingAssignment(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select New Teacher
                                </label>
                                <select
                                    value={editingAssignment.trainer?.id || editingAssignment.teacher?.id || ''}
                                    onChange={(e) => {
                                        const selectedTeacher = trainers.find(t => t.id === e.target.value)
                                        setEditingAssignment({
                                            ...editingAssignment,
                                            trainer: selectedTeacher,
                                            teacher: selectedTeacher
                                        })
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select teacher...</option>
                                    {trainers.map(trainer => (
                                        <option key={trainer.id} value={trainer.id}>
                                            {trainer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={() => handleUpdateAssignment(editingAssignment)}
                                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Update Assignment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingAssignment(null)
                                        // Reopen class details if it was open
                                        if (selectedClassForDetails) {
                                            setShowClassDetails(true)
                                        }
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Class Details Modal */}
            {showClassDetails && selectedClassForDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium text-gray-900">
                                Class Details: {selectedClassForDetails.name}
                            </h3>
                            <button onClick={() => setShowClassDetails(false)}>
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Class Information */}
                                <div className="bg-white shadow rounded-lg overflow-hidden">
                                    <div className="px-4 py-5 sm:p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Class Information</h4>
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Class Name</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{selectedClassForDetails.name}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Level</dt>
                                                <dd className="mt-1">
                                                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {selectedClassForDetails.level}
                                                    </span>
                                                </dd>
                                            </div>
                                            {selectedClassForDetails.stream && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Stream</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{selectedClassForDetails.stream}</dd>
                                                </div>
                                            )}
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Total Subjects/Modules</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {selectedClassForDetails.level.startsWith('L') 
                                                        ? selectedClassForDetails._count.trainerClassModules 
                                                        : selectedClassForDetails._count.subjects}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="bg-white shadow rounded-lg overflow-hidden">
                                    <div className="px-4 py-5 sm:p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Statistics</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {selectedClassForDetails.level.startsWith('L') ? selectedClassForDetails._count.trainerClassModules : selectedClassForDetails._count.subjects}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {selectedClassForDetails.level.startsWith('L') ? 'Modules' : 'Subjects'}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {selectedClassForDetails._count.timetables}
                                                </div>
                                                <div className="text-xs text-gray-500">Timetables</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments Table */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                                        Teachers/Modules & Subjects ({classDetailsAssignments.length})
                                    </h4>

                                    {classDetailsAssignments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                This class doesn't have any subjects or modules assigned yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Subject/Module
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Teacher/Trainer
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Level
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {classDetailsAssignments.map((assignment, index) => (
                                                        <tr key={assignment.id || index}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    assignment.type === 'module' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {assignment.type === 'module' ? 'Module' : 'Subject'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {assignment.module?.name || assignment.subject?.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Code: {assignment.module?.code || assignment.subject?.code}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {assignment.trainer?.name || assignment.teacher?.name || 'Not Assigned'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {assignment.trainer?.email || assignment.teacher?.email || ''}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                    {selectedClassForDetails.level}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingAssignment(assignment)
                                                                        setShowClassDetails(false)
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                                >
                                                                    Change Teacher
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAssignment(assignment)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 pt-6 border-t">
                            <button
                                onClick={() => setShowClassDetails(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    )
}