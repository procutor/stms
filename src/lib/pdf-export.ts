import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

export interface PDFExportOptions {
  title: string
  className?: string
  schoolName?: string
  includeLegend?: boolean
  fileName?: string
}

export class TimetablePDFExporter {
  private pdf: jsPDF
  private pageWidth: number = 297 // A4 landscape width in mm
  private pageHeight: number = 210 // A4 landscape height in mm
  private margin: number = 10
  private contentWidth: number = 277
  private contentHeight: number = 190

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
  }

  /**
   * Generate PDF from timetable entries
   */
  async generatePDF(entries: TimetableEntry[], options: PDFExportOptions): Promise<void> {
    try {
      // Create temporary HTML element for rendering
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '297mm'
      tempDiv.style.height = '210mm'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      // Create the compact timetable HTML
      tempDiv.innerHTML = this.generateTimetableHTML(entries, options)
      document.body.appendChild(tempDiv)

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 1123, // A4 landscape width in pixels at 96 DPI
        height: 794, // A4 landscape height in pixels at 96 DPI
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      })

      // Clean up
      document.body.removeChild(tempDiv)

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = this.pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // Add watermark if school name is provided
      if (options.schoolName) {
        this.addWatermark(options.schoolName)
      }

      // Save the PDF
      const fileName = options.fileName || `timetable_${new Date().toISOString().split('T')[0]}.pdf`
      this.pdf.save(fileName)

    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  /**
   * Add watermark to the PDF
   */
  private addWatermark(schoolName: string): void {
    // Set watermark properties
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(60)
    this.pdf.setTextColor(200, 200, 200) // Light gray color
    
    // Calculate position to center the watermark
    const textWidth = this.pdf.getTextWidth(schoolName)
    const x = (this.pageWidth - textWidth) / 2
    const y = this.pageHeight / 2
    
    // Add the watermark text (simple non-rotated version for compatibility)
    this.pdf.text(schoolName, x, y)
  }

  /**
   * Generate HTML for the compact A4 timetable
   */
  private generateTimetableHTML(entries: TimetableEntry[], options: PDFExportOptions): string {
    // Detect if this is a teacher timetable based on title
    const isTeacherTimetable = options.title.toLowerCase().includes('teacher')
    const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const DAY_NAMES = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday', 
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday'
    }

    const PERIODS = [
      { period: 'ASSEMBLY', startTime: '07:45', endTime: '08:00', type: 'break', label: 'SCHOOL ASSEMBLY' },
      { period: 1, startTime: '08:00', endTime: '08:40', type: 'lesson' },
      { period: 2, startTime: '08:40', endTime: '09:20', type: 'lesson' },
      { period: 3, startTime: '09:20', endTime: '10:00', type: 'lesson' },
      { period: 'MORNING_BREAK', startTime: '10:00', endTime: '10:20', type: 'break', label: 'MORNING BREAK' },
      { period: 4, startTime: '10:20', endTime: '11:00', type: 'lesson' },
      { period: 5, startTime: '11:00', endTime: '11:40', type: 'lesson' },
      { period: 'LUNCH', startTime: '11:40', endTime: '13:10', type: 'break', label: 'LUNCH' },
      { period: 6, startTime: '13:10', endTime: '13:50', type: 'lesson' },
      { period: 7, startTime: '13:50', endTime: '14:30', type: 'lesson' },
      { period: 8, startTime: '14:30', endTime: '15:10', type: 'lesson' },
      { period: 'AFTERNOON_BREAK', startTime: '15:10', endTime: '15:30', type: 'break', label: 'AFTERNOON BREAK' },
      { period: 9, startTime: '15:30', endTime: '16:10', type: 'lesson' },
      { period: 10, startTime: '16:10', endTime: '16:50', type: 'lesson' }
    ]

    // Organize entries by day and period
    const gridData: { [key: string]: { [key: string | number]: TimetableEntry[] } } = {}
    
    DAYS_OF_WEEK.forEach(day => {
      gridData[day] = {}
      
      // Add lessons (periods 1-10)
      for (let period = 1; period <= 10; period++) {
        gridData[day][period] = entries.filter(entry => 
          entry.day === day && entry.period === period
        )
      }
      
      // Add individual breaks for teacher timetables
      if (isTeacherTimetable) {
        gridData[day]['MORNING_BREAK'] = []
        gridData[day]['LUNCH'] = []
        gridData[day]['AFTERNOON_BREAK'] = []
      }
    })

    const getEntryDisplay = (entry: TimetableEntry, isTeacherTimetable: boolean = false) => {
      const moduleName = entry.module?.name || entry.subject?.name || 'FREE'
      
      if (isTeacherTimetable && entry.class) {
        // For teacher timetables, show class name instead of teacher name
        const className = entry.class.name || 'Class'
        return `${moduleName}\n${className}`
      } else {
        // For class timetables, show full teacher name
        const teacherName = entry.teacher.name
        return `${moduleName}\n${teacherName}`
      }
    }

    return `
      <div style="
        width: 297mm;
        height: 210mm;
        margin: 0;
        padding: 4mm;
        font-family: Arial, sans-serif;
        font-size: 10px;
        line-height: 1.0;
        background-color: white;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          border-bottom: 2px solid ${isTeacherTimetable ? '#1e40af' : '#333'};
          padding: 2mm;
          margin-bottom: 2mm;
          background: ${isTeacherTimetable ? 'linear-gradient(135deg, #1e40af 0%, #000000 100%)' : 'transparent'};
          border-radius: 2px;
        ">
          <h1 style="
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 1mm 0;
            color: ${isTeacherTimetable ? '#ffffff' : '#333'};
            text-shadow: ${isTeacherTimetable ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'};
          ">${options.title}</h1>
          <p style="font-size: 10px; color: ${isTeacherTimetable ? '#e0e0e0' : '#666'}; margin: 0.5mm 0;">Weekly Timetable - Monday to Friday</p>
          <p style="font-size: 10px; color: ${isTeacherTimetable ? '#cccccc' : '#999'}; margin: 0;">${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Timetable Grid -->
        <div style="width: 100%;">
          <!-- Header Row -->
          <div style="
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            border: 1px solid ${isTeacherTimetable ? '#1e40af' : '#333'};
            background-color: ${isTeacherTimetable ? '#1e40af' : '#f0f0f0'};
            color: ${isTeacherTimetable ? '#ffffff' : '#333'};
          ">
            <div style="
              padding: 1.5mm;
              text-align: center;
              font-weight: ${isTeacherTimetable ? 'bold' : 'normal'};
              font-size: 10px;
              border-right: 1px solid ${isTeacherTimetable ? '#3b82f6' : '#333'};
              min-height: 12mm;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${isTeacherTimetable ? '#ffffff' : '#333'};
            ">Period</div>
            ${DAYS_OF_WEEK.map(day => `
              <div style="
                padding: 1.5mm;
                text-align: center;
                font-weight: ${isTeacherTimetable ? 'bold' : 'normal'};
                font-size: 10px;
                border-right: 1px solid ${isTeacherTimetable ? '#3b82f6' : '#333'};
                min-height: 12mm;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${isTeacherTimetable ? '#ffffff' : '#333'};
              ">${DAY_NAMES[day as keyof typeof DAY_NAMES]}</div>
            `).join('')}
          </div>

          <!-- Period Rows -->
          ${PERIODS.map(periodData => `
            <div style="
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              border-bottom: 1px solid #333;
              border-left: 1px solid #333;
              border-right: 1px solid #333;
            ">
              <!-- Period Cell -->
              <div style="
                padding: 1.5mm;
                text-align: center;
                font-size: 10px;
                font-weight: ${isTeacherTimetable ? 'bold' : 'normal'};
                background-color: ${isTeacherTimetable ? '#000000' : '#f9f9f9'};
                color: ${isTeacherTimetable ? '#ffffff' : '#333'};
                border-right: 1px solid ${isTeacherTimetable ? '#1e40af' : '#333'};
                min-height: 12mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              ">
                ${periodData.type === 'break' ? `
                  <div style="font-size: 10px; font-weight: bold; color: #666;">${periodData.label}</div>
                ` : `
                  <div>P${periodData.period}</div>
                `}
                <div style="font-size: 10px; font-weight: 400; margin-top: 0.3mm;">${periodData.startTime}-${periodData.endTime}</div>
              </div>

              ${periodData.type === 'break' ? `
                <!-- Merged Break Row -->
                <div style="
                  grid-column: 2 / -1;
                  padding: 3mm;
                  border-right: 1px solid #333;
                  min-height: 12mm;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  background-color: #f8f8f8;
                ">
                  <div style="
                    text-align: center;
                    color: #666;
                    font-size: 10px;
                    font-weight: bold;
                    line-height: 1.4;
                  ">
                    ${periodData.label}<br>
                    ${periodData.startTime}-${periodData.endTime}
                  </div>
                </div>
              ` : `
                <!-- Individual Day Cells for Lessons -->
                ${DAYS_OF_WEEK.map(day => {
                  const dayEntries = gridData[day][periodData.period]
                  return `
                    <div style="
                      padding: 1mm;
                      border-right: 1px solid #333;
                      min-height: 12mm;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      text-align: center;
                    ">
                      ${dayEntries.length > 0 ? dayEntries.slice(0, 1).map(entry => `
                        <div style="
                          font-size: 8.5px;
                          font-weight: normal;
                          line-height: 1.2;
                          white-space: pre-line;
                          color: #333;
                          text-align: center;
                        ">
                          ${getEntryDisplay(entry, isTeacherTimetable)}
                        </div>
                      `).join('') : `
                        <div style="
                          text-align: center;
                          color: #999;
                          font-size: 10px;
                          font-style: italic;
                          text-align: center;
                        ">FREE</div>
                      `}
                    </div>
                  `
                }).join('')}
              `}
            </div>
          `).join('')}
        </div>


      </div>
    `
  }

  /**
   * Generate PDF for multiple classes at once - ONE PAGE PER CLASS/TEACHER
   * Creates a multi-page PDF where each class/teacher gets their own full-page timetable
   */
  async generateBatchPDF(
    classTimetables: { className: string; entries: TimetableEntry[] }[],
    options: PDFExportOptions
  ): Promise<void> {
    // Reset the PDF to start fresh
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    // Generate a page for each class/teacher
    for (let i = 0; i < classTimetables.length; i++) {
      const classTimetable = classTimetables[i]
      const isTeacherTimetable = options.title.toLowerCase().includes('teacher')
      
      // Create temporary HTML element for rendering
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '297mm'
      tempDiv.style.height = '210mm'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      // Generate HTML for this class/teacher (same format as individual PDF)
      const classOptions = {
        ...options,
        title: isTeacherTimetable 
          ? `${options.title}`
          : `${options.title || 'Class'} - ${classTimetable.className}`
      }
      tempDiv.innerHTML = this.generateTimetableHTML(classTimetable.entries, classOptions)
      document.body.appendChild(tempDiv)

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 300))

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 1123, // A4 landscape width in pixels at 96 DPI
        height: 794, // A4 landscape height in pixels at 96 DPI
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      })

      // Clean up
      document.body.removeChild(tempDiv)

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = this.pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add new page for all except the first one
      if (i > 0) {
        this.pdf.addPage()
      }
      
      this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    }

    // Add watermark if school name is provided (to the first page)
    if (options.schoolName) {
      this.addWatermark(options.schoolName)
    }

    // Save with combined filename
    const fileName = options.fileName || `all_timetables_${new Date().toISOString().split('T')[0]}.pdf`
    this.pdf.save(fileName)
  }

  /**
   * Generate HTML for combined timetable view - ALL CLASSES ON ONE PAGE
   */
  private generateCombinedTimetableHTML(
    classTimetables: { className: string; entries: TimetableEntry[] }[],
    options: PDFExportOptions
  ): string {
    const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const DAY_NAMES = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday', 
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday'
    }

    const PERIODS = [
      { period: 1, startTime: '08:00', endTime: '08:40' },
      { period: 2, startTime: '08:40', endTime: '09:20' },
      { period: 3, startTime: '09:20', endTime: '10:00' },
      { period: 'BREAK1', label: 'Morning Break', startTime: '10:00', endTime: '10:20' },
      { period: 4, startTime: '10:20', endTime: '11:00' },
      { period: 5, startTime: '11:00', endTime: '11:40' },
      { period: 'BREAK2', label: 'Lunch Break', startTime: '11:40', endTime: '13:10' },
      { period: 6, startTime: '13:10', endTime: '13:50' },
      { period: 7, startTime: '13:50', endTime: '14:30' },
      { period: 8, startTime: '14:30', endTime: '15:10' },
      { period: 'BREAK3', label: 'Afternoon Break', startTime: '15:10', endTime: '15:30' },
      { period: 9, startTime: '15:30', endTime: '16:10' },
      { period: 10, startTime: '16:10', endTime: '16:50' }
    ]

    // Organize entries by class, day, and period
    const classDayPeriodGrid: { [className: string]: { [day: string]: { [period: number | string]: string } } } = {}
    
    classTimetables.forEach(classTimetable => {
      classDayPeriodGrid[classTimetable.className] = {}
      
      DAYS_OF_WEEK.forEach(day => {
        classDayPeriodGrid[classTimetable.className][day] = {}
        
        PERIODS.forEach(periodData => {
          if (typeof periodData.period === 'number') {
            const entry = classTimetable.entries.find(e => 
              e.day === day && e.period === periodData.period
            )
            classDayPeriodGrid[classTimetable.className][day][periodData.period] = entry 
              ? `${entry.module?.name || entry.subject?.name || 'N/A'}\n${entry.teacher.name}`
              : 'FREE'
          } else {
            classDayPeriodGrid[classTimetable.className][day][periodData.period] = ''
          }
        })
      })
    })

    return `
      <div style="
        width: 297mm;
        min-height: 210mm;
        margin: 0;
        padding: 3mm;
        font-family: Arial, sans-serif;
        font-size: 7px;
        line-height: 1.1;
        background-color: white;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          border-bottom: 2px solid #333;
          padding: 2mm;
          margin-bottom: 3mm;
        ">
          <h1 style="
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 1mm 0;
            color: #333;
          ">${options.title}</h1>
          <p style="font-size: 9px; color: #666; margin: 0;">Complete School Timetable - All Classes</p>
          <p style="font-size: 8px; color: #999; margin: 0.5mm 0 0 0;">Generated: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <!-- Summary -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 5mm;
          margin-bottom: 3mm;
          padding: 2mm;
          background-color: #f5f5f5;
          border-radius: 2px;
        ">
          <div style="font-size: 8px; color: #666;">
            <strong>Total Classes:</strong> ${classTimetables.length}
          </div>
          <div style="font-size: 8px; color: #666;">
            <strong>Days:</strong> Monday to Friday
          </div>
          <div style="font-size: 8px; color: #666;">
            <strong>Periods:</strong> 10 periods + 3 breaks
          </div>
        </div>

        <!-- Combined Timetable Grid for All Classes -->
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6px;">
            <thead>
              <tr>
                <th style="border: 1px solid #333; padding: 1mm; background-color: #e0e0e0; font-size: 7px; width: 12mm;">Class</th>
                ${DAYS_OF_WEEK.map(day => `
                  <th style="border: 1px solid #333; padding: 1mm; background-color: #e0e0e0; font-size: 7px; text-align: center;">${DAY_NAMES[day as keyof typeof DAY_NAMES]}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${classTimetables.map(classTimetable => `
                <tr>
                  <td style="border: 1px solid #333; padding: 1mm; background-color: #f0f0f0; font-weight: bold; font-size: 7px; text-align: center;">
                    ${classTimetable.className}
                  </td>
                  ${DAYS_OF_WEEK.map(day => `
                    <td style="border: 1px solid #333; padding: 0.5mm; text-align: center; vertical-align: middle;">
                      <div style="font-size: 6px; line-height: 1.1;">
                        ${PERIODS.map(periodData => {
                          const content = classDayPeriodGrid[classTimetable.className]?.[day]?.[periodData.period as number] || ''
                          const bgColor = periodData.period === 'BREAK1' || periodData.period === 'BREAK2' || periodData.period === 'BREAK3' 
                            ? '#fff3cd' 
                            : content && content !== 'FREE' ? '#d4edda' : '#f8f9fa'
                          const textColor = periodData.period === 'BREAK1' || periodData.period === 'BREAK2' || periodData.period === 'BREAK3'
                            ? '#856404'
                            : content && content !== 'FREE' ? '#155724' : '#6c757d'
                          
                          if (periodData.period === 'BREAK1' || periodData.period === 'BREAK2' || periodData.period === 'BREAK3') {
                            return `<div style="background-color: ${bgColor}; color: ${textColor}; padding: 0.3mm; font-size: 5px; font-weight: bold;">☕</div>`
                          }
                          
                          return `<div style="background-color: ${bgColor}; color: ${textColor}; padding: 0.3mm; font-size: 5px; white-space: pre-line;">${content}</div>`
                        }).join('')}
                      </div>
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Legend -->
        <div style="
          margin-top: 3mm;
          padding: 2mm;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: center;
          gap: 5mm;
          font-size: 6px;
          color: #666;
        ">
          <span><span style="display: inline-block; width: 8px; height: 8px; background-color: #d4edda; margin-right: 1mm;"></span>Scheduled</span>
          <span><span style="display: inline-block; width: 8px; height: 8px; background-color: #f8f9fa; border: 1px solid #ddd; margin-right: 1mm;"></span>Free Period</span>
          <span><span style="display: inline-block; width: 8px; height: 8px; background-color: #fff3cd; margin-right: 1mm;"></span>Break</span>
        </div>

        <!-- Footer -->
        <div style="
          margin-top: 2mm;
          text-align: center;
          font-size: 6px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 1mm;
        ">
          Generated by Automatic School Timetable Management System | ${options.schoolName || 'School'}
        </div>
      </div>
    `
  }
}

// Utility function for easy PDF export
export const exportTimetableToPDF = async (
  entries: TimetableEntry[],
  options: PDFExportOptions
): Promise<void> => {
  const exporter = new TimetablePDFExporter()
  await exporter.generatePDF(entries, options)
}

// Utility function for batch export
export const exportBatchTimetablesToPDF = async (
  classTimetables: { className: string; entries: TimetableEntry[] }[],
  options: PDFExportOptions
): Promise<void> => {
  const exporter = new TimetablePDFExporter()
  await exporter.generateBatchPDF(classTimetables, options)
}

// Assignment export interfaces and classes
export interface AssignmentEntry {
  id: string
  type: string
  name: string
  code?: string
  level?: string
  assignedClasses: Array<{
    id: string
    name: string
    level: string
  }>
}

export interface TeacherAssignmentsData {
  assignments: {
    subjects: AssignmentEntry[]
    modules: AssignmentEntry[]
    classAssignments: any[]
  }
  statistics: {
    totalSubjects: number
    totalModules: number
    totalClassAssignments: number
    uniqueClasses: number
  }
}

export interface AssignmentPDFOptions {
  title: string
  teacherName: string
  schoolName?: string
  fileName?: string
}

export class TeacherAssignmentsPDFExporter {
  private pdf: jsPDF
  private pageWidth: number = 210 // A4 portrait width in mm
  private pageHeight: number = 297 // A4 portrait height in mm
  private margin: number = 20
  private contentWidth: number = 170

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }

  /**
   * Generate PDF from teacher assignments
   */
  async generateAssignmentsPDF(data: TeacherAssignmentsData, options: AssignmentPDFOptions): Promise<void> {
    try {
      // Create temporary HTML element for rendering
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.height = '297mm'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.padding = '10mm'
      
      // Create the assignments HTML
      tempDiv.innerHTML = this.generateAssignmentsHTML(data, options)
      document.body.appendChild(tempDiv)

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 794, // A4 portrait width in pixels at 96 DPI
        height: 1123, // A4 portrait height in pixels at 96 DPI
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      })

      // Clean up
      document.body.removeChild(tempDiv)

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = this.pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // Add watermark if school name is provided
      if (options.schoolName) {
        this.addWatermark(options.schoolName)
      }

      // Save the PDF
      const fileName = options.fileName || `teacher_assignments_${new Date().toISOString().split('T')[0]}.pdf`
      this.pdf.save(fileName)

    } catch (error) {
      console.error('Error generating assignments PDF:', error)
      throw new Error('Failed to generate assignments PDF')
    }
  }

  /**
   * Add watermark to the PDF
   */
  private addWatermark(schoolName: string): void {
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(40)
    this.pdf.setTextColor(200, 200, 200)
    
    const textWidth = this.pdf.getTextWidth(schoolName)
    const x = (this.pageWidth - textWidth) / 2
    const y = this.pageHeight / 2
    
    this.pdf.text(schoolName, x, y)
  }

  /**
   * Generate HTML for the assignments document
   */
  private generateAssignmentsHTML(data: TeacherAssignmentsData, options: AssignmentPDFOptions): string {
    const { assignments, statistics } = data
    const { subjects, modules } = assignments

    return `
      <div style="
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 10mm;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        background-color: white;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          border-bottom: 2px solid #333;
          padding: 5mm 0;
          margin-bottom: 8mm;
        ">
          <h1 style="
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 3mm 0;
            color: #333;
          ">${options.title}</h1>
          <h2 style="
            font-size: 14px;
            font-weight: normal;
            margin: 0 0 2mm 0;
            color: #555;
          ">${options.teacherName}</h2>
          <p style="font-size: 11px; color: #666; margin: 2mm 0;">
            Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          ${options.schoolName ? `<p style="font-size: 11px; color: #666; margin: 0;">${options.schoolName}</p>` : ''}
        </div>

        <!-- Statistics Summary -->
        <div style="
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 4mm;
          margin-bottom: 8mm;
        ">
          <h3 style="
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 3mm 0;
            color: #333;
          ">Assignment Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm;">
            <div style="text-align: center; padding: 2mm; background: white; border-radius: 3px;">
              <div style="font-size: 16px; font-weight: bold; color: #007bff;">${statistics.totalSubjects || 0}</div>
              <div style="font-size: 10px; color: #666;">Subjects</div>
            </div>
            <div style="text-align: center; padding: 2mm; background: white; border-radius: 3px;">
              <div style="font-size: 16px; font-weight: bold; color: #28a745;">${statistics.totalModules || 0}</div>
              <div style="font-size: 10px; color: #666;">Modules</div>
            </div>
            <div style="text-align: center; padding: 2mm; background: white; border-radius: 3px;">
              <div style="font-size: 16px; font-weight: bold; color: #6f42c1;">${statistics.uniqueClasses || 0}</div>
              <div style="font-size: 10px; color: #666;">Unique Classes</div>
            </div>
            <div style="text-align: center; padding: 2mm; background: white; border-radius: 3px;">
              <div style="font-size: 16px; font-weight: bold; color: #fd7e14;">${statistics.totalClassAssignments || 0}</div>
              <div style="font-size: 10px; color: #666;">Total Assignments</div>
            </div>
          </div>
        </div>

        <!-- Subject Assignments -->
        ${subjects && subjects.length > 0 ? `
          <div style="margin-bottom: 10mm;">
            <h3 style="
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 4mm 0;
              color: #007bff;
              border-bottom: 1px solid #007bff;
              padding-bottom: 1mm;
            ">Subject Assignments (${subjects.length})</h3>
            <div style="display: grid; gap: 3mm;">
              ${subjects.map(subject => `
                <div style="
                  border: 1px solid #dee2e6;
                  border-radius: 4px;
                  padding: 3mm;
                  background: white;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2mm;">
                    <div>
                      <h4 style="
                        font-size: 13px;
                        font-weight: bold;
                        margin: 0;
                        color: #333;
                      ">${subject.name}</h4>
                      ${subject.code ? `<p style="font-size: 10px; color: #666; margin: 1mm 0 0 0;">Code: ${subject.code}</p>` : ''}
                      ${subject.level ? `<p style="font-size: 10px; color: #666; margin: 0;">Level: ${subject.level}</p>` : ''}
                    </div>
                    <div style="
                      background: #007bff;
                      color: white;
                      padding: 1mm 2mm;
                      border-radius: 3px;
                      font-size: 10px;
                      font-weight: bold;
                    ">
                      ${subject.assignedClasses.length} Class${subject.assignedClasses.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  <div style="font-size: 11px; color: #333; margin-top: 2mm;">
                    <strong>Assigned Classes:</strong>
                  </div>
                  <div style="margin-top: 1mm;">
                    ${subject.assignedClasses.map(cls => `
                      <span style="
                        display: inline-block;
                        background: #e9ecef;
                        color: #495057;
                        padding: 1mm 2mm;
                        margin: 0.5mm 1mm 0.5mm 0;
                        border-radius: 3px;
                        font-size: 10px;
                      ">${cls.name}</span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Module Assignments -->
        ${modules && modules.length > 0 ? `
          <div style="margin-bottom: 10mm;">
            <h3 style="
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 4mm 0;
              color: #28a745;
              border-bottom: 1px solid #28a745;
              padding-bottom: 1mm;
            ">Module Assignments (${modules.length})</h3>
            <div style="display: grid; gap: 3mm;">
              ${modules.map(module => `
                <div style="
                  border: 1px solid #dee2e6;
                  border-radius: 4px;
                  padding: 3mm;
                  background: white;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2mm;">
                    <div>
                      <h4 style="
                        font-size: 13px;
                        font-weight: bold;
                        margin: 0;
                        color: #333;
                      ">${module.name}</h4>
                      ${module.code ? `<p style="font-size: 10px; color: #666; margin: 1mm 0 0 0;">Code: ${module.code}</p>` : ''}
                      ${module.level ? `<p style="font-size: 10px; color: #666; margin: 0;">Level: ${module.level}</p>` : ''}
                    </div>
                    <div style="
                      background: #28a745;
                      color: white;
                      padding: 1mm 2mm;
                      border-radius: 3px;
                      font-size: 10px;
                      font-weight: bold;
                    ">
                      ${module.assignedClasses.length} Class${module.assignedClasses.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  <div style="font-size: 11px; color: #333; margin-top: 2mm;">
                    <strong>Assigned Classes:</strong>
                  </div>
                  <div style="margin-top: 1mm;">
                    ${module.assignedClasses.map(cls => `
                      <span style="
                        display: inline-block;
                        background: #e9ecef;
                        color: #495057;
                        padding: 1mm 2mm;
                        margin: 0.5mm 1mm 0.5mm 0;
                        border-radius: 3px;
                        font-size: 10px;
                      ">${cls.name}</span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${(!subjects?.length && !modules?.length) ? `
          <div style="
            text-align: center;
            padding: 20mm;
            color: #6c757d;
            font-style: italic;
          ">
            No assignments found.
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          position: absolute;
          bottom: 10mm;
          left: 10mm;
          right: 10mm;
          text-align: center;
          font-size: 9px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
          padding-top: 3mm;
        ">
          <p style="margin: 0;">This document contains confidential teacher assignment information.</p>
          <p style="margin: 1mm 0 0 0;">Generated by Automatic School Timetable Management System</p>
        </div>
      </div>
    `
  }
}

// Utility function for easy assignment PDF export
export const exportTeacherAssignmentsToPDF = async (
  data: TeacherAssignmentsData,
  options: AssignmentPDFOptions
): Promise<void> => {
  const exporter = new TeacherAssignmentsPDFExporter()
  await exporter.generateAssignmentsPDF(data, options)
}