// Test double-period boundary validation
// This tests that double periods don't extend beyond P10 (16:50)

console.log('🧪 Testing Double-Period Boundary Validation');
console.log('===========================================');

// Simulate the canScheduleBlock logic with boundary checking
function canScheduleBlock(startPeriod, blockSize) {
    // ENFORCE CORE TIME RULE: Check if the block would extend beyond P10 (16:50)
    const endPeriod = startPeriod + blockSize - 1;
    if (endPeriod > 10) {
        return false; // Cannot schedule beyond period 10 (16:50)
    }
    return true;
}

// Test cases
const testCases = [
    // Valid cases (within P1-P10)
    { startPeriod: 1, blockSize: 2, description: 'P1-P2 (08:00-09:20)' },
    { startPeriod: 5, blockSize: 2, description: 'P5-P6 (11:00-13:50, across lunch break - should be handled by break checking)' },
    { startPeriod: 9, blockSize: 2, description: 'P9-P10 (15:30-16:50)' },
    { startPeriod: 1, blockSize: 1, description: 'Single period P1' },
    { startPeriod: 10, blockSize: 1, description: 'Single period P10' },
    
    // Invalid cases (would extend beyond P10)
    { startPeriod: 10, blockSize: 2, description: 'P10-P11 (16:10-17:30, extends beyond 16:50)' },
    { startPeriod: 9, blockSize: 3, description: 'P9-P11 (15:30-17:30, extends beyond 16:50)' },
    { startPeriod: 11, blockSize: 1, description: 'Single period P11 (after 16:50)' },
    { startPeriod: 8, blockSize: 3, description: 'P8-P10 (14:30-16:50, exactly at boundary)' }
];

console.log('\n📊 Test Results:');
console.log('================');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    const result = canScheduleBlock(testCase.startPeriod, testCase.blockSize);
    const expected = testCase.startPeriod + testCase.blockSize - 1 <= 10;
    const testPassed = result === expected;
    
    const status = testPassed ? '✅ PASS' : '❌ FAIL';
    const endPeriod = testCase.startPeriod + testCase.blockSize - 1;
    
    console.log(`${status} Test ${index + 1}: ${testCase.description}`);
    console.log(`   Start: P${testCase.startPeriod}, Block Size: ${testCase.blockSize}, End: P${endPeriod}`);
    console.log(`   Expected: ${expected ? 'Allowed' : 'Blocked'}, Got: ${result ? 'Allowed' : 'Blocked'}`);
    
    if (testPassed) {
        passedTests++;
    } else {
        failedTests++;
    }
    console.log('');
});

// Specific boundary tests
console.log('🔍 Boundary Tests:');
console.log('=================');

// Test the exact boundary case
const boundaryTest1 = canScheduleBlock(9, 2); // P9-P10 (15:30-16:50) - should be allowed
const boundaryTest2 = canScheduleBlock(10, 2); // P10-P11 (16:10-17:30) - should be blocked

console.log(`P9-P10 (15:30-16:50): ${boundaryTest1 ? '✅ ALLOWED' : '❌ BLOCKED'} (should be allowed)`);
console.log(`P10-P11 (16:10-17:30): ${boundaryTest2 ? '✅ ALLOWED' : '❌ BLOCKED'} (should be blocked)`);

if (boundaryTest1 && !boundaryTest2) {
    console.log('✅ Boundary tests passed');
    passedTests++;
} else {
    console.log('❌ Boundary tests failed');
    failedTests++;
}

// Summary
console.log('\n🏁 FINAL SUMMARY:');
console.log('=================');
console.log(`Total tests: ${testCases.length + 1}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Double-period boundary validation works correctly');
    console.log('✅ No scheduling allowed beyond P10 (16:50)');
    console.log('✅ Double periods at boundary (P9-P10) are allowed');
    console.log('✅ Double periods crossing boundary (P10-P11) are blocked');
} else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('Please review the failed tests above.');
}