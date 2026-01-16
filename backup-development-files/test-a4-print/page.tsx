'use client'

import { useState } from 'react'
import CompactA4Timetable from '@/components/timetable/CompactA4Timetable'
import { Printer } from 'lucide-react'

// Sample comprehensive timetable data for testing
const sampleTimetableData = [
  // Monday
  { id: '1', day: 'MONDAY', period: 1, startTime: '08:00', endTime: '08:40', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'John Doe' }, module: { name: 'Mathematics', category: 'SPECIFIC' } },
  { id: '2', day: 'MONDAY', period: 2, startTime: '08:40', endTime: '09:20', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Jane Smith' }, module: { name: 'Physics', category: 'GENERAL' } },
  { id: '3', day: 'MONDAY', period: 3, startTime: '09:20', endTime: '10:00', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Bob Johnson' }, module: { name: 'English', category: 'COMPLEMENTARY' } },
  { id: '4', day: 'MONDAY', period: 4, startTime: '10:20', endTime: '11:00', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Alice Brown' }, module: { name: 'Chemistry', category: 'SPECIFIC' } },
  { id: '5', day: 'MONDAY', period: 5, startTime: '11:00', endTime: '11:40', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Charlie Wilson' }, module: { name: 'Biology', category: 'GENERAL' } },
  
  // Tuesday
  { id: '6', day: 'TUESDAY', period: 1, startTime: '08:00', endTime: '08:40', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Diana Davis' }, module: { name: 'Computer Science', category: 'SPECIFIC' } },
  { id: '7', day: 'TUESDAY', period: 2, startTime: '08:40', endTime: '09:20', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Eva Martinez' }, module: { name: 'History', category: 'COMPLEMENTARY' } },
  { id: '8', day: 'TUESDAY', period: 3, startTime: '09:20', endTime: '10:00', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Frank Wilson' }, module: { name: 'Geography', category: 'GENERAL' } },
  { id: '9', day: 'TUESDAY', period: 6, startTime: '13:10', endTime: '13:50', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Grace Lee' }, module: { name: 'Art', category: 'COMPLEMENTARY' } },
  
  // Wednesday
  { id: '10', day: 'WEDNESDAY', period: 1, startTime: '08:00', endTime: '08:40', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Henry Taylor' }, module: { name: 'Music', category: 'COMPLEMENTARY' } },
  { id: '11', day: 'WEDNESDAY', period: 4, startTime: '10:20', endTime: '11:00', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Ivy Chen' }, module: { name: 'Physical Ed', category: 'GENERAL' } },
  { id: '12', day: 'WEDNESDAY', period: 7, startTime: '13:50', endTime: '14:30', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Jack Brown' }, module: { name: 'Statistics', category: 'SPECIFIC' } },
  
  // Thursday
  { id: '13', day: 'THURSDAY', period: 2, startTime: '08:40', endTime: '09:20', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Kate Davis' }, module: { name: 'Literature', category: 'COMPLEMENTARY' } },
  { id: '14', day: 'THURSDAY', period: 5, startTime: '11:00', endTime: '11:40', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Leo Garcia' }, module: { name: 'Economics', category: 'SPECIFIC' } },
  { id: '15', day: 'THURSDAY', period: 8, startTime: '14:30', endTime: '15:10', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Maya Patel' }, module: { name: 'Philosophy', category: 'COMPLEMENTARY' } },
  
  // Friday
  { id: '16', day: 'FRIDAY', period: 3, startTime: '09:20', endTime: '10:00', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Nathan Kim' }, module: { name: 'Psychology', category: 'GENERAL' } },
  { id: '17', day: 'FRIDAY', period: 6, startTime: '13:10', endTime: '13:50', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Olivia White' }, module: { name: 'Sociology', category: 'COMPLEMENTARY' } },
  { id: '18', day: 'FRIDAY', period: 9, startTime: '15:30', endTime: '16:10', class: { name: 'L3 ELTA', level: 'Level 3' }, teacher: { name: 'Peter Johnson' }, module: { name: 'Research Methods', category: 'SPECIFIC' } }
]

export default function TestA4Print() {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    // Add print-specific class to body for CSS targeting
    document.body.classList.add('print-mode')
    document.body.classList.add('a4-printing')
    
    // Print after a brief delay to ensure styles are applied
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
      document.body.classList.remove('print-mode')
      document.body.classList.remove('a4-printing')
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ultra-Compact A4 Timetable Test
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the ultra-compact A4 format optimized for single-page printing.
          </p>
          
          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Printer className="h-5 w-5 mr-2" />
            {isPrinting ? 'Preparing for Print...' : 'Print A4 Timetable'}
          </button>
        </div>

        {/* A4 Timetable Display */}
        <div className="flex justify-center mb-8">
          <div id="compact-timetable">
            <CompactA4Timetable
              entries={sampleTimetableData}
              title="L3 ELTA Class - Weekly Timetable"
              className="compact-a4-container"
            />
          </div>
        </div>

        {/* A4 Size Indicator - Only visible in development */}
        <div className="a4-page-indicator">
          A4 Size: 210×297mm | Optimized for single-page print
        </div>

        {/* Technical Specifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">A4 Optimization Specifications:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions */}
            <div>
              <h4 className="font-semibold mb-2">Exact A4 Dimensions:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Paper Size:</strong> 210mm × 297mm</li>
                <li>• <strong>Content Area:</strong> 204mm × 293mm (3mm margins)</li>
                <li>• <strong>Cell Height:</strong> 8mm per period (ultra-compact)</li>
                <li>• <strong>Header Height:</strong> 8mm</li>
                <li>• <strong>Footer Space:</strong> 3mm</li>
              </ul>
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-semibold mb-2">Ultra-Minimal Typography:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Main Font:</strong> 5px (screen) / 4px (print)</li>
                <li>• <strong>Headers:</strong> 5px bold</li>
                <li>• <strong>Content:</strong> 4px with 0.6 line-height</li>
                <li>• <strong>Padding:</strong> 0.2mm - 0.5mm</li>
                <li>• <strong>Borders:</strong> 0.3px</li>
              </ul>
            </div>

            {/* Content Strategy */}
            <div>
              <h4 className="font-semibold mb-2">Ultra-Space Optimization:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Day Names:</strong> 3 letters (MON, TUE, etc.)</li>
                <li>• <strong>Teacher Names:</strong> Initials only (J.D, M.S, etc.)</li>
                <li>• <strong>Module Names:</strong> 2-3 chars max (Ma., Ph., En.)</li>
                <li>• <strong>Period Labels:</strong> Simple P1, P2, P3... format</li>
                <li>• <strong>Free Periods:</strong> Show as "-" (minimal space)</li>
              </ul>
            </div>

            {/* Print Features */}
            <div>
              <h4 className="font-semibold mb-2">Ultra-Print Features:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Color Preservation:</strong> Module colors maintained</li>
                <li>• <strong>Page Control:</strong> Single-page guarantee</li>
                <li>• <strong>Print Margins:</strong> 3mm minimal margins</li>
                <li>• <strong>Interactive Elements:</strong> Hidden when printing</li>
                <li>• <strong>Ink Efficiency:</strong> Optimized for minimal usage</li>
              </ul>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-2">How to Use:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Click the "Print A4 Timetable" button above</li>
              <li>The browser print dialog will open with A4 settings pre-selected</li>
              <li>Ensure "More settings" → "Paper size" is set to "A4"</li>
              <li>Set margins to "Minimum" or "Default" for best fit</li>
              <li>Click "Print" - the timetable will fit perfectly on one A4 page</li>
            </ol>
          </div>

          {/* Color Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Module Category Colors:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></div>
                <span><strong>[S]</strong> - Specific Modules</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
                <span><strong>[G]</strong> - General Modules</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded mr-2"></div>
                <span><strong>[C]</strong> - Complementary Modules</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}