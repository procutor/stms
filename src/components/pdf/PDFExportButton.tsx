'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { exportTimetableToPDF, exportBatchTimetablesToPDF, TimetableEntry, PDFExportOptions } from '@/lib/pdf-export'

interface PDFExportButtonProps {
  entries?: TimetableEntry[]
  classTimetables?: { className: string; entries: TimetableEntry[] }[]
  title: string
  schoolName?: string
  className?: string
  variant?: 'single' | 'batch'
  autoExport?: boolean
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
}

export default function PDFExportButton({
  entries,
  classTimetables,
  title,
  schoolName,
  className = '',
  variant = 'single',
  autoExport = false,
  onExportStart,
  onExportComplete,
  onExportError
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error'>('idle')

  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)
      setExportStatus('preparing')
      onExportStart?.()

      const baseOptions: PDFExportOptions = {
        title: title,
        schoolName: schoolName,
        includeLegend: true,
        fileName: `${title.replace(/\\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
      }

      setExportStatus('generating')

      if (variant === 'batch' && classTimetables && classTimetables.length > 0) {
        await exportBatchTimetablesToPDF(classTimetables, baseOptions)
      } else if (entries && entries.length > 0) {
        await exportTimetableToPDF(entries, baseOptions)
      } else {
        throw new Error('No timetable data available for export')
      }

      setExportStatus('downloading')
      
      // Small delay to show downloading status
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setExportStatus('complete')
      onExportComplete?.()

    } catch (error) {
      console.error('PDF export failed:', error)
      setExportStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to export PDF'
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
      // Reset status after a delay
      setTimeout(() => setExportStatus('idle'), 3000)
    }
  }

  // Auto-export if enabled
  if (autoExport && !isExporting && exportStatus === 'idle') {
    setTimeout(() => {
      handleExport()
    }, 1000) // Delay to allow data to load
  }

  const getStatusText = () => {
    switch (exportStatus) {
      case 'preparing':
        return 'Preparing...'
      case 'generating':
        return 'Generating PDF...'
      case 'downloading':
        return 'Downloading...'
      case 'complete':
        return 'Downloaded!'
      case 'error':
        return 'Export Failed'
      default:
        return variant === 'batch' ? 'Export All PDFs' : 'Export PDF'
    }
  }

  const getStatusColor = () => {
    switch (exportStatus) {
      case 'complete':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-red-600 hover:bg-red-700'
      case 'generating':
      case 'downloading':
        return 'bg-blue-600 hover:bg-blue-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const isDisabled = isExporting || (variant === 'batch' ? !classTimetables?.length : !entries?.length)

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
          variant === 'batch' 
            ? `Export ${classTimetables?.length || 0} class timetables as PDF`
            : 'Export current timetable as PDF'
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
              <div className={`w-2 h-2 rounded-full ${exportStatus === 'preparing' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${exportStatus === 'generating' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${exportStatus === 'downloading' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full ${exportStatus === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <span className="ml-2">
              {variant === 'batch' 
                ? `Exporting ${classTimetables?.length || 0} timetables...`
                : 'Exporting timetable...'
              }
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {exportStatus === 'error' && (
        <div className="mt-2 text-xs text-red-600">
          Failed to export PDF. Please try again.
        </div>
      )}

      {/* Success Message */}
      {exportStatus === 'complete' && (
        <div className="mt-2 text-xs text-green-600">
          PDF downloaded successfully!
        </div>
      )}
    </div>
  )
}

// Convenience component for single timetable export
export function SinglePDFExportButton(props: Omit<PDFExportButtonProps, 'variant' | 'classTimetables'>) {
  return <PDFExportButton {...props} variant="single" />
}

// Convenience component for batch export
export function BatchPDFExportButton(props: Omit<PDFExportButtonProps, 'variant' | 'entries'>) {
  return <PDFExportButton {...props} variant="batch" />
}