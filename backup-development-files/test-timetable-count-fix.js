// Test the fixed API response for timetable counting
async function testTimetableCounting() {
    try {
        console.log('🧪 Testing Timetable Count Fix...\n');
        
        // Test class timetable counting
        const classResponse = await fetch('/api/generate?checkExisting=true&classId=cmj8l1ujm001lfallrpituchq');
        const classData = await classResponse.json();
        
        console.log('📚 Class Timetable Check:');
        console.log(`   Class ID: ${classData.classId}`);
        console.log(`   Has Timetables: ${classData.hasTimetables}`);
        console.log(`   Count: ${classData.count} (should be 1 if timetables exist)`);
        console.log(`   Actual Records: ${classData.timetables?.length || 0}`);
        
        // Test teacher timetable counting
        const teacherResponse = await fetch('/api/generate?checkExisting=true&teacherId=cmj8ku8eu000zfall3v5a26ss');
        const teacherData = await teacherResponse.json();
        
        console.log('\n👨‍🏫 Teacher Timetable Check:');
        console.log(`   Teacher ID: ${teacherData.teacherId}`);
        console.log(`   Has Timetables: ${teacherData.hasTimetables}`);
        console.log(`   Count: ${teacherData.count} (should be 1 if timetables exist)`);
        console.log(`   Actual Records: ${teacherData.timetables?.length || 0}`);
        
        console.log('\n✅ Expected Result:');
        console.log('- If timetables exist: "Has Timetables (1)" instead of "Has Timetables (30)"');
        console.log('- If no timetables: "No Timetables" (count: 0)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testTimetableCounting();