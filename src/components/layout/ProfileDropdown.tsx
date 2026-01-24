'use client'

import { useState } from 'react'
import { User, ChevronDown, Building, Mail, Phone, MapPin, Calendar, CheckCircle, Clock, Edit, Save, X } from 'lucide-react'

interface ProfileDropdownProps {
   user: {
     id: string
     name: string
     email: string
     role: string
     schoolId?: string
     createdAt: string
     updatedAt: string
   }
   school?: {
     id: string
     name: string
     type: string
     address?: string
     province?: string
     district?: string
     sector?: string
     email: string
     phone?: string
     status: string
     approvedAt?: string
     createdAt: string
   }
   onSchoolUpdate?: (updatedSchool: any) => void
   onUserUpdate?: (updatedUser: any) => void
}

export default function ProfileDropdown({ user, school, onSchoolUpdate, onUserUpdate }: ProfileDropdownProps) {
   const [isOpen, setIsOpen] = useState(false)
   const [isEditingSchool, setIsEditingSchool] = useState(false)
   const [isEditingUser, setIsEditingUser] = useState(false)
   const [schoolEditForm, setSchoolEditForm] = useState({
     name: school?.name || '',
     type: school?.type || '',
     address: school?.address || '',
     province: school?.province || '',
     district: school?.district || '',
     sector: school?.sector || '',
     email: school?.email || '',
     phone: school?.phone || ''
   })
   const [userEditForm, setUserEditForm] = useState({
     name: user.name,
     email: user.email,
     currentPassword: '',
     newPassword: '',
     confirmPassword: ''
   })
   const [isSaving, setIsSaving] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'inactive':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSchoolEdit = () => {
    if (school) {
      setSchoolEditForm({
        name: school.name,
        type: school.type,
        address: school.address || '',
        province: school.province || '',
        district: school.district || '',
        sector: school.sector || '',
        email: school.email,
        phone: school.phone || ''
      })
      setIsEditingSchool(true)
    }
  }

  const handleUserEdit = () => {
    setUserEditForm({
      name: user.name,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setIsEditingUser(true)
  }

  const handleSchoolSave = async () => {
    if (!school || !onSchoolUpdate) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/schools', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: school.id,
          ...schoolEditForm
        }),
      })

      if (response.ok) {
        const updatedSchool = await response.json()
        onSchoolUpdate(updatedSchool)
        setIsEditingSchool(false)
        alert('School information updated successfully!')
      } else {
        const error = await response.json()
        alert('Failed to update school information: ' + error.error)
      }
    } catch (error) {
      console.error('Error updating school info:', error)
      alert('An error occurred while updating school information.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUserSave = async () => {
    if (!onUserUpdate) return

    // Validate password confirmation if password is being changed
    if (userEditForm.newPassword && userEditForm.newPassword !== userEditForm.confirmPassword) {
      alert('New passwords do not match!')
      return
    }

    setIsSaving(true)
    try {
      // If password is being changed, update it first
      if (userEditForm.newPassword) {
        if (!userEditForm.currentPassword) {
          alert('Current password is required to change password!')
          setIsSaving(false)
          return
        }

        const passwordResponse = await fetch('/api/user/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: userEditForm.currentPassword,
            newPassword: userEditForm.newPassword
          }),
        })

        if (!passwordResponse.ok) {
          const error = await passwordResponse.json()
          alert('Failed to change password: ' + error.error)
          setIsSaving(false)
          return
        }
      }

      // Update profile information
      const updateData = {
        name: userEditForm.name,
        email: userEditForm.email
      }

      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        onUserUpdate(data.user)
        setIsEditingUser(false)
        alert('Profile updated successfully!')
      } else {
        const error = await response.json()
        alert('Failed to update profile: ' + error.error)
      }
    } catch (error) {
      console.error('Error updating user info:', error)
      alert('An error occurred while updating your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSchoolCancel = () => {
    setIsEditingSchool(false)
  }

  const handleUserCancel = () => {
    setIsEditingUser(false)
  }

  const handleSchoolInputChange = (field: string, value: string) => {
    setSchoolEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUserInputChange = (field: string, value: string) => {
    setUserEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.role.replace('_', ' ')}</p>
                </div>
              </div>

              {/* User Information */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Account Information</span>
                  {!isEditingUser && (
                    <button
                      onClick={handleUserEdit}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingUser ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={userEditForm.name}
                        onChange={(e) => handleUserInputChange('name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={userEditForm.email}
                        onChange={(e) => handleUserInputChange('email', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={userEditForm.currentPassword}
                        onChange={(e) => handleUserInputChange('currentPassword', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Required to change password"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                      <input
                        type="password"
                        value={userEditForm.newPassword}
                        onChange={(e) => handleUserInputChange('newPassword', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={userEditForm.confirmPassword}
                        onChange={(e) => handleUserInputChange('confirmPassword', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>


                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleUserSave}
                        disabled={isSaving}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleUserCancel}
                        disabled={isSaving}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* School Information */}
              {school && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">School Information</span>
                    </div>
                    {!isEditingSchool && (
                      <button
                        onClick={handleSchoolEdit}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingSchool ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
                          <input
                            type="text"
                            value={schoolEditForm.name}
                            onChange={(e) => handleSchoolInputChange('name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">School Type</label>
                          <select
                            value={schoolEditForm.type}
                            onChange={(e) => handleSchoolInputChange('type', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select school type</option>
                            <option value="PRIMARY">Primary School</option>
                            <option value="SECONDARY">Secondary School</option>
                            <option value="TECHNICAL">Technical School</option>
                            <option value="TVET">TVET School</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                          <textarea
                            value={schoolEditForm.address}
                            onChange={(e) => handleSchoolInputChange('address', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Province</label>
                            <input
                              type="text"
                              value={schoolEditForm.province}
                              onChange={(e) => handleSchoolInputChange('province', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                            <input
                              type="text"
                              value={schoolEditForm.district}
                              onChange={(e) => handleSchoolInputChange('district', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Sector</label>
                            <input
                              type="text"
                              value={schoolEditForm.sector}
                              onChange={(e) => handleSchoolInputChange('sector', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                          <input
                            type="email"
                            value={schoolEditForm.email}
                            onChange={(e) => handleSchoolInputChange('email', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={schoolEditForm.phone}
                            onChange={(e) => handleSchoolInputChange('phone', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={handleSchoolSave}
                          disabled={isSaving}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={handleSchoolCancel}
                          disabled={isSaving}
                          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">School Name:</span>
                        <span className="text-sm font-medium text-gray-900">{school.name}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm font-medium text-gray-900">{school.type}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(school.status)}`}>
                          {school.status}
                        </span>
                      </div>

                      {school.address && (
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-gray-700">
                            <div>{school.address}</div>
                            {school.province && <div>{school.province}</div>}
                            {school.district && <div>{school.district}</div>}
                            {school.sector && <div>{school.sector}</div>}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{school.email}</span>
                      </div>

                      {school.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{school.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">School registered {formatDate(school.createdAt)}</span>
                      </div>

                      {school.approvedAt && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-gray-700">Approved {formatDate(school.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}