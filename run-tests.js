#!/usr/bin/env node

/**
 * PLAYWRIGHT TEST RUNNER
 * Tests: Exclusive Media Gateway - Phase 1-3 Verification
 * 
 * Usage:
 *   node run-tests.js              # Run all tests
 *   node run-tests.js website      # Run website tests only
 *   node run-tests.js admin        # Run admin tests only
 *   node run-tests.js --headed     # Run with browser visible
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const testFilter = args.find(a => !a.startsWith('--'));

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     EXCLUSIVE MEDIA GATEWAY - PLAYWRIGHT TEST SUITE           ║
║              Phase 1-3 Verification Tests                      ║
╚════════════════════════════════════════════════════════════════╝

📋 Test Configuration:
   • Website (8000):  http://localhost:8000
   • Admin (3000):    http://localhost:3000
   • Headed Mode:     ${isHeaded ? 'YES (visible browser)' : 'NO (headless)'}
   • Test Filter:     ${testFilter || 'ALL TESTS'}

⚠️  REQUIREMENTS:
   ✓ Website running on localhost:8000
   ✓ Admin running on localhost:3000
   ✓ Database migrations executed (Phase 1)
   ✓ Code deployed (Phase 2-3)

Starting tests in 3 seconds...
`);

setTimeout(() => {
    let testArgs = ['playwright', 'test'];
    
    if (isHeaded) {
        testArgs.push('--headed');
    }
    
    if (testFilter) {
        if (testFilter === 'website') {
            testArgs.push('website-media-gateway.spec.js');
        } else if (testFilter === 'admin') {
            testArgs.push('admin-media-gateway.spec.js');
        }
    }
    
    console.log(`Running: npx ${testArgs.join(' ')}\n`);
    
    const test = spawn('npx', testArgs, {
        cwd: path.resolve(__dirname),
        stdio: 'inherit'
    });
    
    test.on('close', (code) => {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    TEST RUN COMPLETE                           ║
╚════════════════════════════════════════════════════════════════╝

Exit Code: ${code}
${code === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}

📊 Reports:
   • HTML Report: ./playwright-report/index.html
   • JSON Report: ./test-results.json

📖 Next Steps:
   ${code === 0 ? `
   ✅ Phase 1-3 verification complete
   → Ready for production deployment
   → Proceed to Phase 4 (Admin API validation)
   ` : `
   ❌ Test failures detected
   → Review failures above
   → Check browser logs for contract violations
   → Verify database migrations executed
   → Check that code is deployed correctly
   `}
        `);
        process.exit(code);
    });
}, 3000);
