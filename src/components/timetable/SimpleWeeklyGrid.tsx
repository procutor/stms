'use client'

import { useState } from 'react'
import { Users, User, AlertTriangle } from 'lucide-react'
import ExportMenu from './ExportMenu'
import { ExportOptions } from '@/lib/export-utils'

export interface TimetableEntry {
  id: string
  day: string
  period: number
  startTime: string
  endTime: string
  class?: {
    name: string
    level: string
    trade?: string
  }
  teacher: {
    name: string
  }
  subject?: {
    name: string
  }
  module?: {
    name: string
    category: string
  }
}

interface SimpleWeeklyGridProps {
  entries: TimetableEntry[]
  title: string
  viewType: 'class' | 'teacher'
  onSlotClick?: (entry: TimetableEntry) => void
  conflicts?: string[]
  isReadOnly?: boolean
  exportOptions?: ExportOptions
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_NAMES = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday', 
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday'
}

// Exact school time structure with correct period numbers (1-10 as specified)
const TIME_SLOTS = [
  { period: 1, start: '08:00', end: '08:40', label: '08:00' },
  { period: 2, start: '08:40', end: '09:20', label: '08:40' },
  { period: 3, start: '09:20', end: '10:00', label: '09:20' },
  { period: 4, start: '10:20', end: '11:00', label: '10:20' },
  { period: 5, start: '11:00', end: '11:40', label: '11:00' },
  { period: 6, start: '13:10', end: '13:50', label: '13:10' },
  { period: 7, start: '13:50', end: '14:30', label: '13:50' },
  { period: 8, start: '14:30', end: '15:10', label: '14:30' },
  { period: 9, start: '15:30', end: '16:10', label: '15:30' },
  { period: 10, start: '16:10', end: '16:50', label: '16:10' }
]

// Break definitions for display (between periods)
const BREAKS = [
  { name: 'MORNING BREAK'},
  { name: 'LUNCH BREAK', time: '11:40 – 13:10', start: '11:40', end: '13:10', afterPeriod: 5 },
  { name: 'AFTERNOON BREAK', time: '15:10 – 15:30', start: '15:10', end: '15:30', afterPeriod: 8 }
]

