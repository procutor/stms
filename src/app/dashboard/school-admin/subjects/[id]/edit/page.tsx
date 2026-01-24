'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, LogOut, ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

const SUBJECT_LEVELS = ['L3', 'L4', 'L5', 'SECONDARY']

interface Subject {
    id: string
    name: string
    code: string
    level: string
    periodsPerWeek: number
}

export default function EditSubject() {
    const { data: session, status } = useSession()
    const params = useParams()
    const navigate = useRouter()
    const subjectId = params!.id as string
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        level: '',
        periodsPerWeek: 1
    })

    useEffect(() => {
        if (session?.user && subjectId) {
            fetchSubject()
        }
    }, [session, subjectId])

    const fetchSubject = async () => {
        try {
            const response = await fetch(`/api/subjects/${subjectId}`)
            if (response.ok) {
                const subject = await response.json()
                setFormData({
                    name: subject.name,
                    code: subject.code,
                    level: subject.level,
                    periodsPerWeek: subject.periodsPerWeek
                })
            }
        } catch (error) {
            console.error('Error fetching subject:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/subjects/${subjectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                navigate.push('/dashboard/school-admin/subjects')
            } else {
                alert('Failed to update subject')
            }
        } catch (error) {
            console.error('Error updating subject:', error)
            alert('Error updating subject')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLogout = async () => {
        await signOut({ redirect: false })
        navigate.push('/auth/signin')
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
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Sidebar */}
            <SchoolAdminSidebar />

            {/* Main Content */}
            <div className="ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard/school-admin/subjects"
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                                        <BookOpen className="h-8 w-8 text-blue-600" />
                                        <span>Edit Subject</span>
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        Update subject information
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                Subject Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter subject name"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                                Subject Code *
                                            </label>
                                            <input
                                                type="text"
                                                id="code"
                                                required
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter subject code"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                                Level *
                                            </label>
                                            <select
                                                id="level"
                                                required
                                                value={formData.level}
                                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Select level</option>
                                                {SUBJECT_LEVELS.map(level => (
                                                    <option key={level} value={level}>
                                                        {level}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="periodsPerWeek" className="block text-sm font-medium text-gray-700">
                                                Periods Per Week *
                                            </label>
                                            <input
                                                type="number"
                                                id="periodsPerWeek"
                                                required
                                                min="1"
                                                max="10"
                                                value={formData.periodsPerWeek}
                                                onChange={(e) => setFormData({ ...formData, periodsPerWeek: parseInt(e.target.value) })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <Link
                                            href="/dashboard/school-admin/subjects"
                                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}