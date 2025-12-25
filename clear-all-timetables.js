// Script to clear all timetables from the database
// Run with: node clear-all-timetables.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearAllTimetables() {
    try {
        console.log('🗑️  Starting to clear all timetables...')
        
        // Delete all timetables
        const deletedCount = await prisma.timetable.deleteMany({})
        
        console.log(`✅ Successfully deleted ${deletedCount.count} timetables`)
        console.log('🎉 All timetable history has been removed!')
        
    } catch (error) {
        console.error('❌ Error clearing timetables:', error)
    } finally {
        await prisma.$disconnect()
    }
}

clearAllTimetables()