'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GraduationCap, LogOut, ArrowLeft, Save, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CreateClass() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('single')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)
    const [formData, setFormData] = useState({
        level: '',
        stream: ''
    })

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const classData = {
                name: `${formData.level}${formData.stream}`,
                level: formData.level,
                stream: formData.stream
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
                alert('Class created successfully!')
                router.push('/dashboard/school-admin/add-classes')
            } else {
                alert('Failed to create class: ' + data.error)
            }
        } catch (error) {
            console.error('Class creation error:', error)
            alert('An error occurred while creating the class')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/bulk-upload/templates/classes')
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'classes_template.csv'
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
        uploadFormData.append('type', 'classes')

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
                                href="/dashboard/school-admin/add-classes"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Classes</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                    <GraduationCap className="h-8 w-8" />
                                    <span>Create New Class</span>
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
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Create Single Class</span>
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
                                            <span>Upload Classes</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>

                            {/* Single Class Form */}
                            {activeTab === 'single' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                            Level *
                                        </label>
                                        <input
                                            type="text"
                                            name="level"
                                            id="level"
                                            required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., P1, S1, L3, U3"
                                            value={formData.level}
                                            onChange={handleChange}
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Enter the level (e.g., P1 for Primary 1, S1 for Secondary 1, L3 for Lower 3)
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="stream" className="block text-sm font-medium text-gray-700">
                                            Stream *
                                        </label>
                                        <input
                                            type="text"
                                            name="stream"
                                            id="stream"
                                            required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., A, B, C, ELTA"
                                            value={formData.stream}
                                            onChange={handleChange}
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Enter the stream (e.g., A, B, C for regular streams, ELTA, ELTB for special streams)
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    {formData.level && formData.stream && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Class Preview</h3>
                                            <div className="text-sm text-gray-600">
                                                <div><strong>Name:</strong> {formData.level}{formData.stream}</div>
                                                <div><strong>Level:</strong> {formData.level}</div>
                                                <div><strong>Stream:</strong> {formData.stream}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <Link
                                            href="/dashboard/school-admin/add-classes"
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
                                                    Create Class
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
                                                    <h3 className="text-sm font-medium text-blue-900">Class Template</h3>
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
                                            <strong>Template Fields:</strong> Level, Stream
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <div className="space-y-2">
                                            <label htmlFor="class-file-upload" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Upload CSV file with classes
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-500">
                                                    or drag and drop your CSV file here
                                                </span>
                                            </label>
                                            <input
                                                id="class-file-upload"
                                                name="class-file-upload"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="sr-only"
                                            />
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('class-file-upload')?.click()}
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
                                            <li>2. Fill in your class data following the column headers</li>
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
                                                                Processed {uploadResult.processed} class{uploadResult.processed !== 1 ? 'es' : ''}
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