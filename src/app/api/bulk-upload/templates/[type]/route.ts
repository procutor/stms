import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Access denied. School Admin role required.' },
                { status: 403 }
            )
        }

        const { type } = params

        let csvContent = ''
        let filename = ''

        switch (type) {
            case 'subjects':
                filename = 'subjects_template.csv'
                csvContent = `Name,Code,Level,Periods Per Week
Mathematics,MATH101,S1,5
English,ENG101,S1,4
Physics,PHY101,S2,3
Chemistry,CHEM101,S2,3`
                break

            case 'modules':
                filename = 'modules_template.csv'
                csvContent = `Name,Code,Level,Trade,Total Periods per Week,Category
Electrical Installation Basics,EIB001,L3,ELECTRICAL,8,SPECIFIC
Carpentry Fundamentals,CF001,L3,CARPENTRY,6,SPECIFIC
Mathematics Extension,MATHEXT01,L3,GENERAL,4,COMPLEMENTARY`
                break

            case 'trainer_assignments':
                filename = 'trainer_assignments_template.csv'
                csvContent = `Trainer Email,Module Code,Level,Trade
trainer1@school.rw,EIB001,L3,ELECTRICAL
trainer2@school.rw,CF001,L3,CARPENTRY
trainer1@school.rw,MATHEXT01,L3,`
                break

            case 'classes':
                filename = 'classes_template.csv'
                csvContent = `Level,Stream
P1,A
P1,B
S1,A
S1,B
L3,A
L3,B`
                break

            case 'teachers':
                filename = 'teachers_template.csv'
                csvContent = `Name,Email
John Doe,john.doe@school.rw
Jane Smith,jane.smith@school.rw
Robert Wilson,robert.wilson@school.rw`
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid template type.' },
                    { status: 400 }
                )
        }

        // Create CSV response with UTF-8 BOM for Excel compatibility
        const csvWithBOM = '\ufeff' + csvContent
        
        const response = new NextResponse(csvWithBOM, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': csvWithBOM.length.toString(),
            },
        })

        return response

    } catch (error) {
        console.error('Template download error:', error)
        return NextResponse.json(
            { error: 'Failed to generate template.' },
            { status: 500 }
        )
    }
}