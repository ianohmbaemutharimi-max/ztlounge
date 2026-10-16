#!/usr/bin/env node
/**
 * Populate Gallery Page with 14 Images
 * Focus: Gallery page only (page_id = gallery page UUID)
 * All images will display in grid layout
 */

const https = require('https');

const SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk0MTI1MCwiZXhwIjoyMDk5NTE3MjUwfQ.nj7YBr_EixrTdv5hqIzJVu3L7kFWVD15RJka4u7UgwM';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const opts = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  try {
    console.log('\n🎨 POPULATING GALLERY PAGE WITH IMAGES\n');
    console.log('═'.repeat(50));

    // 1. Get all pages to find gallery page ID
    console.log('\n📖 Fetching pages...');
    const pages = await request('GET', '/rest/v1/website_pages?select=id,page_key,title');
    const galleryPage = pages.find(p => p.page_key === 'gallery');
    
    if (!galleryPage) {
      throw new Error('Gallery page not found in database');
    }
    
    const galleryPageId = galleryPage.id;
    console.log(`✅ Gallery Page ID: ${galleryPageId}`);
    console.log(`   Title: "${galleryPage.title}"`);

    // 2. Delete existing images on gallery page (cleanup)
    console.log('\n🗑️  Cleaning up existing images...');
    const existing = await request('GET', `/rest/v1/gallery?page_id=eq.${galleryPageId}&select=id`);
    if (existing.length > 0) {
      for (const item of existing) {
        await request('DELETE', `/rest/v1/gallery?id=eq.${item.id}`);
      }
      console.log(`✅ Removed ${existing.length} old images`);
    } else {
      console.log('✅ No existing images to clean');
    }

    // 3. Create 14 gallery images
    console.log('\n📸 Creating 14 gallery images...\n');

    const images = Array.from({ length: 14 }, (_, i) => ({
      num: i + 1,
      title: `Gallery Image ${i + 1}`,
      category: 'General',
    }));

    let created = 0;
    for (const img of images) {
      const imageUrl = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(img.num).padStart(2, '0')}.webp`;
      
      const payload = {
        title: img.title,
        category: img.category,
        image_url: imageUrl,
        alt_text: img.title,
        display_order: img.num,
        is_featured: false,
        is_active: true,
        page_id: galleryPageId,
        type: 'general',
      };

      await request('POST', '/rest/v1/gallery', payload);
      created++;
      process.stdout.write(`✅ [${String(img.num).padStart(2)}] ${img.title}\n`);
      await new Promise(r => setTimeout(r, 100)); // Rate limit
    }

    console.log(`\n${created} images created\n`);

    // 4. Verify what was created
    console.log('═'.repeat(50));
    console.log('\n✨ VERIFICATION\n');

    const final = await request('GET', `/rest/v1/gallery?page_id=eq.${galleryPageId}&select=id,title,display_order,is_active&order=display_order.asc`);
    
    console.log(`✅ Gallery page now has ${final.length} images:\n`);
    final.forEach(img => {
      console.log(`   [${String(img.display_order).padStart(2)}] ${img.title}`);
    });

    console.log('\n═'.repeat(50));
    console.log('\n🌐 HOW IT DISPLAYS:\n');
    console.log('Gallery Page (Public):');
    console.log('  Layout: Responsive grid (3-4 columns)');
    console.log('  Images: All 14 active images');
    console.log('  Order: By display_order (1-14)');
    console.log('  Featured: None (all non-featured)');
    console.log('  Click: Opens lightbox modal\n');

    console.log('Admin UI (http://localhost:3000/dashboard/gallery):');
    console.log('  Select page: "Gallery"');
    console.log('  Shows: 14 images');
    console.log('  Toggles: ⭐ Featured, 👁️ Active, ⬆️⬇️ Order, 🗑️ Delete\n');

    console.log('═'.repeat(50));
    console.log('\n✅ GALLERY PAGE POPULATED!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
