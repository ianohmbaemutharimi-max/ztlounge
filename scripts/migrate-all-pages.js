#!/usr/bin/env node
/**
 * Migrate Gallery Images to All Pages
 * Distribution: Each page gets 1-3 unique images
 * Total: 14 images distributed across 7 pages
 */

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

async function createImage(pageId, num, title, category, order, featured) {
  const url = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(num).padStart(2, '0')}.webp`;
  
  const payload = {
    title, category, image_url: url, alt_text: title,
    display_order: order, is_featured: featured, is_active: true,
    page_id, type: 'general',
  };

  await request('POST', '/rest/v1/gallery', payload);
  return { num, title, featured, order };
}

async function main() {
  try {
    console.log('\n🎨 MIGRATING IMAGES TO ALL PAGES\n');

    // Get all pages
    const pages = await request('GET', '/rest/v1/website_pages?select=id,page_key,title');
    const pageMap = {};
    pages.forEach(p => pageMap[p.page_key] = p);

    // Distribution: 14 images across pages
    const distribution = {
      events: { 
        images: [[1,'Event Setup','Events',1,true], [2,'Conference Layout','Events',2,false], [3,'Banquet Hall','Events',3,false]]
      },
      vip: { 
        images: [[4,'VIP Suite','VIP',1,true], [5,'Luxury Interior','VIP',2,false]]
      },
      lounge: { 
        images: [[6,'Lounge Seating','Lounge',1,true], [7,'Bar Area','Lounge',2,false], [8,'Premium Lounge','Lounge',3,false]]
      },
      restaurant: { 
        images: [[9,'Fine Dining','Restaurant',1,true], [10,'Restaurant Interior','Restaurant',2,false], [11,'Dining Ambiance','Restaurant',3,false]]
      },
      conference: { 
        images: [[12,'Conference Room','Conference',1,false]]
      },
      contact: { 
        images: [[13,'Venue Overview','General',1,false]]
      },
      'grooming-care': { 
        images: [[14,'Spa & Services','Services',1,false]]
      },
    };

    let total = 0;

    for (const [pageKey, config] of Object.entries(distribution)) {
      const page = pageMap[pageKey];
      if (!page) continue;

      console.log(`\n📍 ${page.title}`);

      // Cleanup old images
      const existing = await request('GET', `/rest/v1/gallery?page_id=eq.${page.id}&select=id`);
      if (existing.length > 0) {
        for (const item of existing) {
          await request('DELETE', `/rest/v1/gallery?id=eq.${item.id}`);
        }
      }

      // Add new images
      for (const [num, title, cat, order, feat] of config.images) {
        await createImage(page.id, num, title, cat, order, feat);
        const star = feat ? ' ⭐' : '';
        console.log(`   ✅ [${order}] ${title}${star}`);
        total++;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`\n✅ Created ${total} images across all pages\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
