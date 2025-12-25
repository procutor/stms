import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { TimetableEntry } from '@/components/timetable/WeeklyGrid'

export interface ExportOptions {
  title: string
  subtitle?: string
  schoolName?: string
  academicYear?: string
  term?: string
  teacherName?: string
  className?: string
  classLevel?: string
  classStream?: string
  classTrade?: string
  viewType?: 'class' | 'teacher'
}

// Define the exact time structure for exports (matching database)
const PERIOD_STRUCTURE = [
  { period: 1, start: '08:00', end: '08:40', name: 'P1', isBreak: false },
  { period: 2, start: '08:40', end: '09:20', name: 'P2', isBreak: false },
  { period: 3, start: '09:20', end: '10:00', name: 'P3', isBreak: false },
  { period: 11, start: '10:00', end: '10:20', name: 'MORNING BREAK', isBreak: true },
  { period: 4, start: '10:20', end: '11:00', name: 'P4', isBreak: false },
  { period: 5, start: '11:00', end: '11:40', name: 'P5', isBreak: false },
  { period: 12, start: '11:40', end: '13:10', name: 'LUNCH BREAK', isBreak: true },
  { period: 6, start: '13:10', end: '13:50', name: 'P6', isBreak: false },
  { period: 7, start: '13:50', end: '14:30', name: 'P7', isBreak: false },
  { period: 8, start: '14:30', end: '15:10', name: 'P8', isBreak: false },
  { period: 13, start: '15:10', end: '15:30', name: 'AFTERNOON BREAK', isBreak: true },
  { period: 9, start: '15:30', end: '16:10', name: 'P9', isBreak: false },
  { period: 10, start: '16:10', end: '16:50', name: 'P10', isBreak: false },
  { period: 14, start: '16:50', end: '16:55', name: 'END OF DAY', isBreak: true }
]

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_NAMES = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday'
}

export class TimetableExporter {
  
