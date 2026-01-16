# Timetable Generation Flow Updates

## Overview
Updated the timetable generation system to support selective class-based generation while maintaining **global teacher availability constraints** across the entire school. The system now ensures teachers cannot have overlapping sessions across different classes, even when generating timetables for individual classes.

## Enhanced Teacher Availability Logic

### Key Principles
- **Global Teacher Availability**: Teacher availability is checked against ALL existing timetables in the school
- **No Time Overlap**: Teachers cannot be scheduled for multiple subjects/modules at the same time
- **Class-Local Generation**: While generation is for a specific class, teacher constraints are global
- **Smart Loading**: When generating for a class, only loads timetables from OTHER classes (not the target class)

### Updated Methods

#### `initializeAvailabilityWithExistingTimetables(excludeClassId?: string)`
- **Enhanced to accept `excludeClassId` parameter** for class-specific generation
- **Loads ALL existing timetables** from the school, excluding the class being regenerated
- **Creates global teacher availability map** from all existing timetables
- **Logs loading statistics** for debugging purposes

#### `scheduleLesson()` - Enhanced Global Checking
- **Global Teacher Availability Check**: `!this.teacherAvailability[lesson.teacherId]?.has(slotKey)`
- **Respects teacher constraints** from all existing timetables across school
- **Prevents time overlap** for teachers teaching multiple subjects/modules
- **Enhanced conflict detection** with global availability awareness

### Enhanced Conflict Detection
- **`isTeacherOverbooked()` method** identifies potential overbooking issues
- **Improved conflict messages** indicate when teacher has conflicting commitments
- **Better suggestions** for resolving global teacher conflicts

## Changes Made

### 1. Updated TimetableGenerator Class (`src/lib/timetable-generator.ts`)

#### New Method: `generateForClass(classId: string)`
- Generates timetable for a specific class only
- Clears existing timetables for that class only (preserves other classes)
- **Enhanced to respect global teacher availability** from ALL existing timetables
- Only loads timetables from OTHER classes (excludes the target class being regenerated)
- Filters lessons to only include those for the specified class

#### Enhanced Method: `initializeAvailabilityWithExistingTimetables(excludeClassId?: string)`
- **Key Enhancement**: Accepts `excludeClassId` parameter to exclude the class being regenerated
- Loads existing timetables from OTHER classes to respect teacher availability globally
- Prevents teacher conflicts across the entire school
- Maintains class availability tracking for all classes
- **Enhanced logging** for debugging teacher availability conflicts

#### Updated Method: `generate()` 
- Continues to work for full school generation (existing functionality)
- Now benefits from enhanced global teacher availability checking

### 2. New Export Function: `generateTimetableForClass(schoolId, classId)`
- Public function that creates a TimetableGenerator instance and calls generateForClass
- Maintains the same interface pattern as the existing generateTimetable function

### 3. Updated API Route (`src/app/api/generate/route.ts`)

#### Enhanced POST Method
- Now accepts optional `classId` parameter
- When `classId` is provided: generates timetable for specific class only (with global teacher constraints)
- When `classId` is not provided: generates for entire school (existing behavior)
- Validates class existence before generation
- Returns appropriate success/error messages with class information

#### Validation Improvements
- Validates class exists and belongs to the user's school
- Returns detailed error messages for missing classes
- Maintains existing validation for school approval status

### 4. Enhanced School Admin UI (`src/app/dashboard/school-admin/timetables/page.tsx`)

#### New Generation Mode Selection
- Radio buttons to choose between "Generate for entire school" or "Generate for specific class"
- Clear, intuitive interface for mode selection

#### Class Selection Dropdown
- Dynamically populated from available classes
- Only shown when "Generate for specific class" is selected
- Real-time validation (button disabled until class is selected)
- Shows selected class name in button text

#### Improved User Experience
- Clear labels and descriptions for each option
- Visual feedback during generation process
- Success messages include class name for class-specific generation
- Automatic form reset after successful generation

#### Enhanced State Management
- Tracks selected class ID
- Manages generation mode state
- Handles loading states appropriately

## Key Features

