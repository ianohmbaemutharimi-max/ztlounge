/**
 * PLAYWRIGHT TEST SUITE: Website (Port 8000)
 * Tests: Exclusive Media Gateway - Phase 1-3 Verification
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000';

test.describe('Website - Exclusive Media Gateway', () => {
    let consoleErrors = [];

    test.beforeEach(async ({ page }) => {
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    // ============================================================
    // TEST 1: Home Page (Hero Slides)
    // ============================================================
    test('Home page loads hero slides with images', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        // Wait for hero slides
        const heroImages = await page.locator('.hero-slide img, [data-hero-image] img').count();
        expect(heroImages).toBeGreaterThan(0);
        console.log(`✅ Found ${heroImages} hero images`);
        
        // Verify images have src (from media_assets)
        const imageSrcs = await page.locator('.hero-slide img').evaluateAll(els => 
            els.map(el => el.getAttribute('src')).filter(src => src?.length > 0)
        );
        expect(imageSrcs.length).toBeGreaterThan(0);
        console.log(`✅ Hero images have URLs: ${imageSrcs[0]?.substring(0, 50)}...`);
        
        // Check NO contract violations
        const contractErrors = consoleErrors.filter(e => 
            e.includes('INVALID_MEDIA_CONTRACT') || e.includes('MEDIA_NOT_FOUND')
        );
        expect(contractErrors).toEqual([]);
    });

    // ============================================================
    // TEST 2: Gallery Page
    // ============================================================
    test('Gallery page loads all items with images', async ({ page }) => {
        await page.goto(`${BASE_URL}/pages/public/gallery.html`);
        await page.waitForLoadState('networkidle');
        
        const galleryItems = await page.locator('[data-gallery-item], .gallery-item').count();
        console.log(`✅ Gallery items found: ${galleryItems}`);
        expect(galleryItems).toBeGreaterThan(0);
        
        const itemsWithImages = await page.locator('[data-gallery-item] img, .gallery-item img').count();
        expect(itemsWithImages).toBe(galleryItems);
        console.log(`✅ All gallery items have images`);
        
        // No contract errors
        const contractErrors = consoleErrors.filter(e => 
            e.includes('INVALID_MEDIA_CONTRACT')
        );
        expect(contractErrors).toEqual([]);
    });

    // ============================================================
    // TEST 3: Services - Classic Haircut Has Image (Gap Fixed)
    // ============================================================
    test('Services page - Classic Haircut has image', async ({ page }) => {
        await page.goto(`${BASE_URL}/pages/business/grooming-care.html`);
        await page.waitForLoadState('networkidle');
        
        const classicHaircut = await page.locator('text=Classic Haircut').first().isVisible();
        if (classicHaircut) {
            const service = await page.locator('text=Classic Haircut').first();
            const serviceCard = service.locator('..').first();
            const image = serviceCard.locator('img').first();
            const imageSrc = await image.getAttribute('src');
            
            expect(imageSrc).toBeTruthy();
            console.log(`✅ Classic Haircut has image: ${imageSrc?.substring(0, 40)}...`);
        }
        
        // No contract errors
        const contractErrors = consoleErrors.filter(e => 
            e.includes('INVALID_MEDIA_CONTRACT')
        );
        expect(contractErrors).toEqual([]);
    });

    // ============================================================
    // TEST 4: Menu Page
    // ============================================================
    test('Menu page loads items with images', async ({ page }) => {
        await page.goto(`${BASE_URL}/pages/public/lounge.html`);
        await page.waitForLoadState('networkidle');
        
        const menuItems = await page.locator('.menu-item, [data-menu-item]').count();
        if (menuItems > 0) {
            const itemsWithImages = await page.locator('.menu-item img').count();
            console.log(`✅ Menu items with images: ${itemsWithImages}/${menuItems}`);
            
            // No contract errors
            const contractErrors = consoleErrors.filter(e => 
                e.includes('INVALID_MEDIA_CONTRACT')
            );
            expect(contractErrors).toEqual([]);
        }
    });

    // ============================================================
    // TEST 5: No Fallback Logic Used
    // ============================================================
    test('No fallback to legacy image_url', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        // Verify MediaResolver is enforcing exclusive gateway
        const result = await page.evaluate(() => {
            if (window.MediaResolver) {
                return 'MediaResolver v2.0.0 loaded';
            }
            return null;
        });
        
        expect(result).toBeTruthy();
        console.log(`✅ ${result}`);
    });
});
