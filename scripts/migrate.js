#!/usr/bin/env node
const https = require('https');

const SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk0MTI1MCwiZXhwIjoyMDk5NTE3MjUwfQ.nj7YBr_EixrTdv5hqIzJVu3L7kFWVD15RJka4u7UgwM';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const opts = {
      method, hostname: url.hostname, path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    };

    const r = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : [];
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
          else resolve(json);
        } catch (e) { reject(e); }
      });
    });

    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function migrate() {
  console.log('\n🚀 GALLERY MIGRATION - CORRECT\n');

  try {
    // Fetch pages
    const pages = await request('GET', '/rest/v1/website_pages?select=id,page_key,title');
    const pageMap = {};
    pages.forEach(p => pageMap[p.page_key] = p);

    console.log('📖 Pages found:');
    Object.entries(pageMap).forEach(([key, p]) => console.log(`  ${key}: ${p.id}`));

    // Migration config
    const config = {
      conference: [
        { num: 1, title: 'Main Conference Room', cat: 'Interior', feat: 1, ord: 1 },
        { num: 2, title: 'Meeting Setup', cat: 'Setup', feat: 1, ord: 2 },
        { num: 3, title: 'Breakout Area', cat: 'Lounge', feat: 1, ord: 3 },
        { num: 4, title: 'Dining Setup', cat: 'Catering', feat: 1, ord: 4 },
      ],
      home: [
        { num: 10, title: 'ZT Lounge Hero', cat: 'Hero', feat: 1, ord: 1 },
        { num: 9, title: 'Luxury Experience', cat: 'Hero', feat: 1, ord: 2 },
      ],
      gallery: [
        { num: 1, title: 'Gallery-1', cat: 'Gen', feat: 0, ord: 1 },
        { num: 2, title: 'Gallery-2', cat: 'Gen', feat: 0, ord: 2 },
        { num: 3, title: 'Gallery-3', cat: 'Gen', feat: 0, ord: 3 },
        { num: 4, title: 'Gallery-4', cat: 'Gen', feat: 0, ord: 4 },
        { num: 5, title: 'Gallery-5', cat: 'Gen', feat: 0, ord: 5 },
        { num: 6, title: 'Gallery-6', cat: 'Gen', feat: 0, ord: 6 },
        { num: 7, title: 'Gallery-7', cat: 'Gen', feat: 0, ord: 7 },
        { num: 8, title: 'Gallery-8', cat: 'Gen', feat: 0, ord: 8 },
        { num: 9, title: 'Gallery-9', cat: 'Gen', feat: 0, ord: 9 },
        { num: 10, title: 'Gallery-10', cat: 'Gen', feat: 0, ord: 10 },
        { num: 11, title: 'Gallery-11', cat: 'Gen', feat: 0, ord: 11 },
        { num: 12, title: 'Gallery-12', cat: 'Gen', feat: 0, ord: 12 },
        { num: 13, title: 'Gallery-13', cat: 'Gen', feat: 0, ord: 13 },
        { num: 14, title: 'Gallery-14', cat: 'Gen', feat: 0, ord: 14 },
      ],
    };

    let count = 0;
    for (const [pageKey, imgs] of Object.entries(config)) {
      const pageId = pageMap[pageKey]?.id;
      if (!pageId) { console.log(`❌ Missing: ${pageKey}`); continue; }

      console.log(`\n${pageKey}: ${imgs.length} images`);
      for (const img of imgs) {
        const url = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(img.num).padStart(2, '0')}.webp`;
        
        const data = {
          title: img.title,
          category: img.cat,
          image_url: url,
          alt_text: img.title,
          display_order: img.ord,
          is_featured: img.feat === 1,
          is_active: true,
          page_id: pageId,
          type: 'general',
        };

        try {
          await request('POST', '/rest/v1/gallery', data);
          count++;
          console.log(`  ✅ ${img.title}${img.feat ? ' ⭐' : ''}`);
        } catch (e) {
          console.log(`  ❌ ${img.title}`);
        }
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`\n✅ Created ${count} images\n`);

    // Verify what renders
    const all = await request('GET', '/rest/v1/gallery?select=*&order=display_order.asc');
    const byPage = {};
    all.forEach(i => {
      const p = pages.find(x => x.id === i.page_id);
      const k = p?.page_key || 'unknown';
      if (!byPage[k]) byPage[k] = [];
      byPage[k].push(i);
    });

    console.log('🌐 WEBSITE RENDERING:\n');
    console.log('CONFERENCE GALLERY:');
    (byPage.conference || []).filter(i => i.is_featured && i.is_active).forEach(i => {
      console.log(`  ✅ ${i.title}`);
    });

    console.log('\nHOME PAGE CAROUSEL:');
    (byPage.home || []).filter(i => i.is_featured && i.is_active).forEach(i => {
      console.log(`  ✅ ${i.title}`);
    });

    console.log('\nGALLERY PAGE:');
    const galleryItems = (byPage.gallery || []).filter(i => i.is_active);
    console.log(`  ✅ ${galleryItems.length} images`);

    console.log('\n✅ COMPLETE!\n');

  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

migrate();
