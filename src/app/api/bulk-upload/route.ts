import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Access denied. School Admin role required.' },
                { status: 403 }
            )
        }

        if (!session.user.schoolId) {
            return NextResponse.json(
                { success: false, message: 'No school assigned to user.' },
                { status: 400 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string

        if (!file || !type) {
            return NextResponse.json(
                { success: false, message: 'File and type are required.' },
                { status: 400 }
            )
        }

        // Read the CSV file
        const text = await file.text()
        const lines = text.trim().split('\n')
        
        if (lines.length < 2) {
            return NextResponse.json(
                { success: false, message: 'CSV file must contain at least a header row and one data row.' },
                { status: 400 }
            )
        }

        // Auto-detect separator: comma or tab
        const firstLine = lines[0]
        const hasComma = firstLine.includes(',')
        const hasTab = firstLine.includes('\t')
        
        let separator = ','
        if (hasTab && !hasComma) {
            separator = '\t'
        }
        
        console.log(`Detected separator: ${separator === ',' ? 'comma' : 'tab'}`)
        
        const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''))
        const dataRows = lines.slice(1)

        let processed = 0
        const errors: string[] = []

        switch (type) {
            case 'subjects':
                const subjectResults = await processSubjects(dataRows, headers, session.user.schoolId, errors, separator)
                processed = subjectResults
                break

            case 'modules':
                const moduleResults = await processModules(dataRows, headers, session.user.schoolId, errors, separator)
                processed = moduleResults
                break

            case 'trainer_assignments':
                const assignmentResults = await processTrainerAssignments(dataRows, headers, session.user.schoolId, errors, separator)
                processed = assignmentResults
                break

            case 'classes':
                const classResults = await processClasses(dataRows, headers, session.user.schoolId, errors, separator)
                processed = classResults
                break

            case 'teachers':
                const schoolName = session.user.schoolName || 'School'
                const teacherResults = await processTeachers(dataRows, headers, session.user.schoolId, schoolName, errors, separator)
                processed = teacherResults
                break

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid upload type.' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${processed} record${processed !== 1 ? 's' : ''}.`,
            processed,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error('Bulk upload error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error during upload.' },
            { status: 500 }
        )
    }
}

async function processSubjects(dataRows: string[], headers: string[], schoolId: string, errors: string[], separator: string = ','): Promise<number> {
    let processed = 0
    console.log(`Processing ${dataRows.length} subject rows for school ${schoolId}`)
    console.log('Subject headers detected:', headers)
    console.log('Subject data rows:', dataRows)
    
    for (let i = 0; i < dataRows.length; i++) {
        try {
            const values = parseCSVRow(dataRows[i], separator)
            const subjectData: any = {}
            
            console.log(`Subject Row ${i + 1} - Raw values:`, values)
            
            // Map CSV columns to database fields
            headers.forEach((header, index) => {
                const value = values[index]?.trim()
                if (value) {
                    console.log(`Subject Row ${i + 1} - Header "${header}" -> Value "${value}"`)
                    switch (header.toLowerCase()) {
                        case 'name':
                            subjectData.name = value
                            break
                        case 'code':
                            subjectData.code = value
                            break
                        case 'level':
                            subjectData.level = value
                            break
                        case 'periods per week':
                            subjectData.periodsPerWeek = parseInt(value) || 1
                            console.log(`Subject Row ${i + 1} - Parsed periodsPerWeek: ${subjectData.periodsPerWeek}`)
                            break
                        default:
                            console.log(`Subject Row ${i + 1} - Unknown header: "${header}"`)
                    }
                }
            })

            console.log(`Subject Row ${i + 1} - Subject data object:`, subjectData)

            // Validate required fields
            if (!subjectData.name || !subjectData.code || !subjectData.level) {
                const missing = []
                if (!subjectData.name) missing.push('name')
                if (!subjectData.code) missing.push('code')
                if (!subjectData.level) missing.push('level')
                errors.push(`Row ${i + 2}: Missing required fields: ${missing.join(', ')}`)
                console.log(`Subject Row ${i + 1} - Validation failed, missing: ${missing.join(', ')}`)
                continue
            }

            // Set default values
            subjectData.periodsPerWeek = subjectData.periodsPerWeek || 1

            console.log(`Subject Row ${i + 1} - Subject data with defaults:`, subjectData)

            // Check for duplicates
            const existing = await prisma.subject.findFirst({
                where: {
                    code: subjectData.code,
                    schoolId: schoolId
                }
            })

            if (existing) {
                errors.push(`Row ${i + 2}: Subject with code "${subjectData.code}" already exists`)
                console.log(`Subject Row ${i + 1} - Duplicate found for code: ${subjectData.code}`)
                continue
            }

            console.log(`Subject Row ${i + 1} - Creating subject with data:`, {
                name: subjectData.name,
                code: subjectData.code,
                level: subjectData.level,
                periodsPerWeek: subjectData.periodsPerWeek,
                schoolId: schoolId
            })

            // Create subject
            const created = await prisma.subject.create({
                data: {
                    name: subjectData.name,
                    code: subjectData.code,
                    level: subjectData.level,
                    periodsPerWeek: subjectData.periodsPerWeek,
                    schoolId: schoolId
                }
            })
            
            console.log(`Subject Row ${i + 1} - Successfully created subject:`, created)
            processed++
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`Row ${i + 2}: ${errorMsg}`)
            console.error(`Subject Row ${i + 1} - Error processing:`, error)
        }
    }
    
    console.log(`Subject processing complete: ${processed} processed, ${errors.length} errors`)
    return processed
}

