'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, LogOut, ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'

const MODULE_LEVELS = ['L3', 'L4', 'L5', 'SECONDARY']
const MODULE_CATEGORIES = [
    { value: 'SPECIFIC', label: 'Specific', description: 'Technical specialization modules' },
    { value: 'GENERAL', label: 'General', description: 'General education modules' },
    { value: 'COMPLEMENTARY', label: 'Complementary', description: 'Supporting skill modules' }
]

interface Module {
    id: string
    name: string
    code: string
    level: string
    trade?: string
    totalHours: number
    category: string
}

export default function EditModule() {
    const { data: session, status } = useSession()
    const router = useParams()
    const navigate = useRouter()
    const moduleId = router.id as string
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        level: '',
        trade: '',
        totalHours: 4,
        category: ''
    })

    useEffect(() => {
        if (session?.user && moduleId) {
            fetchModule()
        }
    }, [session, moduleId])

    const fetchModule = async () => {
        try {
            const response = await fetch(`/api/modules/${moduleId}`)
            if (response.ok) {
                const module = await response.json()
                setFormData({
                    name: module.name,
                    code: module.code,
                    level: module.level,
                    trade: module.trade || '',
                    totalHours: module.totalHours,
                    category: module.category
                })
            } else {
                alert('Module not found')
                navigate.push('/dashboard/school-admin/modules')
            }
        } catch (error) {
            console.error('Error fetching module:', error)
            alert('Error loading module')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        navigate.push('/auth/signin')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/modules?id=${moduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                alert('Module updated successfully!')
                navigate.push('/dashboard/school-admin/modules')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update module')
            }
        } catch (error) {
            console.error('Module update error:', error)
            alert('An error occurred while updating the module')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getCategoryDescription = (category: string) => {
        const cat = MODULE_CATEGORIES.find(c => c.value === category)
        return cat?.description || ''
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
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard/school-admin/modules"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Modules</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <BookOpen className="h-8 w-8" />
                                    <span>Edit TSS Module</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Update module details
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
            <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Module Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Electrical Installation, Plumbing, Carpentry"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Module Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., ELEC101, PLUMB201"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Level
                                        </label>
                                        <select
                                            value={formData.level}
                                            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Select level</option>
                                            {MODULE_LEVELS.map(level => (
                                                <option key={level} value={level}>
                                                    {level} {level === 'SECONDARY' ? '(Secondary School)' : '(TSS Level)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trade
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.trade}
                                            onChange={(e) => setFormData(prev => ({ ...prev, trade: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Electrical, Plumbing, Carpentry"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Optional: Specify the trade or specialization
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Total Periods per Week
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="40"
                                            value={formData.totalHours}
                                            onChange={(e) => setFormData(prev => ({ ...prev, totalHours: parseInt(e.target.value) }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            How many periods per week students spend on this module
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <div className="space-y-3">
                                            {MODULE_CATEGORIES.map(category => (
                                                <label key={category.value} className="flex items-start">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        value={category.value}
                                                        checked={formData.category === category.value}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        required
                                                    />
                                                    <div className="ml-3">
                                                        <span className="block text-sm font-medium text-gray-900">
                                                            {category.label}
                                                        </span>
                                                        <span className="block text-sm text-gray-500">
                                                            {category.description}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                {formData.name && formData.code && formData.level && formData.category && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Module Preview</h3>
                                        <div className="text-sm text-gray-600">
                                            <div><strong>Name:</strong> {formData.name}</div>
                                            <div><strong>Code:</strong> {formData.code}</div>
                                            <div><strong>Level:</strong> {formData.level}</div>
                                            {formData.trade && <div><strong>Trade:</strong> {formData.trade}</div>}
                                            <div><strong>Category:</strong> {MODULE_CATEGORIES.find(c => c.value === formData.category)?.label}</div>
                                            <div><strong>Periods/Week:</strong> {formData.totalHours}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <Link
                                        href="/dashboard/school-admin/modules"
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Update Module
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}