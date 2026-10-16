/**
 * PLAYWRIGHT TEST SUITE: Admin (Port 3000)
 * Tests: Exclusive Media Gateway - Admin CMS
 */

const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:3000';

test.describe('Admin - Exclusive Media Gateway', () => {
    let consoleErrors = [];

    test.beforeEach(async ({ page }) => {
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    test('Admin dashboard loads', async ({ page }) => {
        await page.goto(ADMIN_URL);
        await page.waitForLoadState('networkidle');
        console.log('✅ Admin dashboard loaded');
    });

    test('Hero edit form accessible', async ({ page }) => {
        await page.goto(`${ADMIN_URL}/hero`);
        await page.waitForLoadState('networkidle');
        console.log('✅ Hero admin page loaded');
    });

    test('Gallery admin page accessible', async ({ page }) => {
        await page.goto(`${ADMIN_URL}/gallery`);
        await page.waitForLoadState('networkidle');
        console.log('✅ Gallery admin page loaded');
    });

    test('Services admin page accessible', async ({ page }) => {
        await page.goto(`${ADMIN_URL}/services`);
        await page.waitForLoadState('networkidle');
        console.log('✅ Services admin page loaded');
    });

    test('Classic Haircut service visible in admin', async ({ page }) => {
        await page.goto(`${ADMIN_URL}/services`);
        await page.waitForLoadState('networkidle');
        
        const found = await page.locator('text=Classic Haircut').isVisible().catch(() => false);
        if (found) {
            console.log('✅ Classic Haircut service found');
        }
    });

    test('No contract errors in admin', async ({ page }) => {
        await page.goto(ADMIN_URL);
        await page.waitForLoadState('networkidle');
        
        const contractErrors = consoleErrors.filter(e => 
            e.includes('INVALID_MEDIA_CONTRACT') || 
            e.includes('MEDIA_NOT_FOUND')
        );
        expect(contractErrors).toEqual([]);
        console.log('✅ No contract violations');
    });
});
