'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, LogOut, ArrowLeft, Save, X, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const MODULE_LEVELS = ['L3', 'L4', 'L5', 'SECONDARY']
const MODULE_CATEGORIES = [
    { value: 'SPECIFIC', label: 'Specific', description: 'Technical specialization modules' },
    { value: 'GENERAL', label: 'General', description: 'General education modules' },
    { value: 'COMPLEMENTARY', label: 'Complementary', description: 'Supporting skill modules' }
]

export default function CreateModule() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('single')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        level: '',
        trade: '',
        totalHours: 4,
        category: ''
    })

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/modules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                alert('Module created successfully!')
                router.push('/dashboard/school-admin/modules')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create module')
            }
        } catch (error) {
            console.error('Module creation error:', error)
            alert('An error occurred while creating the module')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getCategoryDescription = (category: string) => {
        const cat = MODULE_CATEGORIES.find(c => c.value === category)
        return cat?.description || ''
    }

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/bulk-upload/templates/modules')
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'modules_template.csv'
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
        uploadFormData.append('type', 'modules')

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
                                href="/dashboard/school-admin/modules"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Modules</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <BookOpen className="h-8 w-8" />
                                    <span>Create TSS Module</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Add a new Technical & Skills School module
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
            <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200 mb-6">
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
                                            <BookOpen className="h-4 w-4" />
                                            <span>Create Single Module</span>
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
                                            <span>Upload Modules</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>

                            {/* Single Module Form */}
                            {activeTab === 'single' && (
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
                                                    {level}
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
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Create Module
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Bulk Upload Section */}
                            {activeTab === 'bulk' && (
                                <div className="space-y-6">
                                    {/* Template Download */}
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
                                                <div>
                                                    <h3 className="text-sm font-medium text-purple-900">Module Template</h3>
                                                    <p className="text-sm text-purple-700">Download CSV template with required fields</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={downloadTemplate}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download Template
                                            </button>
                                        </div>
                                        <div className="mt-3 text-xs text-purple-600">
                                            <strong>Template Fields:</strong> Name, Code, Level, Trade, Total Periods per Week, Category
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <div className="space-y-2">
                                            <label htmlFor="module-file-upload" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Upload CSV file with modules
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-500">
                                                    or drag and drop your CSV file here
                                                </span>
                                            </label>
                                            <input
                                                id="module-file-upload"
                                                name="module-file-upload"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="sr-only"
                                            />
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('module-file-upload')?.click()}
                                                    disabled={isUploading}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
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
                                            <li>2. Fill in your module data following the column headers</li>
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
                                                                Processed {uploadResult.processed} module{uploadResult.processed !== 1 ? 's' : ''}
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
                </div>
            </main>
        </div>
    )
}