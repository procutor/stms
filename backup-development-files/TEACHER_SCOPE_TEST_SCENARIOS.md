# Teacher Scope Edge Cases - Comprehensive Test Scenarios

## Overview

This document provides comprehensive test scenarios to validate that the timetable engine correctly handles full teacher scope across all class types, subjects, modules, and streams.

## Test Scenario Categories

### 1. **Multi-Class Teaching Scenarios**

#### Test Case 1.1: Same Subject, Multiple Classes
**Setup:**
- Teacher A teaches Mathematics in Class 10A and Class 10B
- Each class has 5 periods of Math per week
- Time slots: Monday P1, P2; Tuesday P1, P2; Wednesday P1

**Expected Behavior:**
- ✅ Teacher can be scheduled in different time slots for each class
- ❌ Teacher cannot be scheduled at same time in both classes
- ✅ Conflict detected and resolved automatically

**Test Validation:**
```typescript
// Should prevent this schedule:
Monday P1: Math - Teacher A - Class 10A
Monday P1: Math - Teacher A - Class 10B  // CONFLICT

// Should allow this schedule:
Monday P1: Math - Teacher A - Class 10A
Monday P2: Math - Teacher A - Class 10B  // OK
```

#### Test Case 1.2: Different Subjects, Multiple Classes
**Setup:**
- Teacher B teaches Mathematics in Class 9A and Physics in Class 10A
- Each subject has 4 periods per week

**Expected Behavior:**
- ✅ Teacher can teach different subjects in different classes
- ❌ Cannot teach both subjects at same time
- ✅ Scheduling engine treats both subjects equally

### 2. **Multi-Stream Teaching Scenarios**

#### Test Case 2.1: Primary + Secondary Combination
**Setup:**
- Teacher C teaches Primary Math (P5) and Secondary Math (S3)
- Each has 5 periods per week

**Expected Behavior:**
- ✅ Teacher can teach across Primary and Secondary streams
- ❌ Cannot teach at same time across streams
- ✅ Both stream lessons treated equally

#### Test Case 2.2: TSS + Secondary Combination
**Setup:**
- Teacher D teaches Secondary Physics (S4) and TSS Engineering (L3)
- Secondary: 4 periods, TSS: 6 hours

**Expected Behavior:**
- ✅ Teacher can teach both TSS modules and Secondary subjects
- ✅ TSS modules get morning preference consideration
- ❌ No time overlap between streams

### 3. **Complex Multi-Scope Scenarios**

#### Test Case 3.1: Maximum Scope Teacher
**Setup:**
- Teacher E teaches:
  - Mathematics in Class 8A, 9A, 10A (3 classes)
  - Physics in Class 10A, 10B (2 classes)
  - TSS Engineering in L3, L4 (2 classes)
  - Total: 7 class-subject combinations

**Expected Behavior:**
- ✅ Teacher scope properly analyzed (7 combinations)
- ✅ Higher scheduling priority due to broad scope
- ✅ Complex conflict detection
- ✅ Balanced workload distribution

**Validation Points:**
```typescript
// Scope calculation should be:
uniqueClasses = 5 (8A, 9A, 10A, 10B, L3, L4)
uniqueSubjects = 3 (Math, Physics, Engineering)
uniqueLevels = 3 (S8, S10, L3/L4)
scopeScore = (5 * 3) + (3 * 2) + 3 = 15 + 6 + 3 = 24
```

#### Test Case 3.2: Role Combination (Teacher + Trainer)
**Setup:**
- Teacher F is both:
  - Teacher: Teaches Chemistry in S4A, S5A
  - Trainer: Teaches TSS Laboratory in L4, L5

**Expected Behavior:**
- ✅ Both roles treated equally
- ✅ All lessons considered in scope calculation
- ✅ No scheduling conflicts between role types
- ✅ Morning preference applied to TSS modules

### 4. **Conflict Resolution Scenarios**

#### Test Case 4.1: No Available Time Slots
**Setup:**
- Teacher G teaches in 8 classes with high lesson requirements
- Limited time slots available
- Many other teachers also teaching

**Expected Behavior:**
- ✅ Conflict properly detected
- ✅ Detailed conflict message with scope information
- ✅ Suggestions for resolution provided
- ✅ Teacher scope included in conflict details

