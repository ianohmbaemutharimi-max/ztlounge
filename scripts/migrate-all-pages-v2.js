#!/usr/bin/env node
const https = require('https');

const SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk0MTI1MCwiZXhwIjoyMDk5NTE3MjUwfQ.nj7YBr_EixrTdv5hqIzJVu3L7kFWVD15RJka4u7UgwM';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const opts = {
      method, hostname: url.hostname, path: url.pathname + url.search,
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
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
        else try { resolve(data ? JSON.parse(data) : null); } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n🎨 MIGRATING IMAGES TO ALL PAGES\n');

  try {
    // Get pages
    const pages = await request('GET', '/rest/v1/website_pages?select=id,page_key,title');
    const pageMap = {};
    pages.forEach(p => pageMap[p.page_key] = p);

    // Config: [image_num, title, category, featured]
    const config = {
      'events': [
        [1, 'Event Setup', 'Events', true],
        [2, 'Conference Layout', 'Events', false],
        [3, 'Banquet Hall', 'Events', false],
      ],
      'vip': [
        [4, 'VIP Suite', 'VIP', true],
        [5, 'Luxury Interior', 'VIP', false],
      ],
      'lounge': [
        [6, 'Lounge Seating', 'Lounge', true],
        [7, 'Bar Area', 'Lounge', false],
        [8, 'Premium Lounge', 'Lounge', false],
      ],
      'restaurant': [
        [9, 'Fine Dining', 'Restaurant', true],
        [10, 'Restaurant Interior', 'Restaurant', false],
        [11, 'Dining Ambiance', 'Restaurant', false],
      ],
      'conference': [
        [12, 'Conference Room', 'Conference', false],
      ],
      'contact': [
        [13, 'Venue Overview', 'General', false],
      ],
      'grooming-care': [
        [14, 'Spa & Services', 'Services', false],
      ],
    };

    let total = 0;

    for (const [pageKey, images] of Object.entries(config)) {
      const page = pageMap[pageKey];
      if (!page) {
        console.log(`⚠️  ${pageKey} not found`);
        continue;
      }

      console.log(`\n📍 ${page.title}`);

      // Delete old images
      const existing = await request('GET', `/rest/v1/gallery?page_id=eq.${page.id}&select=id`);
      if (existing && existing.length > 0) {
        for (const item of existing) {
          await request('DELETE', `/rest/v1/gallery?id=eq.${item.id}`);
        }
      }

      // Add new images
      for (let i = 0; i < images.length; i++) {
        const [num, title, category, featured] = images[i];
        const order = i + 1;
        
        const imgUrl = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(num).padStart(2, '0')}.webp`;
        
        const payload = {
          title: title,
          category: category,
          image_url: imgUrl,
          alt_text: title,
          display_order: order,
          is_featured: featured,
          is_active: true,
          page_id: page.id,
          type: 'general',
        };

        await request('POST', '/rest/v1/gallery', payload);
        const star = featured ? ' ⭐' : '';
        console.log(`   ✅ [${order}] ${title}${star}`);
        total++;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`\n✅ MIGRATION COMPLETE: ${total} images created\n`);

    // Verify
    console.log('📊 SUMMARY BY PAGE:\n');
    for (const [pageKey, images] of Object.entries(config)) {
      const page = pageMap[pageKey];
      if (!page) continue;
      const items = await request('GET', `/rest/v1/gallery?page_id=eq.${page.id}&select=id,title,is_featured`);
      const featured = items ? items.filter(i => i.is_featured).length : 0;
      const count = items ? items.length : 0;
      console.log(`${page.title.padEnd(30)} | ${count} images | ${featured} ⭐`);
    }

    console.log('\n✅ ALL PAGES MIGRATED!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
