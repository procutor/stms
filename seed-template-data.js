const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Common template patterns
const templates = [
  {
    name: "Standard Primary School",
    description: "Traditional primary school schedule with morning and afternoon sessions",
    schoolType: "PRIMARY",
    isGlobal: true,
    slots: [
      // Monday
      { day: "MONDAY", period: 1, name: "P1", startTime: "08:00", endTime: "08:40", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "MONDAY", period: 2, name: "P2", startTime: "08:40", endTime: "09:20", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "MONDAY", period: 3, name: "P3", startTime: "09:20", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "MONDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "MONDAY", period: 5, name: "P4", startTime: "10:20", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "MONDAY", period: 6, name: "P5", startTime: "11:00", endTime: "11:40", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "MONDAY", period: 7, name: "Lunch Break", startTime: "11:40", endTime: "13:10", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "MONDAY", period: 8, name: "P6", startTime: "13:10", endTime: "13:50", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "MONDAY", period: 9, name: "P7", startTime: "13:50", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "MONDAY", period: 10, name: "P8", startTime: "14:30", endTime: "15:10", session: "AFTERNOON", isBreak: false, orderIndex: 9 },
      
      // Tuesday
      { day: "TUESDAY", period: 1, name: "P1", startTime: "08:00", endTime: "08:40", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "TUESDAY", period: 2, name: "P2", startTime: "08:40", endTime: "09:20", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "TUESDAY", period: 3, name: "P3", startTime: "09:20", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "TUESDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "TUESDAY", period: 5, name: "P4", startTime: "10:20", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "TUESDAY", period: 6, name: "P5", startTime: "11:00", endTime: "11:40", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "TUESDAY", period: 7, name: "Lunch Break", startTime: "11:40", endTime: "13:10", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "TUESDAY", period: 8, name: "P6", startTime: "13:10", endTime: "13:50", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "TUESDAY", period: 9, name: "P7", startTime: "13:50", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "TUESDAY", period: 10, name: "P8", startTime: "14:30", endTime: "15:10", session: "AFTERNOON", isBreak: false, orderIndex: 9 },
      
      // Wednesday
      { day: "WEDNESDAY", period: 1, name: "P1", startTime: "08:00", endTime: "08:40", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "WEDNESDAY", period: 2, name: "P2", startTime: "08:40", endTime: "09:20", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "WEDNESDAY", period: 3, name: "P3", startTime: "09:20", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "WEDNESDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "WEDNESDAY", period: 5, name: "P4", startTime: "10:20", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "WEDNESDAY", period: 6, name: "P5", startTime: "11:00", endTime: "11:40", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "WEDNESDAY", period: 7, name: "Lunch Break", startTime: "11:40", endTime: "13:10", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "WEDNESDAY", period: 8, name: "P6", startTime: "13:10", endTime: "13:50", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "WEDNESDAY", period: 9, name: "P7", startTime: "13:50", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "WEDNESDAY", period: 10, name: "P8", startTime: "14:30", endTime: "15:10", session: "AFTERNOON", isBreak: false, orderIndex: 9 },
      
      // Thursday
      { day: "THURSDAY", period: 1, name: "P1", startTime: "08:00", endTime: "08:40", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "THURSDAY", period: 2, name: "P2", startTime: "08:40", endTime: "09:20", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "THURSDAY", period: 3, name: "P3", startTime: "09:20", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "THURSDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "THURSDAY", period: 5, name: "P4", startTime: "10:20", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "THURSDAY", period: 6, name: "P5", startTime: "11:00", endTime: "11:40", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "THURSDAY", period: 7, name: "Lunch Break", startTime: "11:40", endTime: "13:10", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "THURSDAY", period: 8, name: "P6", startTime: "13:10", endTime: "13:50", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "THURSDAY", period: 9, name: "P7", startTime: "13:50", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "THURSDAY", period: 10, name: "P8", startTime: "14:30", endTime: "15:10", session: "AFTERNOON", isBreak: false, orderIndex: 9 },
      
      // Friday
      { day: "FRIDAY", period: 1, name: "P1", startTime: "08:00", endTime: "08:40", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "FRIDAY", period: 2, name: "P2", startTime: "08:40", endTime: "09:20", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "FRIDAY", period: 3, name: "P3", startTime: "09:20", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "FRIDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "FRIDAY", period: 5, name: "P4", startTime: "10:20", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "FRIDAY", period: 6, name: "P5", startTime: "11:00", endTime: "11:40", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "FRIDAY", period: 7, name: "Lunch Break", startTime: "11:40", endTime: "13:10", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "FRIDAY", period: 8, name: "P6", startTime: "13:10", endTime: "13:50", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "FRIDAY", period: 9, name: "P7", startTime: "13:50", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "FRIDAY", period: 10, name: "P8", startTime: "14:30", endTime: "15:10", session: "AFTERNOON", isBreak: false, orderIndex: 9 }
    ]
  },
  {
    name: "TSS Afternoon Shift",
    description: "Technical Secondary School afternoon schedule",
    schoolType: "TSS",
    isGlobal: true,
    slots: [
      // Monday
      { day: "MONDAY", period: 1, name: "Assembly", startTime: "13:00", endTime: "13:30", session: "AFTERNOON", isBreak: true, breakType: "ASSEMBLY", orderIndex: 0 },
      { day: "MONDAY", period: 2, name: "P1", startTime: "13:30", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 1 },
      { day: "MONDAY", period: 3, name: "P2", startTime: "14:30", endTime: "15:30", session: "AFTERNOON", isBreak: false, orderIndex: 2 },
      { day: "MONDAY", period: 4, name: "Afternoon Break", startTime: "15:30", endTime: "15:45", session: "AFTERNOON", isBreak: true, breakType: "AFTERNOON_BREAK", orderIndex: 3 },
      { day: "MONDAY", period: 5, name: "P3", startTime: "15:45", endTime: "16:45", session: "AFTERNOON", isBreak: false, orderIndex: 4 },
      { day: "MONDAY", period: 6, name: "P4", startTime: "16:45", endTime: "17:45", session: "AFTERNOON", isBreak: false, orderIndex: 5 },
      
      // Tuesday
      { day: "TUESDAY", period: 1, name: "P1", startTime: "13:00", endTime: "14:00", session: "AFTERNOON", isBreak: false, orderIndex: 0 },
      { day: "TUESDAY", period: 2, name: "P2", startTime: "14:00", endTime: "15:00", session: "AFTERNOON", isBreak: false, orderIndex: 1 },
      { day: "TUESDAY", period: 3, name: "P3", startTime: "15:00", endTime: "16:00", session: "AFTERNOON", isBreak: false, orderIndex: 2 },
      { day: "TUESDAY", period: 4, name: "Afternoon Break", startTime: "16:00", endTime: "16:15", session: "AFTERNOON", isBreak: true, breakType: "AFTERNOON_BREAK", orderIndex: 3 },
      { day: "TUESDAY", period: 5, name: "P4", startTime: "16:15", endTime: "17:15", session: "AFTERNOON", isBreak: false, orderIndex: 4 },
      { day: "TUESDAY", period: 6, name: "P5", startTime: "17:15", endTime: "18:15", session: "AFTERNOON", isBreak: false, orderIndex: 5 },
      
      // Wednesday
      { day: "WEDNESDAY", period: 1, name: "P1", startTime: "13:00", endTime: "14:00", session: "AFTERNOON", isBreak: false, orderIndex: 0 },
      { day: "WEDNESDAY", period: 2, name: "P2", startTime: "14:00", endTime: "15:00", session: "AFTERNOON", isBreak: false, orderIndex: 1 },
      { day: "WEDNESDAY", period: 3, name: "P3", startTime: "15:00", endTime: "16:00", session: "AFTERNOON", isBreak: false, orderIndex: 2 },
      { day: "WEDNESDAY", period: 4, name: "Afternoon Break", startTime: "16:00", endTime: "16:15", session: "AFTERNOON", isBreak: true, breakType: "AFTERNOON_BREAK", orderIndex: 3 },
      { day: "WEDNESDAY", period: 5, name: "P4", startTime: "16:15", endTime: "17:15", session: "AFTERNOON", isBreak: false, orderIndex: 4 },
      { day: "WEDNESDAY", period: 6, name: "P5", startTime: "17:15", endTime: "18:15", session: "AFTERNOON", isBreak: false, orderIndex: 5 },
      
      // Thursday
      { day: "THURSDAY", period: 1, name: "P1", startTime: "13:00", endTime: "14:00", session: "AFTERNOON", isBreak: false, orderIndex: 0 },
      { day: "THURSDAY", period: 2, name: "P2", startTime: "14:00", endTime: "15:00", session: "AFTERNOON", isBreak: false, orderIndex: 1 },
      { day: "THURSDAY", period: 3, name: "P3", startTime: "15:00", endTime: "16:00", session: "AFTERNOON", isBreak: false, orderIndex: 2 },
      { day: "THURSDAY", period: 4, name: "Afternoon Break", startTime: "16:00", endTime: "16:15", session: "AFTERNOON", isBreak: true, breakType: "AFTERNOON_BREAK", orderIndex: 3 },
      { day: "THURSDAY", period: 5, name: "P4", startTime: "16:15", endTime: "17:15", session: "AFTERNOON", isBreak: false, orderIndex: 4 },
      { day: "THURSDAY", period: 6, name: "P5", startTime: "17:15", endTime: "18:15", session: "AFTERNOON", isBreak: false, orderIndex: 5 },
      
      // Friday
      { day: "FRIDAY", period: 1, name: "P1", startTime: "13:00", endTime: "14:00", session: "AFTERNOON", isBreak: false, orderIndex: 0 },
      { day: "FRIDAY", period: 2, name: "P2", startTime: "14:00", endTime: "15:00", session: "AFTERNOON", isBreak: false, orderIndex: 1 },
      { day: "FRIDAY", period: 3, name: "P3", startTime: "15:00", endTime: "16:00", session: "AFTERNOON", isBreak: false, orderIndex: 2 },
      { day: "FRIDAY", period: 4, name: "Afternoon Break", startTime: "16:00", endTime: "16:15", session: "AFTERNOON", isBreak: true, breakType: "AFTERNOON_BREAK", orderIndex: 3 },
      { day: "FRIDAY", period: 5, name: "P4", startTime: "16:15", endTime: "17:15", session: "AFTERNOON", isBreak: false, orderIndex: 4 },
      { day: "FRIDAY", period: 6, name: "P5", startTime: "17:15", endTime: "18:15", session: "AFTERNOON", isBreak: false, orderIndex: 5 }
    ]
  },
  {
    name: "Secondary School Full Day",
    description: "Traditional secondary school with extended periods",
    schoolType: "SECONDARY",
    isGlobal: true,
    slots: [
      // Monday
      { day: "MONDAY", period: 1, name: "Assembly", startTime: "07:30", endTime: "08:00", session: "MORNING", isBreak: true, breakType: "ASSEMBLY", orderIndex: 0 },
      { day: "MONDAY", period: 2, name: "P1", startTime: "08:00", endTime: "09:00", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "MONDAY", period: 3, name: "P2", startTime: "09:00", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "MONDAY", period: 4, name: "Morning Break", startTime: "10:00", endTime: "10:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "MONDAY", period: 5, name: "P3", startTime: "10:20", endTime: "11:20", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "MONDAY", period: 6, name: "P4", startTime: "11:20", endTime: "12:20", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "MONDAY", period: 7, name: "Lunch Break", startTime: "12:20", endTime: "13:30", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "MONDAY", period: 8, name: "P5", startTime: "13:30", endTime: "14:30", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "MONDAY", period: 9, name: "P6", startTime: "14:30", endTime: "15:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "MONDAY", period: 10, name: "P7", startTime: "15:30", endTime: "16:30", session: "AFTERNOON", isBreak: false, orderIndex: 9 },
      
      // Tuesday through Friday (similar structure)
      { day: "TUESDAY", period: 1, name: "P1", startTime: "08:00", endTime: "09:00", session: "MORNING", isBreak: false, orderIndex: 0 },
      { day: "TUESDAY", period: 2, name: "P2", startTime: "09:00", endTime: "10:00", session: "MORNING", isBreak: false, orderIndex: 1 },
      { day: "TUESDAY", period: 3, name: "P3", startTime: "10:00", endTime: "11:00", session: "MORNING", isBreak: false, orderIndex: 2 },
      { day: "TUESDAY", period: 4, name: "Morning Break", startTime: "11:00", endTime: "11:20", session: "MORNING", isBreak: true, breakType: "MORNING_BREAK", orderIndex: 3 },
      { day: "TUESDAY", period: 5, name: "P4", startTime: "11:20", endTime: "12:20", session: "MORNING", isBreak: false, orderIndex: 4 },
      { day: "TUESDAY", period: 6, name: "P5", startTime: "12:20", endTime: "13:20", session: "MORNING", isBreak: false, orderIndex: 5 },
      { day: "TUESDAY", period: 7, name: "Lunch Break", startTime: "13:20", endTime: "14:30", session: "AFTERNOON", isBreak: true, breakType: "LUNCH_BREAK", orderIndex: 6 },
      { day: "TUESDAY", period: 8, name: "P6", startTime: "14:30", endTime: "15:30", session: "AFTERNOON", isBreak: false, orderIndex: 7 },
      { day: "TUESDAY", period: 9, name: "P7", startTime: "15:30", endTime: "16:30", session: "AFTERNOON", isBreak: false, orderIndex: 8 },
      { day: "TUESDAY", period: 10, name: "P8", startTime: "16:30", endTime: "17:30", session: "AFTERNOON", isBreak: false, orderIndex: 9 }
      // Continue for Wednesday, Thursday, Friday...
    ]
  }
]

async function seedTemplates() {
  try {
    console.log('Starting template seeding...')

    for (const templateData of templates) {
      console.log(`Creating template: ${templateData.name}`)
      
      // Create template
      const template = await prisma.timeSlotTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          schoolType: templateData.schoolType,
          isGlobal: templateData.isGlobal,
          isActive: true
        }
      })

      // Create template slots
      for (const slotData of templateData.slots) {
        await prisma.timeSlotTemplateSlot.create({
          data: {
            templateId: template.id,
            day: slotData.day,
            period: slotData.period,
            name: slotData.name,
            startTime: slotData.startTime,
            endTime: slotData.endTime,
            session: slotData.session,
            isBreak: slotData.isBreak,
            breakType: slotData.breakType,
            orderIndex: slotData.orderIndex
          }
        })
      }

      console.log(`Template ${templateData.name} created successfully with ${templateData.slots.length} slots`)
    }

    console.log('All templates seeded successfully!')
  } catch (error) {
    console.error('Error seeding templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedTemplates()