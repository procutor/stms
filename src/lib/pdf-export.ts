import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface TimetableEntry {
  id: string
  day: string
  period: number
  startTime: string
  endTime: string
  shift?: 'MORNING' | 'AFTERNOON'
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

export type ShiftType = 'MORNING' | 'AFTERNOON'

export interface PDFExportOptions {
  title: string
  className?: string
  schoolName?: string
  shift?: ShiftType
  shiftLabel?: string
  roomName?: string
  includeLegend?: boolean
  fileName?: string
  academicYear?: string
  dateRange?: string
  stream?: string
}

export interface PeriodConfig {
  period: number | string
  startTime: string
  endTime: string
  type: 'lesson' | 'break'
  label?: string
}

// Shift-specific period configurations
export const MORNING_SHIFT_PERIODS: PeriodConfig[] = [
  { period: 1, startTime: '08:00', endTime: '08:40', type: 'lesson' },
  { period: 2, startTime: '08:40', endTime: '09:20', type: 'lesson' },
  { period: 3, startTime: '09:20', endTime: '10:00', type: 'lesson' },
  { period: 'BREAK', startTime: '10:00', endTime: '10:20', type: 'break', label: 'MORNING BREAK' },
  { period: 4, startTime: '10:20', endTime: '11:00', type: 'lesson' },
  { period: 5, startTime: '11:00', endTime: '11:40', type: 'lesson' }
]

export const AFTERNOON_SHIFT_PERIODS: PeriodConfig[] = [
  { period: 1, startTime: '13:00', endTime: '13:40', type: 'lesson' },
  { period: 2, startTime: '13:40', endTime: '14:20', type: 'lesson' },
  { period: 3, startTime: '14:20', endTime: '15:00', type: 'lesson' },
  { period: 'BREAK', startTime: '15:00', endTime: '15:20', type: 'break', label: 'AFTERNOON BREAK' },
  { period: 4, startTime: '15:20', endTime: '16:00', type: 'lesson' },
  { period: 5, startTime: '16:00', endTime: '16:40', type: 'lesson' }
]

export const DEFAULT_PERIODS: PeriodConfig[] = [
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

export class TimetablePDFExporter {
  private pdf: jsPDF
  private pageWidth: number = 297
  private pageHeight: number = 210

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
  }

  /**
   * Get period configuration based on shift type
   */
  private getPeriodsForShift(shift?: ShiftType): PeriodConfig[] {
    switch (shift) {
      case 'MORNING':
        return MORNING_SHIFT_PERIODS
      case 'AFTERNOON':
        return AFTERNOON_SHIFT_PERIODS
      default:
        return DEFAULT_PERIODS
    }
  }

  /**
   * Generate shift-specific header
   */
  private generateShiftHeader(shift: ShiftType, options: PDFExportOptions): string {
    const shiftColors: { [key in ShiftType]: { bg: string; text: string; border: string } } = {
      MORNING: { bg: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', text: '#ffffff', border: '#c82333' },
      AFTERNOON: { bg: 'linear-gradient(135deg, #28a745 0%, #218838 100%)', text: '#ffffff', border: '#218838' },
      BOTH: { bg: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)', text: '#ffffff', border: '#5a32a3' }
    }

    const colors = shiftColors[shift]
    const shiftLabels: { [key in ShiftType]: string } = {
      MORNING: 'MORNING SHIFT',
      AFTERNOON: 'AFTERNOON SHIFT',
      BOTH: 'DOUBLE SHIFT TIMETABLE'
    }

    const shiftTimeRanges: { [key in ShiftType]: string } = {
      MORNING: '08:00 - 11:40',
      AFTERNOON: '13:00 - 16:40',
      BOTH: 'Morning: 08:00-11:40 | Afternoon: 13:00-16:40'
    }

    let html = '<div style="text-align:center;border-bottom:3px solid ' + colors.border + ';padding:3mm;margin-bottom:2mm;background:' + colors.bg + ';border-radius:4px;">'
    html += '<h1 style="font-size:20px;font-weight:bold;margin:0 0 1mm 0;color:' + colors.text + ';">' + shiftLabels[shift] + '</h1>'
    html += '<p style="font-size:11px;color:' + colors.text + ';margin:0.5mm 0;opacity:0.9;">' + shiftTimeRanges[shift] + '</p>'
    
    if (options.shiftLabel) {
      html += '<p style="font-size:10px;color:' + colors.text + ';margin:0.5mm 0;opacity:0.85;">' + options.shiftLabel + '</p>'
    }
    
    html += '</div>'
    return html
  }

  /**
   * Generate standard header (backward compatible)
   */
  private generateStandardHeader(options: PDFExportOptions, isTeacherTimetable: boolean): string {
    const headerBg = isTeacherTimetable ? 'linear-gradient(135deg, #1e40af 0%, #000000 100%)' : 'transparent'
    const headerBorder = isTeacherTimetable ? '#1e40af' : '#333'
    const headerText = isTeacherTimetable ? '#ffffff' : '#333'
    const headerTextSec = isTeacherTimetable ? '#e0e0e0' : '#666'

    let html = '<div style="text-align:center;border-bottom:2px solid ' + headerBorder + ';padding:2mm;margin-bottom:2mm;background:' + headerBg + ';border-radius:2px;">'

    html += '<h1 style="font-size:16px;font-weight:bold;margin:0 0 1mm 0;color:' + headerText + ';">' + options.title + '</h1>'
    html += '<p style="font-size:10px;color:' + headerTextSec + ';margin:0.5mm 0;">Weekly Timetable - Monday to Friday</p>'
    html += '<p style="font-size:10px;color:' + (isTeacherTimetable ? '#cccccc' : '#999') + ';margin:0;">' + new Date().toLocaleDateString() + '</p>'
    html += '</div>'
    return html
  }

  /**
   * Generate shift-aware timetable HTML
   */
  private generateTimetableHTML(entries: TimetableEntry[], options: PDFExportOptions): string {
    const isTeacherTimetable = options.title.toLowerCase().includes('teacher')
    const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const DAY_NAMES: { [key: string]: string } = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday',
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday'
    }

    const periods = this.getPeriodsForShift(options.shift)
    const maxPeriods = options.shift ? 5 : 10

    const gridData: { [key: string]: { [key: string | number]: TimetableEntry[] } } = {}

    DAYS_OF_WEEK.forEach(day => {
      gridData[day] = {}
      for (let period = 1; period <= maxPeriods; period++) {
        const shiftFilter = options.shift ? { shift: options.shift } : {}
        gridData[day][period] = entries.filter(entry =>
          entry.day === day && entry.period === period &&
          (!options.shift || entry.shift === options.shift || !entry.shift)
        )
      }
      if (isTeacherTimetable) {
        gridData[day]['MORNING_BREAK'] = []
        gridData[day]['LUNCH'] = []
        gridData[day]['AFTERNOON_BREAK'] = []
      }
    })

    const getEntryDisplay = (entry: TimetableEntry): string => {
      const moduleName = entry.module?.name || entry.subject?.name || 'FREE'
      if (isTeacherTimetable) {
        const className = entry.class?.name || 'Class'
        return moduleName + '\n' + className
      }
      return moduleName + '\n' + entry.teacher.name
    }

    let html = '<div style="width:297mm;height:210mm;margin:0;padding:4mm;font-family:Arial,sans-serif;font-size:10px;line-height:1.0;background-color:white;box-sizing:border-box;">'

    // Generate header based on shift
    if (options.shift && options.shift !== 'BOTH') {
      html += this.generateShiftHeader(options.shift, options)
    } else {
      html += this.generateStandardHeader(options, isTeacherTimetable)
    }

    // Meta info row
    let metaInfo = []
    if (options.schoolName) metaInfo.push(options.schoolName)
    if (options.className) metaInfo.push('Class: ' + options.className)
    if (options.stream) metaInfo.push('Stream: ' + options.stream)
    if (options.roomName) metaInfo.push('Room: ' + options.roomName)
    if (options.dateRange) metaInfo.push(options.dateRange)
    if (options.academicYear) metaInfo.push('Academic Year: ' + options.academicYear)

    if (metaInfo.length > 0) {
      html += '<div style="text-align:center;margin-bottom:2mm;font-size:9px;color:#666;">'
      html += metaInfo.join(' | ')
      html += '</div>'
    }

    // Header row
    const headerBorder = isTeacherTimetable ? '#1e40af' : '#333'
    const headerBg = isTeacherTimetable ? '#1e40af' : '#f0f0f0'
    const headerText = isTeacherTimetable ? '#ffffff' : '#333'

    html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);border:1px solid ' + headerBorder + ';background-color:' + headerBg + ';">'
    html += '<div style="padding:1.5mm;text-align:center;font-weight:bold;font-size:10px;border-right:1px solid ' + headerBorder + ';min-height:12mm;display:flex;align-items:center;justify-content:center;color:' + headerText + ';">Period</div>'

    DAYS_OF_WEEK.forEach(day => {
      html += '<div style="padding:1.5mm;text-align:center;font-weight:bold;font-size:10px;border-right:1px solid ' + headerBorder + ';min-height:12mm;display:flex;align-items:center;justify-content:center;color:' + headerText + ';">' + DAY_NAMES[day] + '</div>'
    })
    html += '</div>'

    // Period rows
    periods.forEach(periodData => {
      html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);border-bottom:1px solid #333;border-left:1px solid #333;border-right:1px solid #333;">'

      // Period cell
      const periodNum = typeof periodData.period === 'number' ? periodData.period : 0
      html += '<div style="padding:1.5mm;text-align:center;font-size:10px;font-weight:bold;background-color:' + (isTeacherTimetable ? '#000000' : '#f9f9f9') + ';color:' + (isTeacherTimetable ? '#ffffff' : '#333') + ';border-right:1px solid ' + (isTeacherTimetable ? '#1e40af' : '#333') + ';min-height:12mm;display:flex;flex-direction:column;justify-content:center;align-items:center;">'
      if (periodData.type === 'break') {
        html += '<div style="font-size:10px;font-weight:bold;color:#666;">' + periodData.label + '</div>'
      } else {
        html += '<div>P' + periodData.period + '</div>'
      }
      html += '<div style="font-size:10px;font-weight:400;margin-top:0.3mm;">' + periodData.startTime + '-' + periodData.endTime + '</div>'
      html += '</div>'

      if (periodData.type === 'break') {
        html += '<div style="grid-column:2/-1;padding:3mm;border-right:1px solid #333;min-height:12mm;display:flex;align-items:center;justify-content:center;text-align:center;background-color:#f8f8f8;">'
        html += '<div style="text-align:center;color:#666;font-size:10px;font-weight:bold;line-height:1.4;">' + periodData.label + '<br>' + periodData.startTime + '-' + periodData.endTime + '</div>'
        html += '</div>'
      } else {
        DAYS_OF_WEEK.forEach(day => {
          const dayEntries = gridData[day][periodNum]
          html += '<div style="padding:1mm;border-right:1px solid #333;min-height:12mm;display:flex;align-items:center;justify-content:center;text-align:center;">'
          if (dayEntries.length > 0) {
            const entry = dayEntries[0]
            html += '<div style="font-size:8.5px;font-weight:normal;line-height:1.2;white-space:pre-line;color:#333;text-align:center;">' + getEntryDisplay(entry) + '</div>'
          } else {
            html += '<div style="text-align:center;color:#999;font-size:10px;font-style:italic;">FREE</div>'
          }
          html += '</div>'
        })
      }
      html += '</div>'
    })

    // Legend
    if (options.includeLegend) {
      html += '<div style="margin-top:2mm;padding:2mm;font-size:9px;color:#666;text-align:center;">'
      html += 'P1-P5 = Period 1-5 | Generated: ' + new Date().toLocaleDateString()
      if (options.shift) {
        html += ' | Shift: ' + options.shift
      }
      html += '</div>'
    }

    html += '</div>'
    return html
  }

