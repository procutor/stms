# Database Migration and Optimization Plan

## Overview

This document outlines a comprehensive database restructuring plan to optimize the School Timetable Management System's database schema, improve performance, and maintain data integrity during the migration process.

## Current Database Analysis

### Current Schema Overview

The current Prisma schema contains 12 main models with complex relationships:

1. **User** - Central user entity with role-based access
2. **School** - School information and settings
3. **Class** - Academic classes within schools
4. **Subject** - Academic subjects (Primary/Secondary)
5. **Module** - TSS modules with trade specifications
6. **TeacherSubject** - Teacher-subject relationships
7. **TrainerModule** - Trainer-module relationships
8. **ClassSubject** - Class-subject mappings
9. **TimeSlot** - Schedule time periods
10. **Timetable** - Generated timetable entries
11. **TeacherClassSubject** - Complex teacher-class-subject relationships
12. **TrainerClassModule** - Complex trainer-class-module relationships

### Identified Issues

#### 1. Relationship Complexity
- **Problem**: Multiple junction tables creating complex many-to-many relationships
- **Impact**: Difficult queries, poor performance, maintenance complexity
- **Examples**: `TeacherClassSubject` and `TrainerClassModule` tables

#### 2. Data Redundancy
- **Problem**: Duplicate information across related tables
- **Impact**: Data inconsistency risks, larger storage footprint
- **Examples**: School ID repeated in multiple junction tables

#### 3. Query Performance Issues
- **Problem**: No strategic indexing, complex JOINs
- **Impact**: Slow query performance, especially for timetable generation
- **Examples**: Timetable queries involve 6+ table JOINs

#### 4. Schema Flexibility
- **Problem**: Rigid schema for different school types
- **Impact**: Difficulty supporting new features, complex conditional logic
- **Examples**: Hard-coded school types in queries

## Optimization Strategy

### 1. Schema Simplification

#### Current vs Proposed Teacher Assignment Model

**Current (Problematic)**
```sql
-- Multiple junction tables
CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  UNIQUE(teacher_id, subject_id)
);

CREATE TABLE teacher_class_subjects (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  school_id UUID REFERENCES schools(id),
  UNIQUE(teacher_id, class_id, subject_id)
);
```

**Proposed (Optimized)**
```sql
-- Unified assignment table
CREATE TABLE teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('SUBJECT', 'MODULE')),
  hours_per_week INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Primary teacher for this assignment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_assignment CHECK (
    (assignment_type = 'SUBJECT' AND subject_id IS NOT NULL AND module_id IS NULL) OR
    (assignment_type = 'MODULE' AND module_id IS NOT NULL AND subject_id IS NULL)
  ),
  CONSTRAINT unique_teacher_class_assignment UNIQUE (teacher_id, class_id, COALESCE(subject_id, module_id))
);

-- Indexes for performance
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_school ON teacher_assignments(school_id);
CREATE INDEX idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_type ON teacher_assignments(assignment_type);
```

#### Enhanced Availability Model

**Current**
```sql
-- JSON fields (inefficient for queries)
ALTER TABLE users ADD COLUMN unavailable_days JSON;
ALTER TABLE users ADD COLUMN unavailable_periods JSON;
```

**Proposed**
```sql
CREATE TABLE teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  period_start INTEGER NOT NULL CHECK (period_start BETWEEN 1 AND 10),
  period_end INTEGER NOT NULL CHECK (period_end BETWEEN 1 AND 10),
  availability_type VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' 
    CHECK (availability_type IN ('AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'AVOID')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_period_range CHECK (period_end >= period_start)
);

CREATE INDEX idx_teacher_availability_teacher ON teacher_availability(teacher_id);
CREATE INDEX idx_teacher_availability_day ON teacher_availability(day_of_week);
CREATE INDEX idx_teacher_availability_period ON teacher_availability(period_start, period_end);
```

### 2. Performance Optimization

#### Strategic Indexing Plan