async function processModules(dataRows: string[], headers: string[], schoolId: string, errors: string[], separator: string = ','): Promise<number> {
    let processed = 0
    console.log(`Processing ${dataRows.length} module rows for school ${schoolId}`)
    console.log('Headers detected:', headers)
    console.log('Data rows:', dataRows)
    
    for (let i = 0; i < dataRows.length; i++) {
        try {
            const values = parseCSVRow(dataRows[i], separator)
            const moduleData: any = {}
            
            console.log(`Row ${i + 1} - Raw values:`, values)
            
            // Map CSV columns to database fields
            headers.forEach((header, index) => {
                const value = values[index]?.trim()
                if (value) {
                    console.log(`Row ${i + 1} - Header "${header}" -> Value "${value}"`)
                    switch (header.toLowerCase()) {
                        case 'name':
                            moduleData.name = value
                            break
                        case 'code':
                            moduleData.code = value
                            break
                        case 'level':
                            moduleData.level = value
                            break
                        case 'trade':
                            moduleData.trade = value
                            break
                        case 'total periods per week':
                            moduleData.totalHours = parseInt(value) || 0
                            console.log(`Row ${i + 1} - Parsed totalHours: ${moduleData.totalHours}`)
                            break
                        case 'category':
                            moduleData.category = value
                            break
                        default:
                            console.log(`Row ${i + 1} - Unknown header: "${header}"`)
                    }
                }
            })

            console.log(`Row ${i + 1} - Module data object:`, moduleData)

            // Validate required fields
            if (!moduleData.name || !moduleData.code || !moduleData.level || !moduleData.category) {
                const missing = []
                if (!moduleData.name) missing.push('name')
                if (!moduleData.code) missing.push('code')
                if (!moduleData.level) missing.push('level')
                if (!moduleData.category) missing.push('category')
                errors.push(`Row ${i + 2}: Missing required fields: ${missing.join(', ')}`)
                console.log(`Row ${i + 1} - Validation failed, missing: ${missing.join(', ')}`)
                continue
            }

            // Set defaults
            moduleData.totalHours = moduleData.totalHours || 0
            moduleData.trade = moduleData.trade || 'General'
            moduleData.blockSize = 1 // Default block size to match single form

            console.log(`Row ${i + 1} - Module data with defaults:`, moduleData)

            // Check for duplicates
            const existing = await prisma.module.findFirst({
                where: {
                    code: moduleData.code,
                    schoolId: schoolId
                }
            })

            if (existing) {
                errors.push(`Row ${i + 2}: Module with code "${moduleData.code}" already exists`)
                console.log(`Row ${i + 1} - Duplicate found for code: ${moduleData.code}`)
                continue
            }

            console.log(`Row ${i + 1} - Creating module with data:`, {
                ...moduleData,
                schoolId: schoolId,
                isActive: true
            })

            // Create module
            const created = await prisma.module.create({
                data: {
                    name: moduleData.name,
                    code: moduleData.code,
                    level: moduleData.level,
                    trade: moduleData.trade,
                    totalHours: moduleData.totalHours,
                    category: moduleData.category,
                    blockSize: moduleData.blockSize,
                    schoolId: schoolId
                }
            })
            
            console.log(`Row ${i + 1} - Successfully created module:`, created)
            processed++
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`Row ${i + 2}: ${errorMsg}`)
            console.error(`Row ${i + 1} - Error processing:`, error)
        }
    }
    
    console.log(`Module processing complete: ${processed} processed, ${errors.length} errors`)
    return processed
}