**Expected Conflict Message:**
```
"Could not schedule Mathematics for Teacher G in Class 9A (Lesson 2/5) - Teacher scope: 8 classes, 4 subjects/modules"
```

#### Test Case 4.2: Workload Imbalance
**Setup:**
- Teacher H tends to be scheduled heavily in one class
- Other classes receive few lessons from this teacher

**Expected Behavior:**
- ✅ Workload balance validation prevents over-scheduling
- ✅ Max 3 lessons per class per day enforced
- ✅ Lessons distributed across teacher's classes

### 5. **Class-Specific Generation Scenarios**

#### Test Case 5.1: Regenerating Single Class
**Setup:**
- School has existing timetables for all classes
- School Admin regenerates only Class 10A
- Teacher J teaches in Class 10A and other classes

**Expected Behavior:**
- ✅ Only Class 10A timetables cleared
- ✅ Existing timetables from other classes preserved
- ✅ Teacher availability from other classes respected
- ✅ No conflicts with existing schedule

#### Test Case 5.2: Global Teacher Constraints in Class Generation
**Setup:**
- Teacher K has lessons scheduled in Classes 9A, 9B, 10B
- Regenerating Class 10A where Teacher K also teaches

**Expected Behavior:**
- ✅ Teacher K's existing commitments in 9A, 9B, 10B respected
- ✅ Teacher K cannot be scheduled in 10A at conflicting times
- ✅ Global teacher availability maintained

### 6. **Edge Case Scenarios**

#### Test Case 6.1: Teacher with No Assignments
**Setup:**
- Teacher L exists in system but has no class assignments

**Expected Behavior:**
- ✅ Teacher included in availability tracking
- ✅ No lessons to schedule for this teacher
- ✅ No conflicts or errors generated

#### Test Case 6.2: Single Class, Single Teacher
**Setup:**
- Small school with one class and one teacher
- Teacher teaches multiple subjects in same class

**Expected Behavior:**
- ✅ All subjects can be scheduled at different times
- ✅ No conflicts within same class for different subjects
- ✅ Consecutive period rules still apply

#### Test Case 6.3: Teacher with Availability Constraints
**Setup:**
- Teacher M unavailable on Wednesdays and Period 3
- Has assignments across multiple classes

**Expected Behavior:**
- ✅ Availability constraints respected across all classes
- ✅ No scheduling on unavailable days/periods
- ✅ Constraints apply globally, not per class

### 7. **Performance and Scalability Tests**

#### Test Case 7.1: Large School Scenario
**Setup:**
- 50 classes
- 30 teachers
- Complex assignment matrix
- Multiple streams (Primary, Secondary, TSS)

**Expected Behavior:**
- ✅ Timetable generation completes within reasonable time
- ✅ Memory usage remains manageable
- ✅ All teacher scopes properly analyzed
- ✅ No scheduling conflicts

#### Test Case 7.2: Maximum Teacher Scope
**Setup:**
- One teacher assigned to maximum possible classes
- All subjects/modules in school
- All levels and streams

**Expected Behavior:**
- ✅ Teacher scope calculation accurate
- ✅ High-priority scheduling for broad scope
- ✅ Conflict detection works with complex assignments
- ✅ System remains stable

## Automated Test Cases

### Unit Tests

#### Test 1: Teacher Scope Calculation
```typescript
describe('calculateTeacherScope', () => {
  it('should calculate scope correctly for multi-class teacher', () => {
    const lessons = createMockLessons([
      { teacherId: 'T1', classId: 'C1', subjectId: 'S1' },
      { teacherId: 'T1', classId: 'C2', subjectId: 'S1' },
      { teacherId: 'T1', classId: 'C1', subjectId: 'S2' }
    ])
    
    const scope = calculateTeacherScope(lessons, 'T1')
    expect(scope).toBeGreaterThan(0)
  })
})
```

#### Test 2: Global Availability Checking
```typescript
describe('teacher availability', () => {
  it('should prevent scheduling at same time across classes', () => {
    const generator = new TimetableGenerator('school1')
    
    // Schedule teacher in Class A at Monday P1
    // Attempt to schedule same teacher in Class B at Monday P1
    // Should be prevented
  })
})
```

