import { X } from 'lucide-react'
import TeacherForm from './TeacherForm'

interface Teacher {
    id: string
    name: string
    email: string
    role: string
    teachingStreams?: string
    maxWeeklyHours?: number
    isActive: boolean
    unavailableDays?: string
    unavailablePeriods?: string
    _count?: {
        teacherSubjects: number
        trainerModules: number
        timetablesAsTeacher: number
    }
}

interface EditTeacherModalProps {
    showEditModal: boolean
    setShowEditModal: (show: boolean) => void
    editingTeacher: Teacher | null
    setEditingTeacher: (teacher: Teacher | null) => void
    formData: {
        name: string
        email: string
        password?: string
        teachingStreams: string
        maxWeeklyHours: number
        unavailableDays: string[]
        unavailablePeriods: string[]
    }
    setFormData: (data: any) => void
    isSubmitting: boolean
    onSubmit: (e: React.FormEvent) => void
}

export default function EditTeacherModal({
    showEditModal,
    setShowEditModal,
    editingTeacher,
    setEditingTeacher,
    formData,
    setFormData,
    isSubmitting,
    onSubmit
}: EditTeacherModalProps) {
    const handleCancel = () => {
        setShowEditModal(false)
        setEditingTeacher(null)
        setFormData({
            name: '',
            email: '',
            password: '',
            teachingStreams: '',
            maxWeeklyHours: 40,
            unavailableDays: [],
            unavailablePeriods: []
        })
    }

    if (!showEditModal || !editingTeacher) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Teacher</h3>
                    <button onClick={handleCancel}>
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                <TeacherForm
                    formData={formData}
                    setFormData={setFormData}
                    isSubmitting={isSubmitting}
                    isEdit={true}
                    onSubmit={onSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    )
}