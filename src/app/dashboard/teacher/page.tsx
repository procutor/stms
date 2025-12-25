'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, User, Clock, BookOpen, Users, LogOut, TrendingUp, AlertCircle, ChevronDown, Settings, Key, Camera, Upload } from 'lucide-react'
import Link from 'next/link'

interface TeacherStatistics {
  totalLessons: number
  todayLessons: number
  uniqueClasses: number
  utilizationPercentage: number
  weeklyGoal: string
  assignments: string
  nextClass: string
}

interface TodayLesson {
  id: string
  period: number
  periodName: string
  startTime: string
  endTime: string
  class: {
    name: string
    level: string
    stream: string
  }
  subject?: {
    name: string
    code: string
  }
  module?: {
    name: string
    code: string
    category: string
  }
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null)
  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([])
  const [timetableStats, setTimetableStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  const formatTime = (timeString: string | Date) => {
    if (!timeString) return '00:00'

    let date: Date

    // If it's already a Date object
    if (timeString instanceof Date) {
      date = timeString
    } else {
      // If it's a string, try to parse it
      // Handle ISO strings like "1970-01-01T08:00:00.000Z"
      if (typeof timeString === 'string' && timeString.includes('T')) {
        // Extract time part from ISO string
        const timePart = timeString.split('T')[1]?.split('.')[0] || timeString
        const [hours, minutes] = timePart.split(':')
        if (hours && minutes) {
          return `${hours}h${minutes}`
        }
      }

      // Try to parse as regular time string like "08:00"
      if (typeof timeString === 'string' && timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':')
        if (hours && minutes) {
          return `${hours}h${minutes}`
        }
      }

      // Try to parse as Date
      try {
        date = new Date(timeString)
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          return `${hours}h${minutes}`
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return '00:00'
  }

  const getLessonStatus = (startTime: string, endTime: string) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    // Parse start time
    const [startHour, startMin] = startTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin

    // Parse end time
    const [endHour, endMin] = endTime.split(':').map(Number)
    const endMinutes = endHour * 60 + endMin

    if (currentTime >= endMinutes) {
      return { status: 'end', color: 'bg-red-100 text-red-800', label: 'Ended' }
    } else if (currentTime >= startMinutes) {
      return { status: 'progress', color: 'bg-green-100 text-green-800', label: 'In Progress' }
    } else {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' }
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchStatistics()
      fetchTodayLessons()
    }
  }, [session])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
        setError(null)
      } else {
        setError('Failed to load statistics')
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
      setError('Error loading dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTodayLessons = async () => {
    try {
      const response = await fetch('/api/teacher/timetable')
      if (response.ok) {
        const data = await response.json()
        // Store timetable statistics
        setTimetableStats(data.statistics)
        // Get today's day name
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        // Filter lessons for today and sort by period
        const todayLessonsData = data.timetables
          .filter((lesson: any) => lesson.day === today && !lesson.isBreak)
          .sort((a: any, b: any) => a.period - b.period)
        setTodayLessons(todayLessonsData)
      }
    } catch (error) {
      console.error('Error fetching today lessons:', error)
    }
  }

  if (status === 'loading') {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center space-x-2 drop-shadow-lg">
                  <User className="h-8 w-8 text-white" />
                  <span>Teacher Dashboard</span>
                </h1>
                <p className="text-sm text-blue-100">
                  Welcome back, {session.user.name}
                </p>
                <p className="text-xs text-blue-200">
                  {session.user.schoolName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors focus:outline-none"
                >
                  {/* Profile Avatar */}
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {session.user.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    {/* Profile Icon Overlay */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-blue-900">
                      <User className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileModal(true)
                        setProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(true)
                        setProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Dashboard Cards - Single Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* My Timetable */}
            <Link
              href="/dashboard/teacher/timetable"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <h3 className="text-sm leading-5 font-medium text-gray-900">
                      My Timetable
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View your weekly schedule
                    </p>
                    {statistics && (
                      <p className="mt-1 text-sm text-blue-600 font-medium">
                        {statistics.totalLessons} lessons
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* My Classes */}
            <Link
              href="/dashboard/teacher/assignments"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <h3 className="text-sm leading-5 font-medium text-gray-900">
                      My Classes
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View assigned classes
                    </p>
                    {statistics && (
                      <p className="mt-1 text-sm text-green-600 font-medium">
                        {statistics.uniqueClasses} classes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>


            {/* Today's Lessons */}
            <div
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => {
                const todayScheduleElement = document.getElementById('today-schedule');
                if (todayScheduleElement) {
                  todayScheduleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <h3 className="text-sm leading-5 font-medium text-gray-900">
                      Today's Lessons
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Lessons today
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-600">
                      {isLoading ? '-' : statistics?.todayLessons || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Lessons */}
            <Link
              href="/dashboard/teacher/timetable"
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <h3 className="text-sm leading-5 font-medium text-gray-900">
                      Weekly Lessons
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Total this week
                    </p>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      {isLoading ? '-' : statistics?.totalLessons || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Classes Assigned */}
            <Link
              href="/dashboard/teacher/assignments"
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <h3 className="text-sm leading-5 font-medium text-gray-900">
                      Classes Assigned
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Classes assigned
                    </p>
                    <p className="mt-1 text-lg font-bold text-purple-600">
                      {isLoading ? '-' : statistics?.uniqueClasses || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Today's Schedule Preview */}
          <div id="today-schedule" className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Today's Schedule - {todayLessons.length} lessons today - <span className="text-blue-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </h3>
                <Link
                  href="/dashboard/teacher/timetable"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Timetable
                </Link>
              </div>
              {error ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Error Loading Data
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {error}
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Loading Schedule...
                  </h3>
                </div>
              ) : todayLessons.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No lessons scheduled for today
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check your full timetable for this week's schedule.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayLessons.map((lesson, index) => (
                    <div key={lesson.id} className={`p-4 bg-white rounded-lg border shadow-sm ${
                      index % 3 === 0 ? 'border-blue-100 bg-blue-50/30' :
                      index % 3 === 1 ? 'border-green-100 bg-green-50/30' :
                      'border-purple-100 bg-purple-50/30'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Clock className={`h-5 w-5 mt-0.5 ${
                            index % 3 === 0 ? 'text-blue-500' :
                            index % 3 === 1 ? 'text-green-500' :
                            'text-purple-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate">
                            {lesson.subject ? lesson.subject.name : lesson.module?.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {lesson.class.name}
                          </p>
                          <p className="text-xs text-gray-700 mt-1">
                            Period {lesson.period} • {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              lesson.module?.category === 'SPECIFIC' ? 'bg-blue-100 text-blue-800' :
                              lesson.module?.category === 'GENERAL' ? 'bg-green-100 text-green-800' :
                              lesson.module?.category === 'COMPLEMENTARY' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lesson.module ? lesson.module.category : 'Subject'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLessonStatus(lesson.startTime, lesson.endTime).color}`}>
                              {getLessonStatus(lesson.startTime, lesson.endTime).label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Teacher Portal
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This is your teacher portal where you can view your schedule, 
                    manage your classes, and set your availability preferences. 
                    Your timetable is automatically generated by the school administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Profile</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const name = formData.get('name') as string
              const email = formData.get('email') as string

              try {
                const response = await fetch('/api/user/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email })
                })

                if (response.ok) {
                  alert('Profile updated successfully!')
                  setShowProfileModal(false)
                  // Refresh the page to show updated info
                  window.location.reload()
                } else {
                  alert('Failed to update profile')
                }
              } catch (error) {
                alert('Error updating profile')
              }
            }}>
              <div className="space-y-4">
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        <User className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const formData = new FormData()
                            formData.append('photo', file)

                            try {
                              const response = await fetch('/api/user/upload-photo', {
                                method: 'POST',
                                body: formData
                              })

                              if (response.ok) {
                                alert('Profile photo uploaded successfully!')
                                window.location.reload()
                              } else {
                                alert('Failed to upload photo')
                              }
                            } catch (error) {
                              alert('Error uploading photo')
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={session.user.name || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={session.user.email || ''}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const currentPassword = formData.get('currentPassword') as string
              const newPassword = formData.get('newPassword') as string
              const confirmPassword = formData.get('confirmPassword') as string

              if (newPassword !== confirmPassword) {
                alert('New passwords do not match')
                return
              }

              try {
                const response = await fetch('/api/user/password', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword })
                })

                if (response.ok) {
                  alert('Password changed successfully!')
                  setShowPasswordModal(false)
                } else {
                  const data = await response.json()
                  alert(data.error || 'Failed to change password')
                }
              } catch (error) {
                alert('Error changing password')
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}