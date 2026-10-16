/**
 * PHASE J — READ-ONLY DB AUDIT
 * Reads live Supabase data via anon key (same path the public site uses).
 */
const fs = require('fs');
const { createClient } = require('d:/zt lounge/zt-lounge-demo/zt-lounge/zt-lounge-admin/node_modules/@supabase/supabase-js');

const URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDEyNTAsImV4cCI6MjA5OTUxNzI1MH0.TooU0gjA4VcKsGBF07O1hpiCvJgACLxvZY09bukpXhw';
const db = createClient(URL, ANON);

async function main() {
  const out = {};

  const cats = await db.from('menu_categories').select('*').eq('is_active', true).order('display_order');
  out.menuCategories = (cats.data || []).map(c => ({ id: c.id, name: c.name, slug: c.slug, display_order: c.display_order }));
  out.menuCategoriesError = cats.error ? cats.error.message : null;

  const items = await db.from('menu_items').select('id,name,description,price,image_url,media_id,alt_text,is_active,is_featured,display_order,type,category_id').eq('is_active', true).order('display_order');
  out.menuItems = items.data || [];
  out.menuItemsError = items.error ? items.error.message : null;
  out.menuItemCount = (items.data || []).length;

  // media assets referenced by menu items
  const mediaIds = [...new Set((items.data || []).map(i => i.media_id).filter(Boolean))];
  if (mediaIds.length) {
    const ma = await db.from('media_assets').select('id,public_url,alt_text').in('id', mediaIds);
    out.mediaForMenu = ma.data || [];
    out.mediaForMenuError = ma.error ? ma.error.message : null;
  }

  const biz = await db.from('business_settings').select('*').limit(1);
  out.business = biz.data ? biz.data[0] : null;
  out.businessError = biz.error ? biz.error.message : null;

  const svc = await db.from('services').select('id,name,slug,description,price,image_url,media_id,is_active,featured,type,display_order').eq('is_active', true).order('display_order');
  out.services = svc.data || [];
  out.servicesError = svc.error ? svc.error.message : null;

  const svcMediaIds = [...new Set((svc.data || []).map(s => s.media_id).filter(Boolean))];
  if (svcMediaIds.length) {
    const ma2 = await db.from('media_assets').select('id,public_url').in('id', svcMediaIds);
    out.mediaForServices = ma2.data || [];
  }

  const hero = await db.from('hero_slides').select('id,title,subtitle,image_url,media_id,is_active,display_order,page_id').eq('is_active', true).order('display_order');
  out.heroSlides = hero.data || [];
  out.heroError = hero.error ? hero.error.message : null;

  const gal = await db.from('gallery').select('id,title,image_url,media_id,category,is_active,display_order').eq('is_active', true).order('display_order');
  out.gallery = gal.data || [];
  out.galleryError = gal.error ? gal.error.message : null;

  const testi = await db.from('testimonials').select('id,customer_name,comment,rating,is_featured,approved,is_active').eq('is_active', true);
  out.testimonials = testi.data || [];
  out.testimonialsError = testi.error ? testi.error.message : null;

  fs.writeFileSync(__dirname + '/phasej-db-report.json', JSON.stringify(out, null, 2));

  // Human summary
  console.log('=== MENU CATEGORIES (' + out.menuCategories.length + ') ===');
  out.menuCategories.forEach(c => console.log('  ' + c.name + ' | slug:' + c.slug + ' | order:' + c.display_order));
  console.log('\n=== MENU ITEMS (' + out.menuItemCount + ') ===');
  (out.menuItems || []).forEach(i => console.log('  ' + i.name + ' | price:' + i.price + ' | cat:' + (i.category_id || '').substring(0, 8) + ' | img:' + (i.image_url ? i.image_url.substring(i.image_url.lastIndexOf('/') + 1, i.image_url.lastIndexOf('/') + 40) : 'NULL') + ' | media:' + (i.media_id ? i.media_id.substring(0, 8) : 'NULL')));
  console.log('\n=== BUSINESS ===');
  if (out.business) console.log('  name:', out.business.business_name, '| phone:', out.business.phone, '| email:', out.business.email, '| address:', out.business.address, '| hours:', JSON.stringify(out.business.opening_hours));
  console.log('\n=== SERVICES (' + (out.services || []).length + ') ===');
  (out.services || []).forEach(s => console.log('  ' + s.name + ' | type:' + s.type + ' | price:' + s.price + ' | img:' + (s.image_url ? 'set' : 'NULL') + ' | media:' + (s.media_id ? s.media_id.substring(0, 8) : 'NULL')));
  console.log('\n=== HERO SLIDES (' + (out.heroSlides || []).length + ') ===');
  (out.heroSlides || []).forEach(h => console.log('  ' + h.title + ' | media:' + (h.media_id ? h.media_id.substring(0, 8) : 'NULL') + ' | img:' + (h.image_url ? 'set' : 'NULL')));
  console.log('\n=== GALLERY (' + (out.gallery || []).length + ') ===');
  (out.gallery || []).forEach(g => console.log('  ' + g.title + ' | media:' + (g.media_id ? g.media_id.substring(0, 8) : 'NULL') + ' | img:' + (g.image_url ? g.image_url.substring(g.image_url.lastIndexOf('/') + 1, g.image_url.lastIndexOf('/') + 40) : 'NULL')));
  console.log('\n=== TESTIMONIALS (' + (out.testimonials || []).length + ') ===');
  (out.testimonials || []).forEach(t => console.log('  ' + t.customer_name + ' | rating:' + t.rating + ' | approved:' + t.approved + ' | ' + (t.comment || '').substring(0, 60)));
  console.log('\nDB report written to phasej-audit/phasej-db-report.json');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
