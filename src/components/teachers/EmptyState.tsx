import { Users, Plus } from 'lucide-react'

interface EmptyStateProps {
    onAddTeacher: () => void
}

export default function EmptyState({ onAddTeacher }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
                No teachers found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
                Start by adding your first teacher to the system.
            </p>
            <div className="mt-6">
                <button
                    onClick={onAddTeacher}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Teacher
                </button>
            </div>
        </div>
    )
}