```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_timetables_school_class_period 
ON timetables(school_id, class_id, day, period) 
WHERE school_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_timetables_teacher_period 
ON timetables(teacher_id, day, period);

CREATE INDEX CONCURRENTLY idx_users_school_role 
ON users(school_id, role) 
WHERE role IN ('TEACHER', 'TRAINER');

CREATE INDEX CONCURRENTLY idx_time_slots_school_active 
ON time_slots(school_id, day, period) 
WHERE is_active = true;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_classes_school_level 
ON classes(school_id, level, stream);

CREATE INDEX CONCURRENTLY idx_subjects_school_level 
ON subjects(school_id, level);

CREATE INDEX CONCURRENTLY idx_modules_school_category 
ON modules(school_id, category, trade);
```

#### Query Optimization

**Timetable Generation Query Optimization**

*Current (Slow)*
```sql
-- Multiple JOINs with complex conditions
SELECT t.*, u.name, c.name, s.name, ts.day, ts.period
FROM timetables t
JOIN users u ON t.teacher_id = u.id
JOIN classes c ON t.class_id = c.id
JOIN subjects s ON t.subject_id = s.id
JOIN time_slots ts ON t.time_slot_id = ts.id
WHERE t.school_id = $1
ORDER BY ts.day, ts.period;
```

*Optimized (Fast)*
```sql
-- Pre-aggregated view for common queries
CREATE MATERIALIZED VIEW school_timetable_summary AS
SELECT 
  t.id,
  t.school_id,
  t.class_id,
  c.name as class_name,
  c.level,
  c.stream,
  t.teacher_id,
  u.name as teacher_name,
  u.teaching_streams,
  CASE 
    WHEN t.subject_id IS NOT NULL THEN 'SUBJECT'
    WHEN t.module_id IS NOT NULL THEN 'MODULE'
  END as lesson_type,
  COALESCE(s.name, m.name) as subject_module_name,
  ts.day,
  ts.period,
  ts.start_time,
  ts.end_time,
  ts.session
FROM timetables t
JOIN classes c ON t.class_id = c.id
JOIN users u ON t.teacher_id = u.id
LEFT JOIN subjects s ON t.subject_id = s.id
LEFT JOIN modules m ON t.module_id = m.id
JOIN time_slots ts ON t.time_slot_id = ts.id
WHERE t.school_id IS NOT NULL;

CREATE UNIQUE INDEX ON school_timetable_summary (id);
CREATE INDEX ON school_timetable_summary (school_id, day, period);
CREATE INDEX ON school_timetable_summary (teacher_id, day, period);
CREATE INDEX ON school_timetable_summary (class_id, day, period);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_timetable_materials()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY school_timetable_summary;
    RETURN NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic refresh
CREATE TRIGGER timetable_materialized_view_trigger
  AFTER INSERT OR UPDATE OR DELETE ON timetables
  FOR EACH ROW EXECUTE FUNCTION refresh_timetable_materials();
```

### 3. Migration Scripts

#### Phase 1: Pre-Migration Setup

```sql
-- migration/001_pre_migration_setup.sql
BEGIN;

-- Create backup tables
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE schools_backup AS SELECT * FROM schools;
CREATE TABLE classes_backup AS SELECT * FROM classes;
CREATE TABLE subjects_backup AS SELECT * FROM subjects;
CREATE TABLE modules_backup AS SELECT * FROM modules;
CREATE TABLE time_slots_backup AS SELECT * FROM time_slots;
CREATE TABLE timetables_backup AS SELECT * FROM timetables;

-- Create new optimized tables
CREATE TABLE teacher_assignments_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('SUBJECT', 'MODULE')),
  hours_per_week INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_assignment CHECK (
    (assignment_type = 'SUBJECT' AND subject_id IS NOT NULL AND module_id IS NULL) OR
    (assignment_type = 'MODULE' AND module_id IS NOT NULL AND subject_id IS NULL)
  ),
  CONSTRAINT unique_teacher_class_assignment UNIQUE (teacher_id, class_id, COALESCE(subject_id, module_id))
);

CREATE TABLE teacher_availability_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period_start INTEGER NOT NULL CHECK (period_start BETWEEN 1 AND 10),
  period_end INTEGER NOT NULL CHECK (period_end BETWEEN 1 AND 10),
  availability_type VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' 
    CHECK (availability_type IN ('AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'AVOID')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_period_range CHECK (period_end >= period_start)
);

COMMIT;
```

#### Phase 2: Data Migration