export default function SimpleWeeklyGrid({
  entries,
  title,
  viewType,
  onSlotClick,
  conflicts = [],
  isReadOnly = false,
  exportOptions
}: SimpleWeeklyGridProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  
  // Get max period number to determine grid size (now limited to P1-P10)
  const maxPeriod = Math.max(...entries.map(e => e.period), 10)
  
  // Organize entries by day and period
  const getEntriesByDayAndPeriod = () => {
    const grid: { [key: string]: { [key: number]: TimetableEntry[] } } = {}
    
    DAYS_OF_WEEK.forEach(day => {
      grid[day] = {}
      for (let period = 1; period <= maxPeriod; period++) {
        grid[day][period] = entries.filter(entry => 
          entry.day === day && entry.period === period
        )
      }
    })
    
    return grid
  }

  const gridData = getEntriesByDayAndPeriod()
  
  const getEntryDisplayText = (entry: TimetableEntry) => {
    if (viewType === 'class') {
      // For class view: show subject/module and teacher
      const subjectName = entry.subject?.name || entry.module?.name || 'Free Period'
      const teacherName = entry.teacher.name
      return `${subjectName}\n${teacherName}`
    } else {
      // For teacher view: show subject/module and class
      const subjectName = entry.subject?.name || entry.module?.name || 'Free Period'
      const className = entry.class?.name || 'Unknown Class'
      return `${subjectName}\n${className}`
    }
  }

  const getEntryBackgroundColor = (entry: TimetableEntry) => {
    if (entry.module) {
      // Color code by module category
      switch (entry.module.category) {
        case 'SPECIFIC':
          return 'bg-blue-100 border-blue-300 text-blue-800'
        case 'GENERAL':
          return 'bg-green-100 border-green-300 text-green-800'
        case 'COMPLEMENTARY':
          return 'bg-purple-100 border-purple-300 text-purple-800'
        default:
          return 'bg-gray-100 border-gray-300 text-gray-800'
      }
    }
    return 'bg-blue-50 border-blue-200 text-blue-700'
  }

  const hasConflict = (day: string, period: number) => {
    return conflicts.some(conflict => 
      conflict.includes(day) && conflict.includes(`Period ${period}`)
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {viewType === 'class' ? (
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Class Timetable View
                </span>
              ) : (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Teacher Timetable View
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {conflicts.length > 0 && (
              <div className="flex items-center text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{conflicts.length} conflicts</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {entries.length} scheduled lessons
            </div>
            {exportOptions && (
              <ExportMenu
                entries={entries}
                options={exportOptions}
                className="ml-4"
              />
            )}
          </div>
        </div>
      </div>

      {/* Simple Weekly Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row */}
          <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50">
            <div className="p-3 text-center font-medium text-gray-700 border-r border-gray-200">
              Time
            </div>
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {DAY_NAMES[day as keyof typeof DAY_NAMES]}
              </div>
            ))}
          </div>

          {/* Time Period Rows with Breaks */}
          {TIME_SLOTS.slice(0, maxPeriod).map((timeSlot, index) => (
            <div key={`period-${timeSlot.period}`}>
              {/* Check if we need to add a break row */}
              {BREAKS.map(breakItem =>
                breakItem.afterPeriod === timeSlot.period && (
                  <div key={`break-${breakItem.name}`} className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="col-span-6 p-6 min-h-[80px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-2">
                          <span className="text-3xl">
                            {breakItem.name.includes('MORNING') ? '🌅' : 
                             breakItem.name.includes('LUNCH') ? '🍽️' : '☕'}
                          </span>
                          <div className="font-bold text-2xl text-amber-800">{breakItem.name}</div>
                          <span className="text-3xl">
                            {breakItem.name.includes('MORNING') ? '🌅' : 
                             breakItem.name.includes('LUNCH') ? '🍽️' : '☕'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
              
              {/* Regular Period Row */}
              <div key={`period-${timeSlot.period}`} className="grid grid-cols-6 border-b border-gray-200 hover:bg-gray-50">
                {/* Time Column */}
                <div className="p-3 text-center font-medium text-gray-600 border-r border-gray-200 bg-gray-50">
                  <div className="font-bold text-sm">{timeSlot.label}</div>
                  <div className="text-xs text-gray-500">P{timeSlot.period}</div>
                </div>
                
                {/* Day Columns */}
                {DAYS_OF_WEEK.map(day => {
                  const dayEntries = gridData[day][timeSlot.period] || []
                  const isConflict = hasConflict(day, timeSlot.period)
                  
                  return (
                    <div
                      key={`${day}-${timeSlot.period}`}
                      className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] relative ${
                        isConflict ? 'bg-red-50' : ''
                      }`}
                    >
                      {isConflict && (
                        <div className="absolute top-1 right-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                      
                      {dayEntries.length > 0 ? (
                        <div className="space-y-2">
                          {dayEntries.map(entry => (
                            <div
                              key={entry.id}
                              className={`
                                p-2 rounded border text-xs cursor-pointer transition-colors
                                ${getEntryBackgroundColor(entry)}
                                ${!isReadOnly && onSlotClick ? 'hover:opacity-80' : ''}
                              `}
                              onClick={() => !isReadOnly && onSlotClick?.(entry)}
                            >
                              <div className="font-medium whitespace-pre-line">
                                {getEntryDisplayText(entry)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-xs mt-4">
                          Free Period
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {entries.some(e => e.module) && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-gray-700">Module Categories:</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
                <span>[SPECIFIC]</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                <span>[GENERAL]</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded mr-1"></div>
                <span>[COMPLEMENTARY]</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}