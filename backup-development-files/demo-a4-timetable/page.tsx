'use client'

import { useState } from 'react'
import CompactA4Timetable from '@/components/timetable/CompactA4Timetable'

// Sample timetable data for demonstration
const sampleTimetableData = [
  {
    id: '1',
    day: 'MONDAY',
    period: 1,
    startTime: '08:00',
    endTime: '08:40',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'John Doe' },
    subject: { name: 'Mathematics' },
    module: { name: 'MATH-101', category: 'SPECIFIC' }
  },
  {
    id: '2',
    day: 'MONDAY',
    period: 2,
    startTime: '08:40',
    endTime: '09:20',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'Jane Smith' },
    module: { name: 'Physics Lab', category: 'GENERAL' }
  },
  {
    id: '3',
    day: 'TUESDAY',
    period: 3,
    startTime: '09:20',
    endTime: '10:00',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'Bob Johnson' },
    module: { name: 'English Comprehension', category: 'COMPLEMENTARY' }
  },
  {
    id: '4',
    day: 'WEDNESDAY',
    period: 4,
    startTime: '10:20',
    endTime: '11:00',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'Alice Brown' },
    subject: { name: 'Chemistry' }
  },
  {
    id: '5',
    day: 'THURSDAY',
    period: 5,
    startTime: '11:00',
    endTime: '11:40',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'Charlie Wilson' },
    module: { name: 'Computer Science', category: 'SPECIFIC' }
  },
  {
    id: '6',
    day: 'FRIDAY',
    period: 6,
    startTime: '13:10',
    endTime: '13:50',
    class: { name: 'L3 ELTA', level: 'Level 3' },
    teacher: { name: 'Diana Davis' },
    module: { name: 'Physical Education', category: 'GENERAL' }
  }
]

export default function DemoA4Timetable() {
  const [viewMode, setViewMode] = useState<'regular' | 'compact'>('compact')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            A4 Compact Timetable Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This demonstrates the compact A4 format timetable that fits on one page for printing.
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-4 py-2 rounded-md font-medium ${
                viewMode === 'compact'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Compact A4 View
            </button>
            <button
              onClick={() => setViewMode('regular')}
              className={`px-4 py-2 rounded-md font-medium ${
                viewMode === 'regular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Regular View
            </button>
          </div>
        </div>

        {/* Timetable Display */}
        {viewMode === 'compact' ? (
          <div className="flex justify-center">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <CompactA4Timetable
                entries={sampleTimetableData}
                title="L3 ELTA Class Timetable"
                className="compact-a4-container"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Regular View (Not A4 Optimized)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Time / Period</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Monday</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Tuesday</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Wednesday</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Thursday</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Friday</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(period => (
                    <tr key={period}>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        P{period}
                      </td>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                        const entry = sampleTimetableData.find(
                          e => e.day === day.toUpperCase() && e.period === period
                        )
                        return (
                          <td key={day} className="border border-gray-300 px-4 py-3 text-center">
                            {entry ? (
                              <div className="text-sm">
                                <div className="font-medium">{entry.module?.name || entry.subject?.name}</div>
                                <div className="text-gray-600">{entry.teacher.name}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Free</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Features Information */}
        <div className="mt-12 bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">A4 Compact Timetable Features:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>Optimized for A4 printing:</strong> Designed to fit perfectly on standard A4 paper (210×297mm)</li>
            <li>• <strong>Compact layout:</strong> Smaller fonts and optimized spacing for maximum information density</li>
            <li>• <strong>Print-friendly:</strong> Clean borders, proper margins, and print-optimized styling</li>
            <li>• <strong>Color coding:</strong> Different colors for module categories (Specific, General, Complementary)</li>
            <li>• <strong>Space efficient:</strong> Shows all 5 days and 10 periods in a single view</li>
            <li>• <strong>Teacher initials:</strong> Uses teacher initials to save space</li>
            <li>• <strong>Abbreviated names:</strong> Automatically abbreviates long module names</li>
            <li>• <strong>Monday-Friday only:</strong> Excludes Saturday scheduling as per requirements</li>
          </ul>
        </div>
      </div>
    </div>
  )
}