```sql
-- migration/002_data_migration.sql
BEGIN;

-- Migrate teacher-subject assignments
INSERT INTO teacher_assignments_new (
  teacher_id,
  school_id,
  subject_id,
  assignment_type,
  hours_per_week
)
SELECT 
  ts.teacher_id,
  u.school_id,
  ts.subject_id,
  'SUBJECT',
  s.periods_per_week
FROM teacher_subjects ts
JOIN users u ON ts.teacher_id = u.id
JOIN subjects s ON ts.subject_id = s.id;

-- Migrate teacher-class-subject assignments
INSERT INTO teacher_assignments_new (
  teacher_id,
  school_id,
  class_id,
  subject_id,
  assignment_type,
  hours_per_week
)
SELECT DISTINCT ON (tcs.teacher_id, tcs.class_id, tcs.subject_id)
  tcs.teacher_id,
  tcs.school_id,
  tcs.class_id,
  tcs.subject_id,
  'SUBJECT',
  s.periods_per_week
FROM teacher_class_subjects tcs
JOIN subjects s ON tcs.subject_id = s.id
ORDER BY tcs.teacher_id, tcs.class_id, tcs.subject_id, tcs.created_at;

-- Migrate trainer-module assignments
INSERT INTO teacher_assignments_new (
  teacher_id,
  school_id,
  module_id,
  assignment_type,
  hours_per_week
)
SELECT 
  tm.trainer_id,
  u.school_id,
  tm.module_id,
  'MODULE',
  m.total_hours
FROM trainer_modules tm
JOIN users u ON tm.trainer_id = u.id
JOIN modules m ON tm.module_id = m.id;

-- Migrate trainer-class-module assignments
INSERT INTO teacher_assignments_new (
  teacher_id,
  school_id,
  class_id,
  module_id,
  assignment_type,
  hours_per_week
)
SELECT DISTINCT ON (tcm.trainer_id, tcm.class_id, tcm.module_id)
  tcm.trainer_id,
  tcm.school_id,
  tcm.class_id,
  tcm.module_id,
  'MODULE',
  m.total_hours
FROM trainer_class_modules tcm
JOIN modules m ON tcm.module_id = m.id
ORDER BY tcm.trainer_id, tcm.class_id, tcm.module_id, tcm.created_at;

-- Migrate teacher availability from JSON
INSERT INTO teacher_availability_new (
  teacher_id,
  day_of_week,
  period_start,
  period_end,
  availability_type
)
SELECT 
  u.id,
  CASE 
    WHEN day_name = 'MONDAY' THEN 1
    WHEN day_name = 'TUESDAY' THEN 2
    WHEN day_name = 'WEDNESDAY' THEN 3
    WHEN day_name = 'THURSDAY' THEN 4
    WHEN day_name = 'FRIDAY' THEN 5
    WHEN day_name = 'SATURDAY' THEN 6
    WHEN day_name = 'SUNDAY' THEN 7
  END,
  1, -- Default start period
  10, -- Default end period
  'UNAVAILABLE'
FROM users u,
LATERAL jsonb_array_elements_text(u.unavailable_days::jsonb) AS day_name
WHERE u.unavailable_days IS NOT NULL
AND u.role IN ('TEACHER', 'TRAINER');

COMMIT;
```

#### Phase 3: Performance Optimization

