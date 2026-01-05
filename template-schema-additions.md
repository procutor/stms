// Time Slot Template Management System
// This file contains the database schema additions for the template system

/*
ADD TO SCHEMA.PRISMA:

model TimeSlotTemplate {
  id          String   @id @default(cuid())
  name        String   // Template name (e.g., "Standard Primary School", "TSS Afternoon Shift")
  description String?  // Optional description
  schoolType  String   // PRIMARY, SECONDARY, TSS, or null for global templates
  isGlobal    Boolean  @default(false) // True for system-wide templates
  isActive    Boolean  @default(true)
  createdBy   String?  // User ID who created the template
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  slots       TimeSlotTemplateSlot[]
  school      School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  schoolId    String?
  creator     User?    @relation(fields: [createdBy], references: [id])

  @@map("time_slot_templates")
}

model TimeSlotTemplateSlot {
  id          String @id @default(cuid())
  templateId  String
  day         String // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
  period      Int
  name        String // P1, P2, Break, Assembly, etc.
  startTime   String // HH:MM format
  endTime     String // HH:MM format
  session     String // MORNING, AFTERNOON
  isBreak     Boolean @default(false)
  breakType   String? // ASSEMBLY, MORNING_BREAK, LUNCH_BREAK, AFTERNOON_BREAK, END_OF_DAY
  orderIndex  Int     // For sorting within the same day

  // Relations
  template TimeSlotTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, day, period])
  @@map("time_slot_template_slots")
}
*/