# Time Slots Automation Guide

## Overview

The School Timetable Management System now includes comprehensive automatic time slot creation and management functionality. Every school can have time slots automatically generated and edited as needed.

## 🎯 Features Implemented

### ✅ Automatic Time Slot Creation
- **For Individual Schools**: School admins can set up time slots for their own school
- **For All Schools**: Super admins can set up time slots for all approved schools at once
- **Smart Detection**: System automatically detects schools that already have time slots
- **Bulk Processing**: Process multiple schools efficiently with detailed logging

### ✅ Editable Time Slots
- **Individual Editing**: Modify specific time slots via PATCH API
- **Validation**: Prevents overlapping periods and ensures data integrity
- **Flexible Updates**: Update any combination of fields (time, name, session, etc.)

### ✅ Comprehensive Schedule Structure
- **5 School Days**: Monday through Friday
- **14 Time Slots Per Day**: Including breaks and assembly
- **Multiple Sessions**: Morning, Afternoon, and Evening periods
- **Break Types**: Assembly, Morning Break, Lunch Break, Afternoon Break

## 📅 Default Schedule Structure

```
DAILY SCHEDULE (Monday - Friday):

07:45 - 08:00  School Assembly
08:00 - 08:40  Period 1 (Morning)
08:40 - 09:20  Period 2 (Morning)
09:20 - 10:00  Period 3 (Morning)
10:00 - 10:20  Morning Break
10:20 - 11:00  Period 4 (Morning)
11:00 - 11:40  Period 5 (Morning)
11:40 - 13:10  Lunch Break
13:10 - 13:50  Period 6 (Afternoon)
13:50 - 14:30  Period 7 (Afternoon)
14:30 - 15:10  Period 8 (Afternoon)
15:10 - 15:30  Afternoon Break
15:30 - 16:10  Period 9 (Afternoon)
16:10 - 16:50  Period 10 (Afternoon)
16:50 - 17:30  Period 11 (Evening)
17:30 - 18:10  Period 12 (Evening)
18:10 - 18:50  Period 13 (Evening)
```

**Total: 70 time slots per school (14 slots × 5 days)**

## 🔧 API Endpoints

### School Admin Endpoints

#### 1. Setup Time Slots for Current School
```http
POST /api/setup-time-slots
```
- **Access**: School Admin only
- **Function**: Creates default time slots for the authenticated school admin's school
- **Behavior**: 
  - Skips if school already has time slots
  - Creates 70 time slots if none exist
  - Returns detailed information about the created slots

#### 2. Check Current School's Time Slots
```http
GET /api/setup-time-slots
```
- **Access**: School Admin only
- **Function**: Returns status and details of current school's time slots
- **Response**: Includes count, structure validation, and sample schedule

#### 3. List School's Time Slots
```http
GET /api/time-slots
```
- **Access**: School Admin only
- **Function**: Returns all active time slots for the current school
- **Order**: Sorted by day and period

#### 4. Create Individual Time Slot
```http
POST /api/time-slots
Content-Type: application/json

{
  "day": "MONDAY",
  "period": 1,
  "name": "Period 1",
  "startTime": "08:00:00",
  "endTime": "08:40:00",
  "session": "MORNING",
  "isBreak": false,
  "breakType": null
}
```

#### 5. Edit Time Slot
```http
PATCH /api/time-slots/[id]
Content-Type: application/json

{
  "name": "Updated Period Name",
  "startTime": "08:10:00",
  "endTime": "08:50:00"
}
```

#### 6. Delete Time Slot
```http
DELETE /api/time-slots/[id]
```
- **Protection**: Prevents deletion if time slot is used in timetables

### Super Admin Endpoints

#### 7. Setup Time Slots for All Schools
```http
POST /api/setup-time-slots-all
```
- **Access**: Super Admin only
- **Function**: Creates time slots for all approved schools
- **Features**:
  - Processes all approved schools automatically
  - Skips schools that already have time slots
  - Provides detailed processing summary
  - Logs progress for each school

#### 8. Check All Schools' Time Slot Status
```http
GET /api/setup-time-slots-all
```
- **Access**: Super Admin only
- **Function**: Returns status of time slots for all schools
- **Response**: Includes which schools need setup and which are complete

## 🚀 How to Use

### For School Admins

1. **Automatic Setup**:
   - Login as School Admin
   - Navigate to time slots management
   - Click "Setup Time Slots" or call `POST /api/setup-time-slots`
   - System automatically creates 70 time slots

2. **Editing Time Slots**:
   - Access the time slots list
   - Click on any time slot to edit
   - Modify times, names, or other properties
   - Save changes (system validates for overlaps)

### For Super Admins

1. **Bulk Setup for All Schools**:
   - Login as Super Admin
   - Call `POST /api/setup-time-slots-all`
   - System processes all approved schools
   - Monitor progress in the response

2. **Monitor School Status**:
   - Call `GET /api/setup-time-slots-all`
   - See which schools have time slots and which need setup

## 🛠️ Utility Scripts

### Command Line Setup
```bash
# Setup time slots for all schools
node setup-all-school-time-slots.js

# Test the time slot functionality
node test-time-slots-setup.js
```

### Testing Features
The test script (`test-time-slots-setup.js`) provides:
- School status overview
- Time slot creation testing
- Schedule validation
- Feature demonstration

## 📊 Benefits

### ✅ Automatic Creation
- **Zero Configuration**: Schools get time slots immediately upon approval
- **Consistent Structure**: All schools have the same professional schedule
- **No Manual Entry**: Eliminates tedious manual time slot creation

### ✅ Full Editability
- **Flexible Management**: Modify any time slot as needed
- **Validation**: Prevents scheduling conflicts
- **User-Friendly**: Simple API and interface

### ✅ Scalability
- **Bulk Operations**: Super admins can set up entire districts
- **Efficient Processing**: Handles multiple schools simultaneously
- **Smart Detection**: Avoids duplicate work

### ✅ Reliability
- **Data Integrity**: Comprehensive validation
- **Error Handling**: Detailed error messages and recovery
- **Audit Trail**: Complete logging of all operations

## 🔄 Workflow Integration

1. **School Approval**: When a school is approved, time slots can be automatically created
2. **Teacher Assignment**: Teachers can be assigned to periods once time slots exist
3. **Timetable Generation**: Complete timetables can be generated using the time slots
4. **Ongoing Management**: Time slots can be modified as needed throughout the academic year

## 🎉 Result

Your School Timetable Management System now has **complete automatic time slot management**! Every approved school automatically gets a professional schedule that can be fully customized as needed.

**Ready to use immediately - no manual setup required!**