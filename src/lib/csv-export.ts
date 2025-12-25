export interface TimetableEntry {
    id: string
    day: string
    period: number
    startTime: string
    endTime: string
    class: {
        name: string
        level: string
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

export interface CSVExportOptions {
    title: string
    fileName?: string
}

/**
 * Converts timetable entries to CSV format and triggers download
 */
export async function exportTimetableToCSV(
    entries: TimetableEntry[],
    options: CSVExportOptions
): Promise<void> {
    try {
        // Create CSV headers
        const headers = [
            'Day',
            'Period',
            'Start Time',
            'End Time',
            'Class Name',
            'Class Level',
            'Teacher Name',
            'Subject',
            'Module',
            'Module Category'
        ]

        // Create CSV rows
        const rows = entries.map(entry => [
            entry.day,
            entry.period.toString(),
            entry.startTime,
            entry.endTime,
            entry.class.name,
            entry.class.level,
            entry.teacher.name,
            entry.subject?.name || '',
            entry.module?.name || '',
            entry.module?.category || ''
        ])

        // Combine headers and rows
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
            .join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', options.fileName || `${options.title.replace(/\\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    } catch (error) {
        console.error('CSV export failed:', error)
        throw error
    }
}

/**
 * Converts timetable entries to a formatted table for CSV export
 * This creates a more readable format with days as columns and periods as rows
 */
export async function exportTimetableGridToCSV(
    entries: TimetableEntry[],
    options: CSVExportOptions
): Promise<void> {
    try {
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
        const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        // Create headers
        const headers = ['Period/Time', ...days.map(day => day.charAt(0) + day.slice(1).toLowerCase())]

        // Create period time mapping
        const periodTimes: { [key: number]: string } = {
            1: '08:00-08:40',
            2: '08:40-09:20',
            3: '09:20-10:00',
            4: '10:20-11:00',
            5: '11:00-11:40',
            6: '13:10-13:50',
            7: '13:50-14:30',
            8: '14:30-15:10',
            9: '15:30-16:10',
            10: '16:10-16:50'
        }

        // Create grid data
        const rows: string[][] = []

        periods.forEach(period => {
            const row = [`P${period} (${periodTimes[period]})`]

            days.forEach(day => {
                const entry = entries.find(e => e.day === day && e.period === period)
                if (entry) {
                    const subjectName = entry.subject?.name || entry.module?.name || 'N/A'
                    const teacherName = entry.teacher.name
                    const className = entry.class.name
                    row.push(`${subjectName} - ${teacherName} (${className})`)
                } else {
                    row.push('FREE')
                }
            })

            rows.push(row)
        })

        // Add break rows
        rows.splice(3, 0, ['BREAK (10:00-10:20)', ...Array(days.length).fill('MORNING BREAK')])
        rows.splice(6, 0, ['BREAK (11:40-13:10)', ...Array(days.length).fill('LUNCH BREAK')])
        rows.splice(10, 0, ['BREAK (15:10-15:30)', ...Array(days.length).fill('AFTERNOON BREAK')])

        // Combine headers and rows
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
            .join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', options.fileName || `${options.title.replace(/\\s+/g, '_').toLowerCase()}_grid_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    } catch (error) {
        console.error('CSV grid export failed:', error)
        throw error
    }
}