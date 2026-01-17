-- Supabase Schema SQL
-- Run this in Supabase SQL Editor to create all tables

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  "schoolId" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "maxWeeklyHours" INTEGER,
  "teachingStreams" TEXT,
  "unavailableDays" TEXT,
  "unavailablePeriods" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools table
CREATE TABLE schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  province TEXT,
  district TEXT,
  sector TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  level TEXT,
  stream TEXT,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("schoolId", level, stream)
);

-- Subjects table
CREATE TABLE subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT,
  "periodsPerWeek" INTEGER NOT NULL,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT,
  trade TEXT,
  "totalHours" INTEGER NOT NULL,
  category TEXT NOT NULL,
  "blockSize" INTEGER DEFAULT 1,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("schoolId", name, level)
);

-- Teacher Subjects table
CREATE TABLE teacher_subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  UNIQUE("teacherId", "subjectId")
);

-- Trainer Modules table
CREATE TABLE trainer_modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "trainerId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  UNIQUE("trainerId", "moduleId")
);

-- Class Subjects table
CREATE TABLE class_subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  UNIQUE("classId", "subjectId")
);

-- Time Slots table
CREATE TABLE time_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL,
  day TEXT NOT NULL,
  period INTEGER NOT NULL,
  name TEXT NOT NULL,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  session TEXT NOT NULL,
  "isBreak" BOOLEAN DEFAULT false,
  "breakType" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("schoolId", day, period)
);

-- Timetables table
CREATE TABLE timetables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT,
  "moduleId" TEXT,
  "timeSlotId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("schoolId", "classId", "timeSlotId")
);

-- Teacher Class Subjects table
CREATE TABLE teacher_class_subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teacherId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("teacherId", "classId", "subjectId")
);

-- Trainer Class Modules table
CREATE TABLE trainer_class_modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "trainerId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("trainerId", "classId", "moduleId")
);

-- Time Slot Templates table
CREATE TABLE time_slot_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  "schoolId" TEXT,
  "isGlobal" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Slot Template Slots table
CREATE TABLE time_slot_template_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "templateId" TEXT NOT NULL,
  day TEXT NOT NULL,
  period INTEGER NOT NULL,
  "orderIndex" INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  session TEXT NOT NULL,
  "isBreak" BOOLEAN DEFAULT false,
  "breakType" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE classes ADD CONSTRAINT fk_classes_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD CONSTRAINT fk_subjects_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE modules ADD CONSTRAINT fk_modules_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE teacher_subjects ADD CONSTRAINT fk_teacher_subjects_teacher FOREIGN KEY ("teacherId") REFERENCES users(id);
ALTER TABLE teacher_subjects ADD CONSTRAINT fk_teacher_subjects_subject FOREIGN KEY ("subjectId") REFERENCES subjects(id);
ALTER TABLE trainer_modules ADD CONSTRAINT fk_trainer_modules_trainer FOREIGN KEY ("trainerId") REFERENCES users(id);
ALTER TABLE trainer_modules ADD CONSTRAINT fk_trainer_modules_module FOREIGN KEY ("moduleId") REFERENCES modules(id);
ALTER TABLE class_subjects ADD CONSTRAINT fk_class_subjects_class FOREIGN KEY ("classId") REFERENCES classes(id);
ALTER TABLE class_subjects ADD CONSTRAINT fk_class_subjects_subject FOREIGN KEY ("subjectId") REFERENCES subjects(id);
ALTER TABLE time_slots ADD CONSTRAINT fk_time_slots_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_class FOREIGN KEY ("classId") REFERENCES classes(id);
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_teacher FOREIGN KEY ("teacherId") REFERENCES users(id);
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_subject FOREIGN KEY ("subjectId") REFERENCES subjects(id);
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_module FOREIGN KEY ("moduleId") REFERENCES modules(id);
ALTER TABLE timetables ADD CONSTRAINT fk_timetables_time_slot FOREIGN KEY ("timeSlotId") REFERENCES time_slots(id);
ALTER TABLE teacher_class_subjects ADD CONSTRAINT fk_teacher_class_subjects_teacher FOREIGN KEY ("teacherId") REFERENCES users(id);
ALTER TABLE teacher_class_subjects ADD CONSTRAINT fk_teacher_class_subjects_class FOREIGN KEY ("classId") REFERENCES classes(id);
ALTER TABLE teacher_class_subjects ADD CONSTRAINT fk_teacher_class_subjects_subject FOREIGN KEY ("subjectId") REFERENCES subjects(id);
ALTER TABLE teacher_class_subjects ADD CONSTRAINT fk_teacher_class_subjects_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE trainer_class_modules ADD CONSTRAINT fk_trainer_class_modules_trainer FOREIGN KEY ("trainerId") REFERENCES users(id);
ALTER TABLE trainer_class_modules ADD CONSTRAINT fk_trainer_class_modules_class FOREIGN KEY ("classId") REFERENCES classes(id);
ALTER TABLE trainer_class_modules ADD CONSTRAINT fk_trainer_class_modules_module FOREIGN KEY ("moduleId") REFERENCES modules(id);
ALTER TABLE trainer_class_modules ADD CONSTRAINT fk_trainer_class_modules_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE time_slot_templates ADD CONSTRAINT fk_time_slot_templates_school FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE time_slot_template_slots ADD CONSTRAINT fk_time_slot_template_slots_template FOREIGN KEY ("templateId") REFERENCES time_slot_templates(id) ON DELETE CASCADE;