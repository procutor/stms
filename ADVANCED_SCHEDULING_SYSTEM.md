# Advanced Scheduling System - Implementation Guide

## Overview

The Advanced Scheduling System provides comprehensive time slot template management with bulk editing capabilities, allowing schools to efficiently manage their schedules using pre-built templates and advanced editing features.

## Features Implemented

### 1. Time Slot Template System

#### Database Schema
- **TimeSlotTemplate**: Stores template metadata (name, description, school type, global flags)
- **TimeSlotTemplateSlot**: Individual time slots within templates with detailed scheduling information

#### Key Features
- **Global Templates**: System-wide templates available to all schools
- **School-Specific Templates**: Custom templates created by individual schools
- **School Type Filtering**: Templates filtered by PRIMARY, SECONDARY, or TSS school types
- **Version Control**: Built-in tracking of template creation and updates

### 2. API Endpoints

#### Template Management
```
GET    /api/time-slot-templates          # List all templates
POST   /api/time-slot-templates          # Create new template
GET    /api/time-slot-templates/[id]     # Get specific template
PUT    /api/time-slot-templates/[id]     # Update template
DELETE /api/time-slot-templates/[id]     # Delete template
```

#### Template Operations
```
POST   /api/time-slot-templates/[id]/apply      # Apply template to school
POST   /api/time-slot-templates/[id]/duplicate  # Duplicate template
```

#### Enhanced Time Slots Management
```
GET    /api/time-slots                # Get school time slots
POST   /api/time-slots                # Create single time slot
PUT    /api/time-slots                # Bulk update multiple slots
DELETE /api/time-slots                # Delete slots (by ID or day)
```

### 3. Pre-built Template Library

#### Standard Primary School Template
- **Structure**: 10 periods per day (8 teaching + 2 breaks)
- **Sessions**: Morning (8:00-11:40) and Afternoon (13:10-15:10)
- **Breaks**: Morning break (10:00-10:20) and Lunch break (11:40-13:10)
- **Days**: Monday through Friday (50 total slots)

#### TSS Afternoon Shift Template
- **Structure**: 6 periods per day with assembly
- **Sessions**: Afternoon only (13:00-18:15)
- **Features**: Assembly on Mondays, extended practical periods
- **Days**: Monday through Friday (30 total slots)

#### Secondary School Full Day Template
- **Structure**: 10 periods per day with extended periods
- **Sessions**: Full day (7:30-17:30)
- **Features**: Assembly, extended 1-hour periods
- **Days**: Monday through Friday (50 total slots)

### 4. Bulk Editing Capabilities

#### Multi-Slot Updates
- **Batch Operations**: Update multiple time slots simultaneously
- **Conflict Prevention**: Automatic validation to prevent scheduling conflicts
- **Data Integrity**: Transaction-based updates ensuring data consistency

#### Period/Break Management
- **Add Periods**: Create new teaching periods with custom timing
- **Edit Breaks**: Modify break types (Assembly, Morning Break, Lunch Break, Afternoon Break)
- **Delete Operations**: Remove individual periods or entire day schedules
- **Time Validation**: Ensure no overlapping time slots

### 5. Template Application System

#### Smart Application
- **Replace Existing**: Option to replace current school schedule entirely
- **Merge Options**: Intelligent handling of existing schedules
- **Validation**: Ensure template compatibility with school type

#### Template Duplication
- **Copy Templates**: Duplicate existing templates for customization
- **Permission Control**: Users can only duplicate templates they have access to
- **Automatic Naming**: Smart naming for duplicated templates

## API Usage Examples

### Creating a Template
```javascript
const response = await fetch('/api/time-slot-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Custom Primary Schedule',
    description: 'Modified primary school schedule',
    schoolType: 'PRIMARY',
    isGlobal: false,
    slots: [
      {
        day: 'MONDAY',
        period: 1,
        name: 'P1',
        startTime: '08:00',
        endTime: '08:40',
        session: 'MORNING',
        isBreak: false
      }
      // ... more slots
    ]
  })
})
```

### Applying a Template
```javascript
const response = await fetch('/api/time-slot-templates/[template-id]/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    replaceExisting: true  // Replace current schedule
  })
})
```

