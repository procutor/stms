const fs = require('fs');
const path = require('path');

// Define files to move to backup
const filesToBackup = [
    // Test files
    'test-auth.ts',
    'check-db.js',
    'check-db-detailed.js',
    'check-generation.js',
    'check-missing-modules.js',
    'check-modules.js',
    'check-physics.js',
    'check-schools-and-regenerate.js',
    'check-teacher-timetables.js',
    'check-time-slots.js',
    'create-test-data.js',
    'debug-generation.js',
    'final-verification.js',
    'fix-consecutive-conflicts.js',
    'fix-time-slots.js',
    'fix-timetable-conflicts.js',
    'fix-tss-block-sizes.js',
    'manual-conflict-resolution.js',
    'regenerate-monday-friday.js',
    'regenerate-timetables.js',
    'setup-time-slots.js',
    'test-api-generation.js',
    'test-consecutive-double-periods.js',
    'test-db-setup.js',
    'test-double-period-boundary.js',
    'test-final-validation.js',
    'test-fix.js',
    'test-period-filtering.js',
    'test-teacher-hub-recovery.js',
    'test-teacher-workflow.js',
    'test-time-constraints.js',
    'test-timetable-count-fix.js',
    'test-timetable-features.js',
    'test-timetable-generation.js',
    'update_database.js',
    'update_time_structure.js',
    'update-time-slots-p1-p10.js',
    'verify-api-fix.js',
    'verify-time-constraints.js',
    
    // Development scripts
    'add_trade_column.js',
    'add_trade_column.sql',
    
    // Documentation files (temporary - will be consolidated)
    'COMPLEMENTARY_MODULES_FLEXIBLE_PLACEMENT_IMPLEMENTATION.md',
    'CONSECUTIVE_DOUBLE_PERIODS_IMPLEMENTATION.md',
    'FINAL-RESOLUTION-SUMMARY.md',
    'fix-generation-issues.md',
    'IMPLEMENTATION_TEST.md',
    'LESSON_PREPARATION_UPDATES.md',
    'PER_CLASS_ASSIGNMENTS_IMPLEMENTATION.md',
    'PER_CLASS_TEACHER_ASSIGNMENT_README.md',
    'SETUP.md',
    'TEACHER_DASHBOARD_IMPLEMENTATION_COMPLETE.md',
    'TEACHER_HUB_RECOVERY_REPORT.md',
    'TEACHER_SCOPE_ENHANCEMENT.md',
    'TEACHER_SCOPE_TEST_SCENARIOS.md',
    'TIMETABLE_GENERATION_UPDATES.md',
    'TIMETABLE-CONFLICT-RESOLUTION-SUMMARY.md',
    'TROUBLESHOOTING.md',
    
    // Demo pages
    'src/app/demo-a4-timetable',
    'src/app/test-a4-print',
    
    // Extra development pages
    'src/app/contact',
    
    // Build files
    'tsconfig.tsbuildinfo'
];

function backupFiles() {
    const backupDir = 'backup-development-files';
    
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    let backedUpCount = 0;
    
    filesToBackup.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                // Move file to backup directory
                fs.renameSync(file, path.join(backupDir, path.basename(file)));
                console.log(`✅ Moved: ${file}`);
                backedUpCount++;
            } catch (error) {
                console.log(`❌ Failed to move: ${file} - ${error.message}`);
            }
        } else {
            console.log(`⚠️  File not found: ${file}`);
        }
    });
    
    console.log(`\n📦 Backup complete! Moved ${backedUpCount} files to '${backupDir}'`);
}

// Run the backup
backupFiles();