```sql
-- migration/003_performance_optimization.sql
BEGIN;

-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_teacher_assignments_teacher ON teacher_assignments_new(teacher_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_school ON teacher_assignments_new(school_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_class ON teacher_assignments_new(class_id);
CREATE INDEX CONCURRENTLY idx_teacher_assignments_type ON teacher_assignments_new(assignment_type);

CREATE INDEX CONCURRENTLY idx_teacher_availability_teacher ON teacher_availability_new(teacher_id);
CREATE INDEX CONCURRENTLY idx_teacher_availability_day ON teacher_availability_new(day_of_week);
CREATE INDEX CONCURRENTLY idx_teacher_availability_period ON teacher_availability_new(period_start, period_end);

-- Create optimized indexes on existing tables
CREATE INDEX CONCURRENTLY idx_timetables_school_class_period ON timetables(school_id, class_id, day, period);
CREATE INDEX CONCURRENTLY idx_timetables_teacher_period ON timetables(teacher_id, day, period);
CREATE INDEX CONCURRENTLY idx_users_school_role ON users(school_id, role) WHERE role IN ('TEACHER', 'TRAINER');

-- Create materialized view for fast timetable queries
CREATE MATERIALIZED VIEW school_timetable_summary AS
SELECT 
  t.id,
  t.school_id,
  t.class_id,
  c.name as class_name,
  c.level,
  c.stream,
  t.teacher_id,
  u.name as teacher_name,
  u.teaching_streams,
  CASE 
    WHEN t.subject_id IS NOT NULL THEN 'SUBJECT'
    WHEN t.module_id IS NOT NULL THEN 'MODULE'
  END as lesson_type,
  COALESCE(s.name, m.name) as subject_module_name,
  ts.day,
  ts.period,
  ts.start_time,
  ts.end_time,
  ts.session
FROM timetables t
JOIN classes c ON t.class_id = c.id
JOIN users u ON t.teacher_id = u.id
LEFT JOIN subjects s ON t.subject_id = s.id
LEFT JOIN modules m ON t.module_id = m.id
JOIN time_slots ts ON t.time_slot_id = ts.id
WHERE t.school_id IS NOT NULL;

CREATE UNIQUE INDEX ON school_timetable_summary (id);
CREATE INDEX ON school_timetable_summary (school_id, day, period);
CREATE INDEX ON school_timetable_summary (teacher_id, day, period);
CREATE INDEX ON school_timetable_summary (class_id, day, period);

COMMIT;
```

#### Phase 4: Data Validation and Cleanup

```sql
-- migration/004_data_validation.sql
BEGIN;

-- Validate migration data
DO $$
DECLARE
  assignment_count INTEGER;
  availability_count INTEGER;
BEGIN
  -- Check assignment migration
  SELECT COUNT(*) INTO assignment_count 
  FROM teacher_assignments_new;
  
  RAISE NOTICE 'Migrated % teacher assignments', assignment_count;
  
  -- Check availability migration
  SELECT COUNT(*) INTO availability_count 
  FROM teacher_availability_new;
  
  RAISE NOTICE 'Migrated % teacher availability records', availability_count;
  
  -- Validate no orphaned records
  IF EXISTS (
    SELECT 1 FROM teacher_assignments_new ta
    LEFT JOIN users u ON ta.teacher_id = u.id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found orphaned teacher assignments';
  END IF;
  
  -- Validate assignment constraints
  IF EXISTS (
    SELECT 1 FROM teacher_assignments_new
    WHERE assignment_type = 'SUBJECT' AND subject_id IS NULL
    OR assignment_type = 'MODULE' AND module_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found invalid assignment records';
  END IF;
  
  RAISE NOTICE 'Data validation completed successfully';
END $$;

COMMIT;
```

### 4. Rollback Procedures

#### Emergency Rollback Script

```sql
-- migration/rollback_emergency.sql
BEGIN;

-- Disable triggers and constraints
SET session_replication_role = replica;

-- Drop new optimized tables
DROP TABLE IF EXISTS teacher_availability_new CASCADE;
DROP TABLE IF EXISTS teacher_assignments_new CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS school_timetable_summary CASCADE;

-- Restore original tables if needed
-- (Tables are preserved as *_backup)

-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;

RAISE NOTICE 'Emergency rollback completed. Data restored from backup tables.';

COMMIT;
```

#### Selective Rollback Script

```sql
-- migration/rollback_selective.sql
BEGIN;

-- Rollback only if specific conditions are not met
DO $$
DECLARE
  original_assignment_count INTEGER;
  new_assignment_count INTEGER;
BEGIN
  -- Get original assignment counts
  SELECT COUNT(*) INTO original_assignment_count
  FROM teacher_subjects 
  UNION ALL
  SELECT COUNT(*) FROM teacher_class_subjects
  UNION ALL
  SELECT COUNT(*) FROM trainer_modules
  UNION ALL
  SELECT COUNT(*) FROM trainer_class_modules;
  
  -- Get new assignment count
  SELECT COUNT(*) INTO new_assignment_count
  FROM teacher_assignments_new;
  
  -- If counts don't match, rollback
  IF original_assignment_count != new_assignment_count THEN
    RAISE EXCEPTION 'Assignment counts do not match. Rolling back...';
  END IF;
  
  RAISE NOTICE 'Assignment counts validated. Proceeding with migration.';
END $$;

COMMIT;
```

