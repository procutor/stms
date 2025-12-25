'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User, Lock, Save, X, Eye, EyeOff } from 'lucide-react'
import SchoolAdminSidebar from '@/components/layout/SchoolAdminSidebar'

export default function SchoolAdminProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()

    // Profile state
    const [profileData, setProfileData] = useState({
        name: '',
        email: ''
    })
    const [isProfileLoading, setIsProfileLoading] = useState(false)
    const [profileMessage, setProfileMessage] = useState('')
    const [profileError, setProfileError] = useState('')

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [isPasswordLoading, setIsPasswordLoading] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState('')
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        if (session?.user) {
            setProfileData({
                name: session.user.name || '',
                email: session.user.email || ''
            })
        }
    }, [session])

    const handleProfileChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }))
        setProfileMessage('')
        setProfileError('')
    }

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }))
        setPasswordMessage('')
        setPasswordError('')
    }

    const updateProfile = async () => {
        if (!profileData.name.trim() || !profileData.email.trim()) {
            setProfileError('Name and email are required')
            return
        }

        setIsProfileLoading(true)
        setProfileError('')
        setProfileMessage('')

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            })

            const data = await response.json()

            if (response.ok) {
                setProfileMessage('Profile updated successfully!')
                // Update the session
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        name: profileData.name,
                        email: profileData.email
                    }
                })
            } else {
                setProfileError(data.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Profile update error:', error)
            setProfileError('An error occurred while updating profile')
        } finally {
            setIsProfileLoading(false)
        }
    }

    const changePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('All password fields are required')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long')
            return
        }

        setIsPasswordLoading(true)
        setPasswordError('')
        setPasswordMessage('')

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setPasswordMessage('Password changed successfully!')
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
            } else {
                setPasswordError(data.error || 'Failed to change password')
            }
        } catch (error) {
            console.error('Password change error:', error)
            setPasswordError('An error occurred while changing password')
        } finally {
            setIsPasswordLoading(false)
        }
    }

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
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

    return (
        <div className="min-h-screen bg-slate-50">
            <SchoolAdminSidebar />

            <div className="ml-64 flex flex-col min-h-screen">
                <header className="bg-white shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    My Profile
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage your account settings
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 py-6 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Profile Information Card */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-6">
                                <div className="flex items-center mb-6">
                                    <User className="h-6 w-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => handleProfileChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => handleProfileChange('email', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                {profileError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-600">{profileError}</p>
                                    </div>
                                )}

                                {profileMessage && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-sm text-green-600">{profileMessage}</p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <button
                                        onClick={updateProfile}
                                        disabled={isProfileLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isProfileLoading ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Change Password Card */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-6">
                                <div className="flex items-center mb-6">
                                    <Lock className="h-6 w-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {passwordError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-600">{passwordError}</p>
                                    </div>
                                )}

                                {passwordMessage && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-sm text-green-600">{passwordMessage}</p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <button
                                        onClick={changePassword}
                                        disabled={isPasswordLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        {isPasswordLoading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}