### 1. Global Teacher Availability Respect
- **When generating for a class**, system loads ALL existing timetables from OTHER classes
- **Teacher availability is checked globally** - no overlaps allowed across classes
- **Smart exclusion**: Only loads timetables from classes other than the one being regenerated
- **Comprehensive logging** for debugging availability conflicts

### 2. Selective Generation
- School Admin can choose to generate for entire school or single class
- Class selection is required for per-class generation
- Clear UI indicators for current selection

### 3. Enhanced Conflict Detection
- **Global conflict identification**: Detects when teacher has commitments in other classes
- **Improved error messages**: Clear indication of global availability conflicts
- **Better suggestions**: Recommendations for resolving teacher conflicts across classes

### 4. Data Integrity
- Only clears timetables for the target class (when class-specific)
- Preserves existing timetables for other classes
- Maintains referential integrity

### 5. Comprehensive Validation
- Validates class existence and ownership
- Ensures school approval status
- Provides detailed error messages

## Usage

### Generate for Entire School
```javascript
// Existing behavior - no changes needed
POST /api/generate
{
  "regenerate": false
}
```

### Generate for Specific Class (with Global Teacher Constraints)
```javascript
// New functionality with enhanced global teacher availability checking
POST /api/generate
{
  "classId": "class-uuid-here",
  "regenerate": false
}
```

## API Response Examples

### Success Response (Class-Specific with Global Constraints)
```javascript
{
  "message": "Timetable generated successfully for class 10A",
  "conflicts": [...],
  "conflictCount": 0,
  "classId": "class-uuid-here",
  "className": "10A"
}
```

### Success Response (School-Wide)
```javascript
{
  "message": "Timetable generated successfully for entire school",
  "conflicts": [...],
  "conflictCount": 2
}
```

### Enhanced Conflict Response (Global Teacher Conflict)
```javascript
{
  "error": "Timetable generation for class failed",
  "conflicts": [
    {
      "type": "unassigned",
      "message": "Could not schedule Mathematics for Mr. Smith in 10A (Lesson 1/5) - Teacher has conflicting commitments in other classes",
      "suggestions": [
        "Add more time slots to the schedule",
        "Reduce teacher workload or redistribute assignments", 
        "Check teacher availability constraints across all classes",
        "Consider manual scheduling for this specific lesson",
        "Review existing timetables for teacher conflicts"
      ]
    }
  ]
}
```

## Benefits

1. **Global Teacher Constraint Respect**: Ensures teachers cannot have overlapping sessions across different classes
2. **Flexibility**: Generate timetables for individual classes without affecting others
3. **Efficiency**: Faster generation for single classes vs entire school
4. **Data Integrity**: Maintains teacher availability across entire school
5. **User Control**: School Admin has precise control over what gets generated
6. **Enhanced Conflict Resolution**: Better identification and suggestions for teacher conflicts
7. **Backward Compatibility**: Existing school-wide generation continues to work

## Teacher Availability Rules

### When Generating for a Class:
1. **Load existing timetables** from ALL OTHER classes (not the target class)
2. **Mark teacher slots as occupied** globally across all classes
3. **Check teacher availability** against this global availability map
4. **Prevent any time overlap** for teachers teaching multiple subjects/modules
5. **Respect teacher constraints** from existing timetables

### Teacher May Teach Multiple Subjects/Modules:
- ✅ Teacher can teach Mathematics in Class 10A AND Physics in Class 10B (different times)
- ❌ Teacher CANNOT teach Mathematics in Class 10A AND Physics in Class 10B (same time)
- ✅ Teacher can teach multiple subjects in same class at different times
- ❌ Teacher CANNOT teach multiple subjects in same class at same time

## Implementation Status

✅ **Completed:**
- Enhanced TimetableGenerator class with global teacher availability checking
- generateTimetableForClass function with global constraints
- API route updated to support class-specific generation with global teacher constraints
- School admin UI enhanced with class selection
- **Enhanced global teacher availability respect across entire school**
- **Smart loading of existing timetables (excludes target class)**
- **Improved conflict detection and messaging**
- Comprehensive validation and error handling

The implementation is ready for testing and deployment with enhanced global teacher availability constraints.