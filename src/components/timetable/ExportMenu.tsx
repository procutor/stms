'use client'

import { useState } from 'react'
import { Download, FileText, Table, Printer } from 'lucide-react'
import { TimetableEntry } from './WeeklyGrid'
import { TimetableExporter, ExportOptions } from '@/lib/export-utils'

interface ExportMenuProps {
  entries: TimetableEntry[]
  options: ExportOptions
  className?: string
}

export default function ExportMenu({ entries, options, className = '' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'pdf' | 'excel' | 'print') => {
    setIsExporting(true)
    setIsOpen(false)

    try {
      switch (type) {
        case 'pdf':
          TimetableExporter.exportToPDF(entries, options)
          break
        case 'excel':
          TimetableExporter.exportToExcel(entries, options)
          break
        case 'print':
          TimetableExporter.printTimetable(entries, options)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-500">Portable document format</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Table className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <div>
                <div className="font-medium">Export as Excel</div>
                <div className="text-xs text-gray-500">Spreadsheet format</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('print')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Printer className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <div>
                <div className="font-medium">Print Timetable</div>
                <div className="text-xs text-gray-500">Print-friendly layout</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