async function processTrainerAssignments(dataRows: string[], headers: string[], schoolId: string, errors: string[], separator: string = ','): Promise<number> {
    let processed = 0
    
    for (let i = 0; i < dataRows.length; i++) {
        try {
            const values = parseCSVRow(dataRows[i], separator)
            const assignmentData: any = {}
            
            // Map CSV columns to database fields
            headers.forEach((header, index) => {
                const value = values[index]?.trim()
                if (value) {
                    switch (header.toLowerCase()) {
                        case 'trainer email':
                            assignmentData.trainerEmail = value
                            break
                        case 'module code':
                            assignmentData.moduleCode = value
                            break
                        case 'level':
                            assignmentData.level = value
                            break
                        case 'trade':
                            assignmentData.trade = value
                            break
                    }
                }
            })

            // Validate required fields
            if (!assignmentData.trainerEmail || !assignmentData.moduleCode) {
                errors.push(`Row ${i + 2}: Missing required fields (trainer email or module code)`)
                continue
            }

            // Find trainer by email
            const trainer = await prisma.user.findFirst({
                where: {
                    email: assignmentData.trainerEmail,
                    schoolId: schoolId,
                    isActive: true,
                    role: 'TEACHER'
                }
            })

            if (!trainer) {
                errors.push(`Row ${i + 2}: Trainer with email "${assignmentData.trainerEmail}" not found`)
                continue
            }

            // Find module by code
            let moduleFilter: any = {
                code: assignmentData.moduleCode,
                schoolId: schoolId
            }
            
            if (assignmentData.level) {
                moduleFilter.level = assignmentData.level
            }
            
            if (assignmentData.trade) {
                moduleFilter.trade = assignmentData.trade
            }

            const module = await prisma.module.findFirst({
                where: moduleFilter
            })

            if (!module) {
                errors.push(`Row ${i + 2}: Module with code "${assignmentData.moduleCode}" not found`)
                continue
            }

            // Check if assignment already exists
            const existing = await prisma.trainerModule.findFirst({
                where: {
                    trainerId: trainer.id,
                    moduleId: module.id
                }
            })

            if (existing) {
                errors.push(`Row ${i + 2}: Assignment already exists for trainer "${assignmentData.trainerEmail}" and module "${assignmentData.moduleCode}"`)
                continue
            }

            // Create assignment
            await prisma.trainerModule.create({
                data: {
                    trainerId: trainer.id,
                    moduleId: module.id
                }
            })

            processed++
        } catch (error) {
            errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
    
    return processed
}

async function processClasses(dataRows: string[], headers: string[], schoolId: string, errors: string[], separator: string = ','): Promise<number> {
    let processed = 0
    
    for (let i = 0; i < dataRows.length; i++) {
        try {
            const values = parseCSVRow(dataRows[i], separator)
            const classData: any = {}
            
            // Map CSV columns to database fields
            headers.forEach((header, index) => {
                const value = values[index]?.trim()
                if (value) {
                    switch (header.toLowerCase()) {
                        case 'level':
                            classData.level = value
                            break
                        case 'stream':
                            classData.stream = value
                            break
                    }
                }
            })

            // Validate required fields
            if (!classData.level || !classData.stream) {
                errors.push(`Row ${i + 2}: Missing required fields (level or stream)`)
                continue
            }

            // Create class name from level and stream
            classData.name = `${classData.level}${classData.stream}`

            // Check for duplicates
            const existing = await prisma.class.findFirst({
                where: {
                    name: classData.name,
                    schoolId: schoolId
                }
            })

            if (existing) {
                errors.push(`Row ${i + 2}: Class with name "${classData.name}" already exists`)
                continue
            }

            // Create class
            await prisma.class.create({
                data: {
                    name: classData.name,
                    level: classData.level,
                    stream: classData.stream,
                    schoolId: schoolId
                }
            })

            processed++
        } catch (error) {
            errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
    
    return processed
}

async function processTeachers(dataRows: string[], headers: string[], schoolId: string, schoolName: string, errors: string[], separator: string = ','): Promise<number> {
    let processed = 0
    
    // Generate default password: {schoolName}@123
    const defaultPassword = `${schoolName}@123`
    
    for (let i = 0; i < dataRows.length; i++) {
        try {
            const values = parseCSVRow(dataRows[i], separator)
            const teacherData: any = {}
            
            // Map CSV columns to database fields
            headers.forEach((header, index) => {
                const value = values[index]?.trim()
                if (value) {
                    switch (header.toLowerCase()) {
                        case 'name':
                            teacherData.name = value
                            break
                        case 'email':
                            teacherData.email = value
                            break
                    }
                }
            })

            // Validate required fields
            if (!teacherData.name || !teacherData.email) {
                errors.push(`Row ${i + 2}: Missing required fields (name or email)`)
                continue
            }

            // Check for duplicates by email
            const existing = await prisma.user.findFirst({
                where: {
                    email: teacherData.email,
                    schoolId: schoolId
                }
            })

            if (existing) {
                errors.push(`Row ${i + 2}: Teacher with email "${teacherData.email}" already exists`)
                continue
            }

            // Create teacher user account with default password
            await prisma.user.create({
                data: {
                    name: teacherData.name,
                    email: teacherData.email,
                    password: defaultPassword,
                    role: 'TEACHER',
                    schoolId: schoolId,
                    isActive: true
                }
            })

            processed++
        } catch (error) {
            errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
    
    return processed
}

function parseCSVRow(row: string, separator: string = ','): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i]
        
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === separator && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    
    result.push(current)
    return result
}