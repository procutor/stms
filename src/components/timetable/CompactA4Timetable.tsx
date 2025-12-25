'use client'

import { TimetableEntry } from './WeeklyGrid'

interface CompactA4TimetableProps {
  entries: TimetableEntry[]
  title: string
  className?: string
  showLegend?: boolean
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_NAMES = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday', 
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday'
}

// Compact period structure for A4 printing
const PERIODS = [
  { period: 1, time: '08:00' },
  { period: 2, time: '08:40' },
  { period: 3, time: '09:20' },
  { period: 4, time: '10:20' },
  { period: 5, time: '11:00' },
  { period: 6, time: '13:10' },
  { period: 7, time: '13:50' },
  { period: 8, time: '14:30' },
  { period: 9, time: '15:30' },
  { period: 10, time: '16:10' }
]

export default function CompactA4Timetable({ 
  entries, 
  title, 
  className = '',
  showLegend = true 
}: CompactA4TimetableProps) {
  
  // Organize entries by day and period
  const getEntriesByDayAndPeriod = () => {
    const grid: { [key: string]: { [key: number]: TimetableEntry[] } } = {}
    
    DAYS_OF_WEEK.forEach(day => {
      grid[day] = {}
      for (let period = 1; period <= 10; period++) {
        grid[day][period] = entries.filter(entry => 
          entry.day === day && entry.period === period
        )
      }
    })
    
    return grid
  }

  const gridData = getEntriesByDayAndPeriod()
  
  const getEntryDisplayText = (entry: TimetableEntry) => {
    // Compact text for A4 - just module name and teacher initial
    const moduleName = entry.module?.name || entry.subject?.name || 'FREE'
    const teacherName = entry.teacher.name
    const teacherInitial = teacherName.split(' ').map(n => n[0]).join('').toUpperCase()
    return `${moduleName}\n${teacherInitial}`
  }

  const getEntryBackgroundColor = (entry: TimetableEntry) => {
    if (entry.module) {
      switch (entry.module.category) {
        case 'SPECIFIC':
          return 'bg-blue-50 border-blue-200'
        case 'GENERAL':
          return 'bg-green-50 border-green-200'
        case 'COMPLEMENTARY':
          return 'bg-purple-50 border-purple-200'
        default:
          return 'bg-gray-50 border-gray-200'
      }
    }
    return 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`bg-white ${className}`} style={{ 
      width: '210mm', 
      height: '297mm',
      fontSize: '5px',
      lineHeight: '0.8',
      margin: '0',
      padding: '2mm'
    }}>
      {/* Ultra-Minimal Print Header */}
      <div className="text-center border-b border-gray-400 mb-1" style={{ padding: '1mm' }}>
        <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '10px' }}>{title}</h1>
        <p className="text-gray-600" style={{ fontSize: '6px' }}>Weekly Timetable - Monday to Friday</p>
        <p className="text-gray-500" style={{ fontSize: '5px' }}>{new Date().toLocaleDateString()}</p>
      </div>

      {/* Ultra-Minimal Timetable Grid */}
      <div className="w-full">
        {/* Header Row */}
        <div className="grid grid-cols-6 border border-gray-400 bg-gray-100" style={{ height: '8mm' }}>
          <div className="text-center font-bold border-r border-gray-400 flex items-center justify-center" style={{ fontSize: '5px', padding: '0.5mm' }}>
            Period
          </div>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center font-bold border-r border-gray-400 last:border-r-0 flex items-center justify-center" style={{ fontSize: '5px', padding: '0.5mm' }}>
              {DAY_NAMES[day as keyof typeof DAY_NAMES].substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Ultra-Minimal Period Rows */}
        {PERIODS.map((periodData) => (
          <div key={periodData.period} className="grid grid-cols-6 border-b border-l border-r border-gray-400" style={{ height: '8mm' }}>
            {/* Period Column */}
            <div className="text-center font-medium border-r border-gray-400 bg-gray-50 flex items-center justify-center" style={{ fontSize: '5px', padding: '0.3mm' }}>
              P{periodData.period}
            </div>

            {/* Day Columns */}
            {DAYS_OF_WEEK.map(day => {
              const dayEntries = gridData[day][periodData.period]
              
              return (
                <div
                  key={`${day}-${periodData.period}`}
                  className="border-r border-gray-400 last:border-r-0 relative flex items-center justify-center"
                  style={{ minHeight: '8mm', padding: '0.2mm' }}
                >
                  {dayEntries.length > 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {dayEntries.slice(0, 1).map(entry => (
                        <div
                          key={entry.id}
                          className={`
                            w-full h-full text-center flex items-center justify-center
                            border font-medium rounded
                            ${getEntryBackgroundColor(entry)}
                          `}
                          title={getEntryDisplayText(entry)}
                          style={{ fontSize: '4px' }}
                        >
                          {/* Ultra-minimal display */}
                          {(() => {
                            const moduleName = entry.module?.name || entry.subject?.name || 'FREE'
                            const teacherName = entry.teacher.name
                            const teacherInitial = teacherName.split(' ').map(n => n[0]).join('').toUpperCase()
                            
                            // Ultra-abbreviate module name to 3 chars max
                            const abbreviatedModule = moduleName.length > 3 
                              ? moduleName.substring(0, 2) + '.'
                              : moduleName
                            
                            return `${abbreviatedModule} ${teacherInitial}`
                          })()}
                        </div>
                      ))}
                      {dayEntries.length > 1 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full flex items-center justify-center" style={{ width: '6px', height: '6px', fontSize: '4px' }}>
                          {dayEntries.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400" style={{ fontSize: '4px' }}>
                      -
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Ultra-Minimal Legend & Footer */}
      <div className="mt-1 pt-0.5 border-t border-gray-400">
        <div className="flex items-center justify-between" style={{ fontSize: '4px' }}>
          <div className="flex items-center space-x-1">
            <span className="font-medium">Types:</span>
            <div className="flex items-center space-x-0.5">
              <div className="flex items-center">
                <div className="w-0.5 h-0.5 bg-blue-50 border border-blue-200 rounded mr-0.5"></div>
                <span>[S]</span>
              </div>
              <div className="flex items-center">
                <div className="w-0.5 h-0.5 bg-green-50 border border-green-200 rounded mr-0.5"></div>
                <span>[G]</span>
              </div>
              <div className="flex items-center">
                <div className="w-0.5 h-0.5 bg-purple-50 border border-purple-200 rounded mr-0.5"></div>
                <span>[C]</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500">
              System • P1
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}