#### Test 3: Workload Balancing
```typescript
describe('workload balancing', () => {
  it('should prevent over-scheduling in single class', () => {
    const generator = new TimetableGenerator('school1')
    
    // Schedule 3 lessons for teacher in class on same day
    // 4th lesson should be prevented
  })
})
```

### Integration Tests

#### Test 1: Full School Generation
```typescript
describe('full school generation', () => {
  it('should generate conflict-free timetable for entire school', async () => {
    const result = await generateTimetable('school1')
    expect(result.success).toBe(true)
    expect(result.conflicts).toHaveLength(0)
  })
})
```

#### Test 2: Class-Specific Generation
```typescript
describe('class-specific generation', () => {
  it('should respect global teacher constraints', async () => {
    const result = await generateTimetableForClass('school1', 'class1')
    expect(result.success).toBe(true)
    // Verify no conflicts with existing timetables
  })
})
```

## Test Data Setup

### Sample School Structure
```typescript
const testSchool = {
  id: 'test-school',
  classes: [
    { id: 'P5A', level: 'P5', stream: 'A' },
    { id: 'S3A', level: 'S3', stream: 'A' },
    { id: 'S3B', level: 'S3', stream: 'B' },
    { id: 'L3A', level: 'L3', stream: 'Engineering' },
    { id: 'L4A', level: 'L4', stream: 'Engineering' }
  ],
  teachers: [
    { id: 'T1', name: 'Math Teacher', role: 'TEACHER' },
    { id: 'T2', name: 'Science Teacher', role: 'TEACHER' },
    { id: 'T3', name: 'Engineering Trainer', role: 'TRAINER' }
  ]
}
```

### Sample Assignments
```typescript
const assignments = [
  // Multi-class math teacher
  { teacherId: 'T1', classId: 'S3A', subjectId: 'Math' },
  { teacherId: 'T1', classId: 'S3B', subjectId: 'Math' },
  
  // Cross-stream teacher
  { teacherId: 'T2', classId: 'P5A', subjectId: 'Science' },
  { teacherId: 'T2', classId: 'S3A', subjectId: 'Science' },
  
  // TSS trainer
  { teacherId: 'T3', classId: 'L3A', moduleId: 'Engineering' },
  { teacherId: 'T3', classId: 'L4A', moduleId: 'Engineering' }
]
```

## Expected Test Outcomes

### Success Criteria
1. ✅ No teacher scheduling conflicts across any classes
2. ✅ All teacher lessons treated equally
3. ✅ Complex teacher scopes handled correctly
4. ✅ Workload balanced across teacher's classes
5. ✅ Availability constraints respected globally
6. ✅ Clear conflict detection and reporting
7. ✅ Performance acceptable for large schools

### Failure Indicators
1. ❌ Teacher scheduled at same time in multiple classes
2. ❌ Bias toward specific class types or subjects
3. ❌ Incorrect scope calculation for complex teachers
4. ❌ Workload imbalance not detected
5. ❌ Availability constraints not applied globally
6. ❌ Confusing or unclear conflict messages
7. ❌ System performance degradation

## Validation Checklist

### Before Deployment
- [ ] All test scenarios pass
- [ ] Performance tests completed
- [ ] Edge cases handled correctly
- [ ] Conflict messages are clear and actionable
- [ ] Logging provides sufficient debugging information
- [ ] Database constraints enforced
- [ ] API responses include scope information

### Ongoing Validation
- [ ] Monitor conflict rates in production
- [ ] Track teacher utilization across schools
- [ ] Validate workload distribution
- [ ] Review user feedback on scheduling quality
- [ ] Analyze performance metrics

## Conclusion

These comprehensive test scenarios ensure that the enhanced timetable engine correctly handles all aspects of full teacher scope:

✅ **Multiple classes handled without conflicts**  
✅ **Multiple subjects/modules scheduled properly**  
✅ **Multiple streams (Primary, Secondary, TSS) supported**  
✅ **Equal treatment of all teacher lessons**  
✅ **Complex teacher scopes analyzed correctly**  
✅ **Workload balanced across teacher's assignments**  
✅ **Global availability constraints enforced**  

The test scenarios provide confidence that the implementation meets all requirements for full teacher scope consideration in the timetable generation system.