### Bulk Updating Time Slots
```javascript
const response = await fetch('/api/time-slots', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slots: [
      {
        id: 'slot-id-1',
        day: 'MONDAY',
        period: 1,
        name: 'Updated P1',
        startTime: '08:15',
        endTime: '08:55',
        session: 'MORNING',
        isBreak: false
      }
      // ... more slots to update
    ]
  })
})
```

### Deleting Time Slots
```javascript
// Delete specific slots by ID
const response = await fetch('/api/time-slots?ids=slot1,slot2,slot3', {
  method: 'DELETE'
})

// Delete all slots for a specific day
const response = await fetch('/api/time-slots?day=MONDAY', {
  method: 'DELETE'
})
```

## Security Features

### Authentication & Authorization
- **Session Required**: All endpoints require valid user sessions
- **Role-Based Access**: Only SCHOOL_ADMIN users can create/modify templates
- **School Isolation**: Users can only access templates for their own school
- **Global Template Access**: School admins can view but not modify global templates

### Data Validation
- **Input Validation**: All inputs validated for required fields and data types
- **Conflict Prevention**: Automatic detection and prevention of scheduling conflicts
- **Permission Checks**: Multi-level permission validation for all operations

## Database Schema

### TimeSlotTemplate Model
```typescript
{
  id: string
  name: string
  description?: string
  schoolType?: string  // PRIMARY, SECONDARY, TSS
  isGlobal: boolean    // System-wide availability
  isActive: boolean
  createdBy: string    // User ID
  schoolId?: string    // School-specific templates
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  slots: TimeSlotTemplateSlot[]
  creator: User
  school: School
}
```

### TimeSlotTemplateSlot Model
```typescript
{
  id: string
  templateId: string
  day: string         // MONDAY, TUESDAY, etc.
  period: number
  name: string        // P1, P2, Break, Assembly
  startTime: string   // HH:MM format
  endTime: string     // HH:MM format
  session: string     // MORNING, AFTERNOON
  isBreak: boolean
  breakType?: string  // ASSEMBLY, MORNING_BREAK, etc.
  orderIndex: number
  
  // Relations
  template: TimeSlotTemplate
}
```

## Error Handling

### Common Error Responses
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions for requested operation
- **404 Not Found**: Template or time slot not found
- **400 Bad Request**: Invalid input data or validation errors
- **409 Conflict**: Scheduling conflicts detected
- **500 Internal Server Error**: Unexpected server errors

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "details": "Additional error context (optional)"
}
```

## Performance Optimizations

### Database Optimizations
- **Indexed Queries**: Optimized database indexes for fast template lookups
- **Pagination Support**: Large template lists support pagination
- **Eager Loading**: Efficient data loading with selective relations

### Caching Strategy
- **Template Caching**: Frequently accessed templates cached for performance
- **Build Optimization**: Next.js optimized builds for API routes

## Testing & Validation

### API Testing
- **Unit Tests**: Individual endpoint testing with various scenarios
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load testing for high-traffic scenarios

### Data Validation
- **Schema Validation**: Comprehensive input validation
- **Business Logic Testing**: Scheduling conflict detection and prevention
- **Permission Testing**: Authorization boundary testing

## Future Enhancements

### Planned Features
1. **Template Versioning**: Version control for template changes
2. **Advanced Scheduling Rules**: Complex scheduling constraints
3. **Integration APIs**: Third-party calendar system integration
4. **Reporting & Analytics**: Schedule utilization reports
5. **Mobile App Support**: Mobile-optimized scheduling interface

### Scalability Improvements
1. **Microservices Architecture**: Split into specialized services
2. **Real-time Updates**: WebSocket support for live schedule updates
3. **Advanced Caching**: Redis-based caching for improved performance
4. **Database Sharding**: Horizontal scaling for large deployments

## Deployment Considerations

### Environment Setup
1. **Database Migration**: Run Prisma migrations for new schema
2. **Seed Data**: Execute template seeding script for default templates
3. **Environment Variables**: Configure database and authentication settings
4. **Build Process**: Ensure TypeScript compilation and Next.js builds

### Monitoring & Logging
1. **API Monitoring**: Track endpoint usage and performance
2. **Error Logging**: Comprehensive error tracking and alerting
3. **Performance Metrics**: Monitor database query performance
4. **User Activity**: Track template usage and modifications

This implementation provides a robust foundation for advanced scheduling management with enterprise-grade features and extensibility for future enhancements.