'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Settings,
  Mail,
  Phone,
  Edit,
  Eye,
  UserX
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
  maxWeeklyHours: number
  isActive: boolean
  teachingStreams?: string
  phone?: string
  _count: {
    timetablesAsTeacher: number
  }
}

interface TeacherStats {
  totalTeachers: number
  activeTeachers: number
  inactiveTeachers: number
  averageUtilization: number
  totalLessons: number
  todayLessons: number
}

interface DashboardProps {
  onTeacherSelect?: (teacher: Teacher) => void
  onAddTeacher?: () => void
  showFullView?: boolean
}

export default function TeacherDashboard({ 
  onTeacherSelect, 
  onAddTeacher,
  showFullView = false 
}: DashboardProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [teachersRes, statsRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/teacher/statistics?admin=true') // Add admin parameter for aggregated stats
      ])

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json()
        setTeachers(teachersData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.statistics)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && teacher.isActive) ||
                         (filterStatus === 'inactive' && !teacher.isActive)
    return matchesSearch && matchesStatus
  })

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    if (onTeacherSelect) {
      onTeacherSelect(teacher)
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 60) return 'text-yellow-600 bg-yellow-100'
    if (utilization > 90) return 'text-red-600 bg-red-100'
    return 'text-green-600 bg-green-100'
  }

  const getStreamBadgeColor = (stream?: string) => {
    switch (stream) {
      case 'PRIMARY':
        return 'bg-blue-100 text-blue-800'
      case 'SECONDARY':
        return 'bg-green-100 text-green-800'
      case 'TSS':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Compact view for embedding
  if (!showFullView) {
    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTeachers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeTeachers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.averageUtilization || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Today's Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayLessons || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={onAddTeacher}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600">Add Teacher</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="h-6 w-6 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Manage Assignments</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-6 w-6 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">View Reports</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-6 w-6 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Schedule Overview</span>
            </button>
          </div>
        </div>

        {/* Recent Teachers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Teachers</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-3">
            {filteredTeachers.slice(0, 5).map((teacher) => (
              <div 
                key={teacher.id} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTeacherClick(teacher)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {teacher.teachingStreams && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStreamBadgeColor(teacher.teachingStreams)}`}>
                      {teacher.teachingStreams}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Full dashboard view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Teacher Hub
              </h2>
              <p className="text-gray-600">Manage your school's teaching staff and assignments</p>
            </div>
            <button
              onClick={onAddTeacher}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Teachers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalTeachers || 0}
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
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Teachers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.activeTeachers || 0}
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
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Utilization
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.averageUtilization || 0}%
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
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Lessons
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.todayLessons || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search teachers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="status-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Teachers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Teachers ({filteredTeachers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {teacher.id.slice(-8)}
                        </div>
                        {teacher.teachingStreams && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStreamBadgeColor(teacher.teachingStreams)}`}>
                            {teacher.teachingStreams}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {teacher.email}
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {teacher.maxWeeklyHours} hours/week
                    </div>
                    <div className="text-sm text-gray-500">
                      {teacher._count.timetablesAsTeacher} lessons
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      teacher.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          {Math.round((teacher._count.timetablesAsTeacher / teacher.maxWeeklyHours) * 100)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (teacher._count.timetablesAsTeacher / teacher.maxWeeklyHours) > 0.9 
                                ? 'bg-red-500' 
                                : (teacher._count.timetablesAsTeacher / teacher.maxWeeklyHours) < 0.6
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((teacher._count.timetablesAsTeacher / teacher.maxWeeklyHours) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTeacherClick(teacher)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="Edit Teacher"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Deactivate"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Teacher Details - {selectedTeacher.name}
                </h3>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="h-5 w-5" />
                </button>
              </div>
              
              {/* Teacher detail content would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {selectedTeacher.name}</div>
                    <div><strong>Email:</strong> {selectedTeacher.email}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTeacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div><strong>Teaching Stream:</strong> {selectedTeacher.teachingStreams || 'Not specified'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Workload Summary</h4>
                  <div className="space-y-2">
                    <div><strong>Max Weekly Hours:</strong> {selectedTeacher.maxWeeklyHours}</div>
                    <div><strong>Current Lessons:</strong> {selectedTeacher._count.timetablesAsTeacher}</div>
                    <div><strong>Utilization:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilizationColor(Math.round((selectedTeacher._count.timetablesAsTeacher / selectedTeacher.maxWeeklyHours) * 100))}`}>
                        {Math.round((selectedTeacher._count.timetablesAsTeacher / selectedTeacher.maxWeeklyHours) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}