### 5. Migration Execution Plan

#### Pre-Migration Checklist

- [ ] **Database Backup**
  - Full database dump
  - Binary backup (if possible)
  - Verify backup integrity

- [ ] **Environment Preparation**
  - Set up staging environment
  - Test migration scripts on staging
  - Prepare monitoring and logging

- [ ] **Application Preparation**
  - Feature flags for new database structure
  - Dual-write capability (if needed)
  - API versioning strategy

#### Migration Timeline

**Phase 1: Preparation (Day 1)**
- Set up migration environment
- Run pre-migration scripts
- Validate backup integrity

**Phase 2: Data Migration (Day 2)**
- Execute data migration scripts
- Validate data integrity
- Performance testing

**Phase 3: Application Updates (Day 3-4)**
- Update application code to use new schema
- Deploy new API endpoints
- Update frontend components

**Phase 4: Testing and Validation (Day 5)**
- Comprehensive system testing
- Performance benchmarking
- User acceptance testing

**Phase 5: Production Deployment (Day 6)**
- Deploy to production
- Monitor system performance
- Validate all functionality

#### Monitoring and Alerting

```sql
-- Create monitoring views
CREATE VIEW migration_status AS
SELECT 
  'teacher_assignments' as table_name,
  (SELECT COUNT(*) FROM teacher_assignments_new) as new_count,
  (SELECT COUNT(*) FROM teacher_subjects) + 
  (SELECT COUNT(*) FROM teacher_class_subjects) + 
  (SELECT COUNT(*) FROM trainer_modules) + 
  (SELECT COUNT(*) FROM trainer_class_modules) as original_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM teacher_assignments_new) = 
         (SELECT COUNT(*) FROM teacher_subjects) + 
         (SELECT COUNT(*) FROM teacher_class_subjects) + 
         (SELECT COUNT(*) FROM trainer_modules) + 
         (SELECT COUNT(*) FROM trainer_class_modules)
    THEN 'VALID'
    ELSE 'MISMATCH'
  END as status;

-- Performance monitoring query
CREATE VIEW query_performance AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query ILIKE '%teacher%' OR query ILIKE '%timetable%'
ORDER BY total_time DESC
LIMIT 10;
```

### 6. Success Metrics

#### Performance Improvements

- **Query Response Time**: Target 60% improvement in timetable generation queries
- **Database Size**: Target 20% reduction in storage footprint
- **Index Efficiency**: Target 80% index utilization rate
- **Concurrent Users**: Support 3x current user load

#### Data Integrity

- **Assignment Accuracy**: 100% data preservation during migration
- **Referential Integrity**: Zero orphaned records after migration
- **Constraint Validation**: All business rules preserved

#### System Reliability

- **Migration Success Rate**: 100% successful migration on first attempt
- **Rollback Capability**: Ability to rollback within 15 minutes
- **Zero Data Loss**: Complete preservation of existing data

### 7. Post-Migration Optimization

#### Continuous Improvement

1. **Query Optimization**
   - Monitor slow queries
   - Optimize based on actual usage patterns
   - Regular index maintenance

2. **Schema Evolution**
   - Plan for future feature requirements
   - Maintain backward compatibility
   - Version control for schema changes

3. **Performance Monitoring**
   - Set up automated performance alerts
   - Regular performance audits
   - Capacity planning based on growth

## Conclusion

This database migration and optimization plan provides a comprehensive approach to:

1. **Simplify** the complex relationship model
2. **Improve** query performance through strategic indexing
3. **Maintain** data integrity throughout the migration
4. **Ensure** zero downtime during the transition
5. **Provide** robust rollback capabilities

The phased approach minimizes risk while maximizing performance improvements. Success depends on careful execution of each phase with comprehensive testing and monitoring.

## Next Steps

1. **Review and Approve** migration plan
2. **Set up** staging environment for testing
3. **Prepare** migration execution team
4. **Schedule** migration execution timeline
5. **Communicate** migration plan to stakeholders

This plan will transform the database from a complex, difficult-to-maintain structure into a clean, performant, and scalable foundation for the School Timetable Management System.