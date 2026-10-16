#!/usr/bin/env node
/**
 * Gallery Image Migration Script
 * Migrates 14 gallery images across pages with proper metadata
 */

const https = require('https');

const SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk0MTI1MCwiZXhwIjoyMDk5NTE3MjUwfQ.nj7YBr_EixrTdv5hqIzJVu3L7kFWVD15RJka4u7UgwM';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          else resolve(json);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function migrate() {
  console.log('🎬 Gallery Image Migration\n');

  try {
    // Get pages
    console.log('📖 Fetching pages...');
    const pages = await request('GET', '/rest/v1/website_pages?select=id,page_key,title');
    const pageMap = Object.fromEntries(pages.map(p => [p.page_key, p]));
    console.log(`✅ Found ${pages.length} pages\n`);

    // Configuration
    const config = {
      conference: [
        { fileNum: 1, title: 'Main Conference Room', category: 'Interior', featured: true, order: 1 },
        { fileNum: 2, title: 'Meeting Setup', category: 'Setup', featured: true, order: 2 },
        { fileNum: 3, title: 'Breakout Area', category: 'Lounge', featured: true, order: 3 },
        { fileNum: 4, title: 'Dining Setup', category: 'Catering', featured: true, order: 4 },
      ],
      home: [
        { fileNum: 10, title: 'ZT Lounge Hero', category: 'Hero', featured: true, order: 1 },
        { fileNum: 9, title: 'Luxury Experience', category: 'Hero', featured: true, order: 2 },
      ],
      gallery: [
        { fileNum: 1, title: 'Conference Room', category: 'Interior', order: 1 },
        { fileNum: 2, title: 'Meeting Setup', category: 'Setup', order: 2 },
        { fileNum: 3, title: 'Breakout Area', category: 'Lounge', order: 3 },
        { fileNum: 4, title: 'Dining Area', category: 'Catering', order: 4 },
        { fileNum: 5, title: 'Restaurant Interior', category: 'Restaurant', order: 5 },
        { fileNum: 6, title: 'Restaurant Ambiance', category: 'Restaurant', order: 6 },
        { fileNum: 7, title: 'Lounge Setup', category: 'Lounge', order: 7 },
        { fileNum: 8, title: 'Bar Area', category: 'Lounge', order: 8 },
        { fileNum: 9, title: 'Premium Seating', category: 'Lounge', order: 9 },
        { fileNum: 10, title: 'Main Entrance', category: 'Exterior', order: 10 },
        { fileNum: 11, title: 'VIP Cabin', category: 'VIP', order: 11 },
        { fileNum: 12, title: 'VIP Suite', category: 'VIP', order: 12 },
        { fileNum: 13, title: 'Event Setup', category: 'Events', order: 13 },
        { fileNum: 14, title: 'Event Detail', category: 'Events', order: 14 },
      ],
    };

    // Migrate
    for (const [pageKey, images] of Object.entries(config)) {
      if (!pageMap[pageKey]) {
        console.log(`❌ Page not found: ${pageKey}`);
        continue;
      }

      const pageId = pageMap[pageKey].id;
      console.log(`\n📄 ${pageMap[pageKey].title}:`);

      for (const img of images) {
        const url = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(img.fileNum).padStart(2, '0')}.webp`;
        const data = {
          title: img.title,
          category: img.category,
          image_url: url,
          display_order: img.order,
          is_featured: img.featured || false,
          is_active: true,
          page_id: pageId,
          alt_text: img.title,
        };

        try {
          await request('POST', '/rest/v1/gallery', data);
          console.log(`  ✅ ${img.title} (order: ${img.order}${img.featured ? ', featured' : ''})`);
        } catch (err) {
          console.error(`  ❌ ${img.title}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log('\n✅ Migration complete!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

migrate();
