'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Upload, 
  LogOut, 
  ArrowLeft, 
  Download,
  FileSpreadsheet,
  BookOpen,
  Users,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'

interface UploadResult {
  success: boolean
  message: string
  processed: number
  errors?: string[]
}

export default function BulkUploadPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [selectedType, setSelectedType] = useState('subjects')
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/auth/signin')
    }

    const downloadTemplate = async (type: string) => {
        try {
            const response = await fetch(`/api/bulk-upload/templates/${type}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${type}_template.csv`
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

        setUploading(true)
        setUploadResult(null)

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', selectedType)

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
            setUploading(false)
            // Clear the file input
            event.target.value = ''
        }
    }

    const getTemplateInfo = (type: string) => {
        switch (type) {
            case 'subjects':
                return {
                    title: 'Subject Template',
                    description: 'Upload multiple subjects at once',
                    fields: ['Name', 'Code', 'Level', 'Periods Per Week'],
                    icon: BookOpen,
                    color: 'blue'
                }
            case 'modules':
                return {
                    title: 'Module Template',
                    description: 'Upload multiple TSS modules at once',
                    fields: ['Name', 'Code', 'Level', 'Trade', 'Total Periods per Week', 'Category'],
                    icon: Wrench,
                    color: 'purple'
                }
            case 'trainer_assignments':
                return {
                    title: 'Trainer Assignment Template',
                    description: 'Upload multiple trainer-module assignments at once',
                    fields: ['Trainer Email', 'Module Code', 'Level', 'Trade (Optional)'],
                    icon: Users,
                    color: 'green'
                }
            case 'classes':
                return {
                    title: 'Class Template',
                    description: 'Upload multiple classes at once',
                    fields: ['Level', 'Stream'],
                    icon: GraduationCap,
                    color: 'indigo'
                }
            case 'teachers':
                return {
                    title: 'Teacher Template',
                    description: 'Upload multiple teachers at once',
                    fields: ['Name', 'Email'],
                    icon: UserCheck,
                    color: 'emerald'
                }
            default:
                return {
                    title: 'Unknown Template',
                    description: '',
                    fields: [],
                    icon: FileSpreadsheet,
                    color: 'gray'
                }
        }
    }

    const templateInfo = getTemplateInfo(selectedType)
    const IconComponent = templateInfo.icon

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
                                    <Upload className="h-8 w-8" />
                                    <span>Bulk Upload</span>
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {session.user.schoolName} - Upload data using CSV templates
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
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    
                    {/* Upload Type Selection */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Select Upload Type</h2>
                            <p className="text-sm text-gray-600 mt-1">Choose what type of data you want to upload</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                {[
                                    { id: 'subjects', label: 'Subjects', icon: BookOpen, color: 'blue' },
                                    { id: 'modules', label: 'Modules', icon: Wrench, color: 'purple' },
                                    { id: 'trainer_assignments', label: 'Trainer Assignments', icon: Users, color: 'green' },
                                    { id: 'classes', label: 'Classes', icon: GraduationCap, color: 'indigo' },
                                    { id: 'teachers', label: 'Teachers', icon: UserCheck, color: 'emerald' }
                                ].map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id)}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                selectedType === type.id
                                                    ? `border-${type.color}-500 bg-${type.color}-50`
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className={`h-8 w-8 mx-auto mb-2 ${
                                                selectedType === type.id ? `text-${type.color}-600` : 'text-gray-400'
                                            }`} />
                                            <h3 className={`font-medium ${
                                                selectedType === type.id ? `text-${type.color}-900` : 'text-gray-900'
                                            }`}>
                                                {type.label}
                                            </h3>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Template Info and Download */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <IconComponent className={`h-6 w-6 text-${templateInfo.color}-600`} />
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900">{templateInfo.title}</h2>
                                        <p className="text-sm text-gray-600">{templateInfo.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadTemplate(selectedType)}
                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-${templateInfo.color}-600 hover:bg-${templateInfo.color}-700`}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Template Fields:</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {templateInfo.fields.map((field, index) => (
                                        <div key={index} className="text-sm text-gray-700">
                                            <span className="font-medium">{field}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium mb-1">Instructions:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Download the CSV template first</li>
                                            <li>Fill in your data following the column headers</li>
                                            <li>Save the file as CSV format</li>
                                            <li>Upload the completed file below</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Upload File</h2>
                            <p className="text-sm text-gray-600 mt-1">Upload your completed CSV file</p>
                        </div>
                        <div className="p-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <div className="space-y-2">
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                            Choose CSV file to upload
                                        </span>
                                        <span className="mt-1 block text-sm text-gray-500">
                                            or drag and drop your CSV file here
                                        </span>
                                    </label>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="sr-only"
                                    />
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            disabled={uploading}
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-${templateInfo.color}-600 hover:bg-${templateInfo.color}-700 disabled:opacity-50`}
                                        >
                                            {uploading ? (
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
                        </div>
                    </div>

                    {/* Upload Results */}
                    {uploadResult && (
                        <div className={`mt-6 rounded-lg border p-4 ${
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
                                                Processed {uploadResult.processed} record{uploadResult.processed !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-medium">Errors:</p>
                                                <ul className="list-disc list-inside mt-1">
                                                    {uploadResult.errors.map((error, index) => (
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
            </main>
        </div>
    )
}