async generatePDF(entries: TimetableEntry[], options: PDFExportOptions): Promise<void> {
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '297mm'
    tempDiv.style.height = '210mm'
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.fontFamily = 'Arial, sans-serif'

    tempDiv.innerHTML = this.generateTimetableHTML(entries, options)
    document.body.appendChild(tempDiv)

    await new Promise(resolve => setTimeout(resolve, 500))

    const canvas = await html2canvas(tempDiv, {
      width: 1123,
      height: 794,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true
    })

    document.body.removeChild(tempDiv)

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = this.pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    const fileName = options.fileName || 'timetable_' + new Date().toISOString().split('T')[0] + '.pdf'
    this.pdf.save(fileName)
  }

  /**
   * Export single shift timetable (convenience method)
   */
  async exportShiftTimetable(entries: TimetableEntry[], shift: ShiftType, options: PDFExportOptions): Promise<void> {
    const shiftOptions: PDFExportOptions = {
      ...options,
      shift: shift,
      shiftLabel: shift === 'MORNING' ? 'Morning Shift (P1-P5)' : 'Afternoon Shift (P1-P5)'
    }
    await this.generatePDF(entries, shiftOptions)
  }

  async generateBatchPDF(
    classTimetables: { className: string; entries: TimetableEntry[] }[],
    options: PDFExportOptions
  ): Promise<void> {
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    for (let i = 0; i < classTimetables.length; i++) {
      const classTimetable = classTimetables[i]
      const isTeacherTimetable = options.title.toLowerCase().includes('teacher')

      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '297mm'
      tempDiv.style.height = '210mm'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'

      const classTitle = isTeacherTimetable ? options.title : (options.title || 'Class') + ' - ' + classTimetable.className
      const classOptions = { ...options, title: classTitle }

      tempDiv.innerHTML = this.generateTimetableHTML(classTimetable.entries, classOptions)
      document.body.appendChild(tempDiv)

      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(tempDiv, {
        width: 1123,
        height: 794,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      })

      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = this.pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        this.pdf.addPage()
      }
      this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    }

    const fileName = options.fileName || 'all_timetables_' + new Date().toISOString().split('T')[0] + '.pdf'
    this.pdf.save(fileName)
  }
}

