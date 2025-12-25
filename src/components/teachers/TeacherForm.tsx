import { X } from 'lucide-react'

interface TeacherFormProps {
    formData: {
        name: string
        email: string
        password?: string
        role?: string
        teachingStreams: string
        maxWeeklyHours: number
        unavailableDays: string[]
        unavailablePeriods: string[]
    }
    setFormData: (data: any) => void
    isSubmitting: boolean
    isEdit?: boolean
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
}

const TEACHING_STREAMS = [
    { value: 'PRIMARY', label: 'Primary School' },
    { value: 'SECONDARY', label: 'Secondary School' },
    { value: 'TSS', label: 'Technical & Skills School' },
    { value: 'SECONDARY_AND_TSS', label: 'Secondary & TSS' }
]

const USER_ROLES = [
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'TRAINER', label: 'Trainer' }
]

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function TeacherForm({
    formData,
    setFormData,
    isSubmitting,
    isEdit = false,
    onSubmit,
    onCancel
}: TeacherFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            {isEdit && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password (leave empty to keep current)
                    </label>
                    <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minLength={6}
                    />
                </div>
            )}

            {!isEdit && (
                <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                        <strong>Default Password:</strong> The teacher will be created with a default password that they can change after first login.
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                </label>
                <select
                    value={formData.role || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="">Select role</option>
                    {USER_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Streams
                </label>
                <select
                    value={formData.teachingStreams}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, teachingStreams: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="">Select teaching streams</option>
                    {TEACHING_STREAMS.map(stream => (
                        <option key={stream.value} value={stream.value}>
                            {stream.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Weekly Hours
                </label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.maxWeeklyHours}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, maxWeeklyHours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unavailable Days (Optional)
                </label>
                <div className="space-y-2">
                    {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.unavailableDays.includes(day)}
                                onChange={(e) => {
                                    const checked = e.target.checked
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        unavailableDays: checked
                                            ? [...prev.unavailableDays, day]
                                            : prev.unavailableDays.filter((d: string) => d !== day)
                                    }))
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm">{day.toLowerCase().charAt(0).toUpperCase() + day.toLowerCase().slice(1)}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting 
                        ? (isEdit ? 'Updating...' : 'Creating...') 
                        : (isEdit ? 'Update Teacher' : 'Create Teacher')
                    }
                </button>
            </div>
        </form>
    )
}