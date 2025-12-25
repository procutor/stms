'use client'

import { useState } from 'react'
import { FileText, Loader2, Download } from 'lucide-react'
import { exportTimetableToCSV, exportTimetableGridToCSV, TimetableEntry } from '@/lib/csv-export'

interface CSVExportButtonProps {
    entries: TimetableEntry[]
    title: string
    fileName?: string
    className?: string
    variant?: 'list' | 'grid'
    onExportStart?: () => void
    onExportComplete?: () => void
    onExportError?: (error: string) => void
}

export default function CSVExportButton({
    entries,
    title,
    fileName,
    className = '',
    variant = 'list',
    onExportStart,
    onExportComplete,
    onExportError
}: CSVExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'complete' | 'error'>('idle')

    const handleExport = async () => {
        if (isExporting) return

        try {
            setIsExporting(true)
            setExportStatus('exporting')
            onExportStart?.()

            const options = {
                title: title,
                fileName: fileName
            }

            if (variant === 'grid') {
                await exportTimetableGridToCSV(entries, options)
            } else {
                await exportTimetableToCSV(entries, options)
            }

            setExportStatus('complete')
            onExportComplete?.()

        } catch (error) {
            console.error('CSV export failed:', error)
            setExportStatus('error')
            const errorMessage = error instanceof Error ? error.message : 'Failed to export CSV'
            onExportError?.(errorMessage)
        } finally {
            setIsExporting(false)
            // Reset status after a delay
            setTimeout(() => setExportStatus('idle'), 3000)
        }
    }

    const getStatusText = () => {
        switch (exportStatus) {
            case 'exporting':
                return 'Exporting CSV...'
            case 'complete':
                return 'Downloaded!'
            case 'error':
                return 'Export Failed'
            default:
                return variant === 'grid' ? 'Export Grid CSV' : 'Export List CSV'
        }
    }

    const getStatusColor = () => {
        switch (exportStatus) {
            case 'complete':
                return 'bg-green-600 hover:bg-green-700'
            case 'error':
                return 'bg-red-600 hover:bg-red-700'
            case 'exporting':
                return 'bg-blue-600 hover:bg-blue-700'
            default:
                return 'bg-blue-600 hover:bg-blue-700'
        }
    }

    const isDisabled = isExporting || !entries?.length

    return (
        <div className={className}>
            <button
                onClick={handleExport}
                disabled={isDisabled}
                className={`
                    inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors
                    ${getStatusColor()}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isExporting ? 'cursor-wait' : ''}
                `}
                title={
                    variant === 'grid'
                        ? 'Export timetable as CSV grid (periods as rows, days as columns)'
                        : 'Export timetable as CSV list'
                }
            >
                {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Download className="h-4 w-4 mr-2" />
                )}
                {getStatusText()}
            </button>

            {/* Export Progress Indicator */}
            {isExporting && (
                <div className="mt-2">
                    <div className="flex items-center text-xs text-gray-600">
                        <div className="flex space-x-1">
                            <div className={`w-2 h-2 rounded-full ${exportStatus === 'exporting' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <div className={`w-2 h-2 rounded-full ${exportStatus === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <span className="ml-2">
                            Preparing CSV file...
                        </span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {exportStatus === 'error' && (
                <div className="mt-2 text-xs text-red-600">
                    Failed to export CSV. Please try again.
                </div>
            )}

            {/* Success Message */}
            {exportStatus === 'complete' && (
                <div className="mt-2 text-xs text-green-600">
                    CSV downloaded successfully!
                </div>
            )}
        </div>
    )
}

// Convenience component for grid export
export function CSVGridExportButton(props: Omit<CSVExportButtonProps, 'variant'>) {
    return <CSVExportButton {...props} variant="grid" />
}

// Convenience component for list export
export function CSVListExportButton(props: Omit<CSVExportButtonProps, 'variant'>) {
    return <CSVExportButton {...props} variant="list" />
}