export const exportTimetableToPDF = async (
  entries: TimetableEntry[],
  options: PDFExportOptions
): Promise<void> => {
  const exporter = new TimetablePDFExporter()
  await exporter.generatePDF(entries, options)
}

export const exportShiftTimetableToPDF = async (
  entries: TimetableEntry[],
  shift: ShiftType,
  options: PDFExportOptions
): Promise<void> => {
  const exporter = new TimetablePDFExporter()
  await exporter.exportShiftTimetable(entries, shift, options)
}
export const exportBatchTimetablesToPDF = async (
  classTimetables: { className: string; entries: TimetableEntry[] }[],
  options: PDFExportOptions
): Promise<void> => {
  const exporter = new TimetablePDFExporter()
  await exporter.generateBatchPDF(classTimetables, options)
}

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
  private pageWidth: number = 210
  private pageHeight: number = 297

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }

  async generateAssignmentsPDF(data: TeacherAssignmentsData, options: AssignmentPDFOptions): Promise<void> {
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.height = '297mm'
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.padding = '10mm'

    tempDiv.innerHTML = this.generateAssignmentsHTML(data, options)
    document.body.appendChild(tempDiv)

    await new Promise(resolve => setTimeout(resolve, 500))

    const canvas = await html2canvas(tempDiv, {
      width: 794,
      height: 1123,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true
    })

    document.body.removeChild(tempDiv)

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = this.pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    this.pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    const fileName = options.fileName || 'teacher_assignments_' + new Date().toISOString().split('T')[0] + '.pdf'
    this.pdf.save(fileName)
  }

  private generateAssignmentsHTML(data: TeacherAssignmentsData, options: AssignmentPDFOptions): string {
    const { assignments, statistics } = data
    const { subjects, modules } = assignments

    let html = '<div style="width:210mm;height:297mm;margin:0;padding:10mm;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;background-color:white;box-sizing:border-box;">'

    html += '<div style="text-align:center;border-bottom:2px solid #333;padding:5mm 0;margin-bottom:8mm;">'
    html += '<h1 style="font-size:18px;font-weight:bold;margin:0 0 3mm 0;color:#333;">' + options.title + '</h1>'
    html += '<h2 style="font-size:14px;font-weight:normal;margin:0 0 2mm 0;color:#555;">' + options.teacherName + '</h2>'
    html += '<p style="font-size:11px;color:#666;margin:2mm 0;">Generated on ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p>'
    if (options.schoolName) {
      html += '<p style="font-size:11px;color:#666;margin:0;">' + options.schoolName + '</p>'
    }
    html += '</div>'

    html += '<div style="background-color:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;padding:4mm;margin-bottom:8mm;">'
    html += '<h3 style="font-size:14px;font-weight:bold;margin:0 0 3mm 0;color:#333;">Assignment Summary</h3>'
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;">'
    html += '<div style="text-align:center;padding:2mm;background:white;border-radius:3px;"><div style="font-size:16px;font-weight:bold;color:#007bff;">' + (statistics.totalSubjects || 0) + '</div><div style="font-size:10px;color:#666;">Subjects</div></div>'
    html += '<div style="text-align:center;padding:2mm;background:white;border-radius:3px;"><div style="font-size:16px;font-weight:bold;color:#28a745;">' + (statistics.totalModules || 0) + '</div><div style="font-size:10px;color:#666;">Modules</div></div>'
    html += '<div style="text-align:center;padding:2mm;background:white;border-radius:3px;"><div style="font-size:16px;font-weight:bold;color:#6f42c1;">' + (statistics.uniqueClasses || 0) + '</div><div style="font-size:10px;color:#666;">Unique Classes</div></div>'
    html += '<div style="text-align:center;padding:2mm;background:white;border-radius:3px;"><div style="font-size:16px;font-weight:bold;color:#fd7e14;">' + (statistics.totalClassAssignments || 0) + '</div><div style="font-size:10px;color:#666;">Total Assignments</div></div>'
    html += '</div></div>'

    if (subjects && subjects.length > 0) {
      html += '<div style="margin-bottom:10mm;">'
      html += '<h3 style="font-size:14px;font-weight:bold;margin:0 0 4mm 0;color:#007bff;border-bottom:1px solid #007bff;padding-bottom:1mm;">Subject Assignments (' + subjects.length + ')</h3>'
      html += '<div style="display:grid;gap:3mm;">'

      subjects.forEach(subject => {
        html += '<div style="border:1px solid #dee2e6;border-radius:4px;padding:3mm;background:white;">'
        html += '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:2mm;">'
        html += '<div><h4 style="font-size:13px;font-weight:bold;margin:0;color:#333;">' + subject.name + '</h4>'
        if (subject.code) html += '<p style="font-size:10px;color:#666;margin:1mm 0 0 0;">Code: ' + subject.code + '</p>'
        if (subject.level) html += '<p style="font-size:10px;color:#666;margin:0;">Level: ' + subject.level + '</p>'
        html += '</div>'
        html += '<div style="background:#007bff;color:white;padding:1mm 2mm;border-radius:3px;font-size:10px;font-weight:bold;">' + subject.assignedClasses.length + ' Class' + (subject.assignedClasses.length !== 1 ? 'es' : '') + '</div>'
        html += '</div>'
        html += '<div style="font-size:11px;color:#333;margin-top:2mm;"><strong>Assigned Classes:</strong></div>'
        html += '<div style="margin-top:1mm;">'
        subject.assignedClasses.forEach(cls => {
          html += '<span style="display:inline-block;background:#e9ecef;color:#495057;padding:1mm 2mm;margin:0.5mm 1mm 0.5mm 0;border-radius:3px;font-size:10px;">' + cls.name + '</span>'
        })
        html += '</div></div>'
      })

      html += '</div></div>'
    }

    if (modules && modules.length > 0) {
      html += '<div style="margin-bottom:10mm;">'
      html += '<h3 style="font-size:14px;font-weight:bold;margin:0 0 4mm 0;color:#28a745;border-bottom:1px solid #28a745;padding-bottom:1mm;">Module Assignments (' + modules.length + ')</h3>'
      html += '<div style="display:grid;gap:3mm;">'

      modules.forEach(module => {
        html += '<div style="border:1px solid #dee2e6;border-radius:4px;padding:3mm;background:white;">'
        html += '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:2mm;">'
        html += '<div><h4 style="font-size:13px;font-weight:bold;margin:0;color:#333;">' + module.name + '</h4>'
        if (module.code) html += '<p style="font-size:10px;color:#666;margin:1mm 0 0 0;">Code: ' + module.code + '</p>'
        if (module.level) html += '<p style="font-size:10px;color:#666;margin:0;">Level: ' + module.level + '</p>'
        html += '</div>'
        html += '<div style="background:#28a745;color:white;padding:1mm 2mm;border-radius:3px;font-size:10px;font-weight:bold;">' + module.assignedClasses.length + ' Class' + (module.assignedClasses.length !== 1 ? 'es' : '') + '</div>'
        html += '</div>'
        html += '<div style="font-size:11px;color:#333;margin-top:2mm;"><strong>Assigned Classes:</strong></div>'
        html += '<div style="margin-top:1mm;">'
        module.assignedClasses.forEach(cls => {
          html += '<span style="display:inline-block;background:#e9ecef;color:#495057;padding:1mm 2mm;margin:0.5mm 1mm 0.5mm 0;border-radius:3px;font-size:10px;">' + cls.name + '</span>'
        })
        html += '</div></div>'
      })

      html += '</div></div>'
    }

    if (!subjects?.length && !modules?.length) {
      html += '<div style="text-align:center;padding:20mm;color:#6c757d;font-style:italic;">No assignments found.</div>'
    }

    html += '</div>'
    return html
  }
}

export const exportTeacherAssignmentsToPDF = async (
  data: TeacherAssignmentsData,
  options: AssignmentPDFOptions
): Promise<void> => {
  const exporter = new TeacherAssignmentsPDFExporter()
  await exporter.generateAssignmentsPDF(data, options)
}
