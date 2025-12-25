'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, LogOut, ArrowLeft, Save, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CreateSubject() {
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
        periodsPerWeek: 1
    })

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                const result = await response.json()
                alert('Subject created successfully!')
                router.push('/dashboard/school-admin/subjects')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create subject')
            }
        } catch (error) {
            console.error('Subject creation error:', error)
            alert('An error occurred while creating the subject')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'periodsPerWeek' ? parseInt(value) : value
        }))
    }

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/bulk-upload/templates/subjects')
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'subjects_template.csv'
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

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'subjects')

        try {
            const response = await fetch('/api/bulk-upload', {
                method: 'POST',
                body: formData
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
                                href="/dashboard/school-admin/subjects"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Subjects</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <BookOpen className="h-8 w-8" />
                                    <span>Create New Subject</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName}
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
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
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
                                            <span>Create Single Subject</span>
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
                                            <span>Upload Subjects</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>

                            {/* Single Subject Form */}
                            {activeTab === 'single' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Subject Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Mathematics, English, Physics"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                        Subject Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        id="code"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., MATH, ENG, PHY"
                                        value={formData.code}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                        Level *
                                    </label>
                                    <select
                                        name="level"
                                        id="level"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.level}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Level</option>
                                        <option value="P1">P1 (Primary 1)</option>
                                        <option value="P2">P2 (Primary 2)</option>
                                        <option value="P3">P3 (Primary 3)</option>
                                        <option value="P4">P4 (Primary 4)</option>
                                        <option value="P5">P5 (Primary 5)</option>
                                        <option value="P6">P6 (Primary 6)</option>
                                        <option value="S1">S1 (Secondary 1)</option>
                                        <option value="S2">S2 (Secondary 2)</option>
                                        <option value="S3">S3 (Secondary 3)</option>
                                        <option value="S4">S4 (Secondary 4)</option>
                                        <option value="S5">S5 (Secondary 5)</option>
                                        <option value="S6">S6 (Secondary 6)</option>
                                        <option value="L3">L3 (Lower 3)</option>
                                        <option value="U3">U3 (Upper 3)</option>
                                        <option value="U4">U4 (Upper 4)</option>
                                        <option value="U5">U5 (Upper 5)</option>
                                        <option value="U6">U6 (Upper 6)</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        The level determines which classes this subject will be available for.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="periodsPerWeek" className="block text-sm font-medium text-gray-700">
                                        Periods Per Week *
                                    </label>
                                    <input
                                        type="number"
                                        name="periodsPerWeek"
                                        id="periodsPerWeek"
                                        required
                                        min="1"
                                        max="10"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.periodsPerWeek}
                                        onChange={handleChange}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        How many periods per week this subject requires.
                                    </p>
                                </div>

                                {/* Preview */}
                                {formData.name && formData.code && formData.level && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Subject Preview</h3>
                                        <div className="text-sm text-gray-600">
                                            <div><strong>Name:</strong> {formData.name}</div>
                                            <div><strong>Code:</strong> {formData.code}</div>
                                            <div><strong>Level:</strong> {formData.level}</div>
                                            <div><strong>Periods/Week:</strong> {formData.periodsPerWeek}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 p-4 rounded-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <BookOpen className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Level-Based Assignment
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>
                                                    When you assign teachers to this subject, they will automatically be assigned to ALL classes of this level.
                                                    For example, a teacher assigned to "Mathematics (S1)" will teach Math in S1A, S1B, S1C, etc.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                    <div className="flex justify-end space-x-3">
                                        <Link
                                            href="/dashboard/school-admin/subjects"
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Create Subject
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
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                                <div>
                                                    <h3 className="text-sm font-medium text-blue-900">Subject Template</h3>
                                                    <p className="text-sm text-blue-700">Download CSV template with required fields</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={downloadTemplate}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download Template
                                            </button>
                                        </div>
                                        <div className="mt-3 text-xs text-blue-600">
                                            <strong>Template Fields:</strong> Name, Code, Level, Periods Per Week
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <div className="space-y-2">
                                            <label htmlFor="subject-file-upload" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Upload CSV file with subjects
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-500">
                                                    or drag and drop your CSV file here
                                                </span>
                                            </label>
                                            <input
                                                id="subject-file-upload"
                                                name="subject-file-upload"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="sr-only"
                                            />
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('subject-file-upload')?.click()}
                                                    disabled={isUploading}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                                            <li>2. Fill in your subject data following the column headers</li>
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
                                                                Processed {uploadResult.processed} subject{uploadResult.processed !== 1 ? 's' : ''}
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