  /**
   * Export timetable to PDF
   */
  static exportToPDF(entries: TimetableEntry[], options: ExportOptions) {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Header Section
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    
    // School Name (centered, bold)
    if (options.schoolName) {
      const schoolNameLines = pdf.splitTextToSize(options.schoolName, pageWidth - 2 * margin)
      pdf.text(schoolNameLines, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += schoolNameLines.length * 6 + 3
    }

    // Academic Year & Term
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    if (options.academicYear && options.term) {
      const academicText = `ACADEMIC YEAR: ${options.academicYear} | TERM: ${options.term}`
      pdf.text(academicText, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
    }

    // Main Title
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('SCHOOL TIMETABLE', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Class or Teacher Information
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    if (options.viewType === 'class' && options.className) {
      // For class timetables: show Class Name (Level + Stream + Trade)
      let classDisplay = options.className
      if (options.classLevel) classDisplay += `, ${options.classLevel}`
      if (options.classStream) classDisplay += ` ${options.classStream}`
      if (options.classTrade) classDisplay += ` ${options.classTrade}`
      
      pdf.text(classDisplay, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
    } else if (options.viewType === 'teacher' && options.teacherName) {
      // For teacher timetables: show Teacher Full Name
      pdf.text(`Teacher: ${options.teacherName}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
    }

    yPosition += 5

    // Table Setup
    const days = DAYS_OF_WEEK
    const colWidth = (pageWidth - 2 * margin) / 6 // 6 columns: Time/Period + 5 days
    const rowHeight = 12
    const headerHeight = 15

    // Table Header
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(240, 240, 240)

    // Time/Period column
    pdf.rect(margin, yPosition, colWidth, headerHeight, 'F')
    pdf.text('Time / Period', margin + colWidth/2, yPosition + 10, { align: 'center' })

    // Day columns
    days.forEach((day, index) => {
      const x = margin + (index + 1) * colWidth
      pdf.rect(x, yPosition, colWidth, headerHeight, 'F')
      pdf.text(DAY_NAMES[day as keyof typeof DAY_NAMES], x + colWidth/2, yPosition + 10, { align: 'center' })
    })
    
    yPosition += headerHeight

    // Data rows
    for (const periodData of PERIOD_STRUCTURE) {
      // Period/Time column
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.rect(margin, yPosition, colWidth, rowHeight)
      
      // Period name and time
      const periodText = periodData.name
      const timeText = `${periodData.start} - ${periodData.end}`
      pdf.text(periodText, margin + colWidth/2, yPosition + 6, { align: 'center' })
      pdf.setFontSize(7)
      pdf.text(timeText, margin + colWidth/2, yPosition + 10, { align: 'center' })
      pdf.setFontSize(9)
      
      // Day data columns
      days.forEach((day, dayIndex) => {
        const x = margin + (dayIndex + 1) * colWidth
        
        if (periodData.isBreak) {
          // Break rows - span all columns and are non-schedulable
          pdf.setFillColor(254, 243, 199) // amber-100
          pdf.rect(x, yPosition, colWidth, rowHeight, 'F')
          
          // Draw break text
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(10)
          pdf.text(periodData.name, x + colWidth/2, yPosition + 7, { align: 'center' })
          pdf.setFontSize(9)
        } else {
          const dayEntries = entries.filter(entry => entry.day === day && entry.period === periodData.period)
          
          if (dayEntries.length > 0) {
            // Set background color based on module category
            const entry = dayEntries[0]
            if (entry.module) {
              switch (entry.module.category) {
                case 'SPECIFIC':
                  pdf.setFillColor(219, 234, 254) // blue-100
                  break
                case 'GENERAL':
                  pdf.setFillColor(220, 252, 231) // green-100
                  break
                case 'COMPLEMENTARY':
                  pdf.setFillColor(245, 243, 255) // purple-100
                  break
                default:
                  pdf.setFillColor(249, 250, 251) // gray-50
              }
              pdf.rect(x, yPosition, colWidth, rowHeight, 'F')
            }
            
            pdf.setFontSize(8)
            const subjectName = entry.subject?.name || entry.module?.name || 'Free Period'
            const additionalInfo = options.teacherName ? 
              entry.class?.name || '' : 
              entry.teacher.name
            
            // Format cell content
            const cellText = `${subjectName}\n${additionalInfo}`
            if (entry.module) {
              const categoryText = `[${entry.module.category}]`
              const lines = pdf.splitTextToSize(`${cellText}\n${categoryText}`, colWidth - 4)
              lines.forEach((line: string, lineIndex: number) => {
                pdf.text(line, x + colWidth/2, yPosition + 4 + (lineIndex * 3), { align: 'center' })
              })
            } else {
              const lines = pdf.splitTextToSize(cellText, colWidth - 4)
              lines.forEach((line: string, lineIndex: number) => {
                pdf.text(line, x + colWidth/2, yPosition + 4 + (lineIndex * 3), { align: 'center' })
              })
            }
          } else {
            pdf.rect(x, yPosition, colWidth, rowHeight)
            pdf.setFontSize(8)
            pdf.setTextColor(156, 163, 175) // gray-400
            pdf.text('Free Period', x + colWidth/2, yPosition + 7, { align: 'center' })
            pdf.setTextColor(0, 0, 0) // Reset to black
          }
        }
      })
      
      yPosition += rowHeight
      
      // Add new page if needed
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }
    }

    // Footer
    const footerY = pageHeight - 20
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, footerY)
    pdf.text(`School Timetable Management System`, pageWidth - margin, footerY, { align: 'right' })

    // Save the PDF
    const filename = `${options.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  }

  /**
   * Export timetable to Excel
   */
  static exportToExcel(entries: TimetableEntry[], options: ExportOptions) {
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for Excel
    const days = DAYS_OF_WEEK
    
    // Create worksheet data
    const worksheetData: (string | number)[][] = []
    
    // Header rows for school information
    if (options.schoolName) {
      worksheetData.push([options.schoolName])
    }
    if (options.academicYear && options.term) {
      worksheetData.push([`ACADEMIC YEAR: ${options.academicYear} | TERM: ${options.term}`])
    }
    worksheetData.push(['SCHOOL TIMETABLE'])
    
    // Class or Teacher information
    if (options.viewType === 'class' && options.className) {
      let classDisplay = options.className
      if (options.classLevel) classDisplay += `, ${options.classLevel}`
      if (options.classStream) classDisplay += ` ${options.classStream}`
      if (options.classTrade) classDisplay += ` ${options.classTrade}`
      worksheetData.push([classDisplay])
    } else if (options.viewType === 'teacher' && options.teacherName) {
      worksheetData.push([`Teacher: ${options.teacherName}`])
    }
    
    worksheetData.push([]) // Empty row
    
    // Table header
    const headerRow: (string | number)[] = ['Time / Period', ...days.map(day => day.substring(0, 3))]
    worksheetData.push(headerRow)
    
    // Data rows
    for (const periodData of PERIOD_STRUCTURE) {
      if (periodData.isBreak) {
        // Break rows
        const breakRow: (string | number)[] = [
          `${periodData.name} (${periodData.start} - ${periodData.end})`,
          ...days.map(() => periodData.name)
        ]
        worksheetData.push(breakRow)
      } else {
        // Regular period rows
        const row: (string | number)[] = [
          `${periodData.name} (${periodData.start} - ${periodData.end})`
        ]
        
        days.forEach(day => {
          const dayEntries = entries.filter(entry => entry.day === day && entry.period === periodData.period)
          
          if (dayEntries.length > 0) {
            const entry = dayEntries[0]
            const subjectName = entry.subject?.name || entry.module?.name || 'Free Period'
            const additionalInfo = options.teacherName ?
              entry.class?.name || '' :
              entry.teacher.name
            
            let cellContent = `${subjectName}\n${additionalInfo}`
            if (entry.module) {
              cellContent += `\n[${entry.module.category}]`
            }
            row.push(cellContent)
          } else {
            row.push('Free Period')
          }
        })
        
        worksheetData.push(row)
      }
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Time/Period column
      ...days.map(() => ({ wch: 20 })) // Day columns
    ]
    worksheet['!cols'] = columnWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable')
    
    // Add metadata sheet
    const metadata = [
      ['Title', options.title],
      ['Subtitle', options.subtitle || ''],
      ['School', options.schoolName || ''],
      ['Academic Year', options.academicYear || ''],
      ['Term', options.term || ''],
      ['Teacher', options.teacherName || ''],
      ['Class', options.className || ''],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Legend:'],
      ['[SPECIFIC]', 'Blue background - Priority morning scheduling'],
      ['[GENERAL]', 'Green background - Secondary morning preference'],
      ['[COMPLEMENTARY]', 'Purple background - Fills remaining slots']
    ]
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadata)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Info')
    
    // Save the file
    const filename = `${options.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  /**
   * Generate print-friendly HTML
   */
  static generatePrintHTML(entries: TimetableEntry[], options: ExportOptions): string {
    const days = DAYS_OF_WEEK
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${options.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background: white;
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .school-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 8px; 
          }
          .academic-info { 
            font-size: 12px; 
            color: #666; 
            margin-bottom: 5px; 
          }
          .title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 8px; 
          }
          .class-info { 
            font-size: 14px; 
            font-weight: bold; 
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 10px;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 6px; 
            text-align: center; 
            vertical-align: top;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
            font-size: 10px;
          }
          .time-period-cell { 
            background-color: #f9f9f9; 
            font-weight: bold; 
            width: 120px;
            font-size: 9px;
          }
          .lesson-cell { 
            min-height: 50px; 
            font-size: 9px; 
          }
          .free-period { 
            color: #999; 
            font-style: italic; 
          }
          .break-cell {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            font-weight: bold;
            color: #92400e;
            font-size: 10px;
          }
          .specific { background-color: #dbeafe; }
          .general { background-color: #dcfce7; }
          .complementary { background-color: #f3e8ff; }
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${options.schoolName ? `<div class="school-name">${options.schoolName}</div>` : ''}
          ${options.academicYear && options.term ? `<div class="academic-info">ACADEMIC YEAR: ${options.academicYear} | TERM: ${options.term}</div>` : ''}
          <div class="title">SCHOOL TIMETABLE</div>
          ${options.viewType === 'class' && options.className ? 
            `<div class="class-info">${options.className}${options.classLevel ? `, ${options.classLevel}` : ''}${options.classStream ? ` ${options.classStream}` : ''}${options.classTrade ? ` ${options.classTrade}` : ''}</div>` :
            options.viewType === 'teacher' && options.teacherName ?
            `<div class="class-info">Teacher: ${options.teacherName}</div>` : ''
          }
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Time / Period</th>
              ${days.map(day => `<th>${DAY_NAMES[day as keyof typeof DAY_NAMES]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `
    
    for (const periodData of PERIOD_STRUCTURE) {
      if (periodData.isBreak) {
        // Break rows span all columns
        html += `<tr><td class="break-cell time-period-cell">${periodData.name}<br>${periodData.start} - ${periodData.end}</td>`
        html += `<td class="break-cell" colspan="5">${periodData.name}</td></tr>`
      } else {
        html += `<tr><td class="time-period-cell">${periodData.name}<br>${periodData.start} - ${periodData.end}</td>`
        
        days.forEach(day => {
          const dayEntries = entries.filter(entry => entry.day === day && entry.period === periodData.period)
          
          if (dayEntries.length > 0) {
            const entry = dayEntries[0]
            const subjectName = entry.subject?.name || entry.module?.name || 'Free Period'
            const additionalInfo = options.teacherName ? 
              entry.class?.name || '' : 
              entry.teacher.name
            
            let cellClass = 'lesson-cell'
            if (entry.module) {
              cellClass += ` ${entry.module.category.toLowerCase()}`
            }
            
            html += `<td class="${cellClass}">
              <div><strong>${subjectName}</strong></div>
              <div>${additionalInfo}</div>
              ${entry.module ? `<div style="font-size: 8px; color: #666;">[${entry.module.category}]</div>` : ''}
            </td>`
          } else {
            html += `<td class="lesson-cell free-period">Free Period</td>`
          }
        })
        
        html += `</tr>`
      }
    }
    
    html += `
          </tbody>
        </table>
        
        <div class="footer">
          <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>School Timetable Management System</div>
        </div>
      </body>
      </html>
    `
    
    return html
  }

  /**
   * Open print dialog
   */
  static printTimetable(entries: TimetableEntry[], options: ExportOptions) {
    const html = this.generatePrintHTML(entries, options)
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }
}
