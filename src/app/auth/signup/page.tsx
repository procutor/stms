'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolType: 'PRIMARY',
        province: '',
        district: '',
        sector: '',
        email: '',
        phone: '',
        adminName: '',
        password: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('/api/schools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schoolName: formData.schoolName,
                    schoolType: formData.schoolType,
                    province: formData.province,
                    district: formData.district,
                    sector: formData.sector,
                    email: formData.email,
                    phone: formData.phone,
                    adminName: formData.adminName,
                    password: formData.password
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('School registered successfully! Please wait for Super Admin approval.')
                setTimeout(() => {
                    router.push('/auth/signin')
                }, 3000)
            } else {
                setError(data.error || 'Registration failed')
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Register Your School
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        School Admin Registration - Teachers cannot self-register
                    </p>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href="/auth/signin"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="text-sm text-green-700">{success}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {/* School Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">School Information</h3>

                            <div>
                                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                                    School Name *
                                </label>
                                <input
                                    id="schoolName"
                                    name="schoolName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="schoolType" className="block text-sm font-medium text-gray-700">
                                    School Type *
                                </label>
                                <select
                                    id="schoolType"
                                    name="schoolType"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.schoolType}
                                    onChange={handleChange}
                                >
                                    <option value="PRIMARY">Primary</option>
                                    <option value="SECONDARY">Ordinary Level</option>
                                    <option value="ADVANCED">Advanced Level</option>
                                    <option value="TSS">Technical Secondary School (TSS) Only</option>
                                    <option value="TTC">TTC Only</option>
                                    <option value="SECONDARY_TTC">Ordinary and TTC</option>
                                    <option value="SECONDARY_TSS">Ordinary and TSS</option>
                                    <option value="PRIMARY_SECONDARY_ADVANCED_TSS">Primary, Ordinary, Advanced Level and TSS</option>
                                    <option value="PRIMARY_SECONDARY">Primary And Ordinary Level</option>
                                    <option value="PRIMARY_SECONDARY_ADVANCED">Primary, Ordinary and Advanced Level</option>
                                </select>
                            </div>


                            <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                                    Province/City *
                                </label>
                                <input
                                    id="province"
                                    name="province"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.province}
                                    onChange={handleChange}
                                    placeholder="Enter province or city"
                                />
                            </div>

                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                                    District *
                                </label>
                                <input
                                    id="district"
                                    name="district"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="Enter district"
                                />
                            </div>

                            <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
                                    Sector *
                                </label>
                                <input
                                    id="sector"
                                    name="sector"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.sector}
                                    onChange={handleChange}
                                    placeholder="Enter sector"
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Admin Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">School Admin Information</h3>

                            <div>
                                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                                    Admin Name *
                                </label>
                                <input
                                    id="adminName"
                                    name="adminName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.adminName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password *
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password *
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Registering...' : 'Register School'}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                        * Required fields
                        <br />
                        Your school will need approval from a Super Admin before you can sign in.
                    </div>
                </form>
            </div>
        </div>
    )
}