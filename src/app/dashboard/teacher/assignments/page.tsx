'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { ArrowLeft, User, BookOpen, Users, Calendar, Settings, Download } from 'lucide-react'
import Link from 'next/link'
import { exportTeacherAssignmentsToPDF, TeacherAssignmentsData } from '@/lib/pdf-export'

interface Assignment {
  id: string
  type: string
  name: string
  code?: string
  level?: string
  assignedClasses: Array<{
    id: string
    name: string
    level: string
  }>
}



export default function TeacherAssignments() {
  const { data: session, status } = useSession()
  const [assignmentsData, setAssignmentsData] = useState<TeacherAssignmentsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && (session.user.role === 'TEACHER' || session.user.role === 'TRAINER')) {
      fetchAssignments()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignmentsData(data)
        setError(null)
      } else {
        setError('Failed to load assignments')
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setError('Error loading assignments data')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'TRAINER')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Access denied. Teacher/Trainer role required.</div>
      </div>
    )
  }

  const assignments = assignmentsData?.assignments || { subjects: [], modules: [], classAssignments: [] }
  const statistics = assignmentsData?.statistics || { totalSubjects: 0, totalModules: 0, totalClassAssignments: 0, uniqueClasses: 0 }

  const exportAssignmentsPDF = async () => {
    if (!assignmentsData) return
    
    try {
      await exportTeacherAssignmentsToPDF(assignmentsData, {
        title: 'Teacher Assignments Report',
        teacherName: session.user.name || 'Teacher',
        schoolName: 'Your School Name', // You can make this dynamic
        fileName: `assignments_${session.user.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      })
    } catch (error) {
      console.error('Error exporting assignments PDF:', error)
      alert('Failed to export assignments PDF. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/teacher"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                    <User className="h-8 w-8 text-white" />
                    <span>My Assignments</span>
                  </h1>
                  <p className="text-sm text-gray-300">
                    {session.user.name} - Your subject and class assignments
                  </p>
                </div>
                <button
                  onClick={exportAssignmentsPDF}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={!assignmentsData || (!assignments.subjects.length && !assignments.modules.length)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Subjects
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics.totalSubjects || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Classes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics.uniqueClasses || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Assignments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics.totalClassAssignments || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {assignments.subjects && assignments.subjects.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Subject Assignments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.subjects.map((subject) => (
                    <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{subject.name}</h4>
                      {subject.code && (
                        <div className="text-xs text-gray-500 mb-2">{subject.code}</div>
                      )}
                      <div className="text-xs text-gray-600 mb-2">
                        Level: {subject.level || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Classes: {subject.assignedClasses.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {assignments.modules && assignments.modules.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Module Assignments (TSS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{module.name}</h4>
                      {module.code && (
                        <div className="text-xs text-gray-500 mb-2">{module.code}</div>
                      )}
                      <div className="text-xs text-gray-600 mb-2">
                        Level: {module.level || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Classes: {module.assignedClasses.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!assignments.subjects?.length && !assignments.modules?.length && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No assignments found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any subject or module assignments yet. Contact your administrator to set up your teaching assignments.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/teacher"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  About Your Assignments
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This page shows all your teaching assignments including subjects and modules (for TSS teachers). 
                    Your timetable is automatically generated based on these assignments. 
                    If you need to modify any assignments, please contact your school administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}