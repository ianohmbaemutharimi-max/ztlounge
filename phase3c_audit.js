const SB = require('@supabase/supabase-js');
const c = SB.createClient('https://jczwilrysvnhcjzjztbi.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDEyNTAsImV4cCI6MjA5OTUxNzI1MH0.TooU0gjA4VcKsGBF07O1hpiCvJgACLxvZY09bukpXhw');

async function run() {
  // 1. media_assets
  var ma = await c.from('media_assets').select('*');
  console.log('=== MEDIA_ASSETS:', ma.data?ma.data.length:0,'rows, count:',ma.count,'===')
  if (ma.data) ma.data.forEach(function(r){console.log(r.id.substring(0,8)+'... | bucket:'+r.bucket+' | path:'+r.path+' | public_url:'+(r.public_url?r.public_url.substring(0,70)+'...':'NULL')+' | title:'+(r.title?r.title:'NULL')+' | alt:'+(r.alt_text?r.alt_text.substring(0,30)+'...':'NULL')+' | created:'+r.created_at+' | updated:'+r.updated_at);});

  // 2. services
  var svc = await c.from('services').select('id,name,slug,media_id,image_url,is_active');
  console.log('\n=== SERVICES:', svc.data?svc.data.length:0,'rows ===');
  svc.data.forEach(function(s){var m=s.media_id?s.media_id.substring(0,8)+'...':'NULL';var i=s.image_url?s.image_url.substring(0,55)+'...':'NULL';console.log(s.id.substring(0,8)+' | '+s.name+' | media_id:'+m+' | image_url:'+i);});

  // 3. gallery
  var gal = await c.from('gallery').select('id,title,media_id,image_url,category,is_active');
  console.log('\n=== GALLERY:', gal.data?gal.data.length:0,'rows ===');
  gal.data.forEach(function(g){var m=g.media_id?g.media_id.substring(0,8)+'...':'NULL';var i=g.image_url?g.image_url.substring(0,55)+'...':'NULL';console.log(g.id.substring(0,8)+' | '+g.title+' | media_id:'+m+' | image_url:'+i+' | cat:'+g.category);});

  // 4. hero
  var hero = await c.from('hero_slides').select('id,title,media_id,image_url,badge,is_active');
  console.log('\n=== HERO:', hero.data?hero.data.length:0,'rows ===');
  hero.data.forEach(function(h){var m=h.media_id?h.media_id.substring(0,8)+'...':'NULL';var i=h.image_url?h.image_url.substring(0,55)+'...':'NULL';console.log(h.id.substring(0,8)+' | '+h.title+' | badge:'+h.badge+' | media_id:'+m+' | image_url:'+i);});

  // 5. menu
  var menu = await c.from('menu_items').select('id,name,media_id,image_url,category,is_active');
  console.log('\n=== MENU:', menu.data?menu.data.length:0,'rows ===');
  menu.data.forEach(function(m){var mid=m.media_id?m.media_id.substring(0,8)+'...':'NULL';var i=m.image_url?m.image_url.substring(0,55)+'...':'NULL';console.log(m.id.substring(0,8)+' | '+m.name+' | cat:'+m.category+' | media_id:'+mid+' | image_url:'+i);});

  // 6. business
  var biz = await c.from('business_settings').select('id,logo_media_id,favicon_media_id,logo_url,favicon_url').maybeSingle();
  console.log('\n=== BUSINESS ===');
  if (biz.data){console.log('logo_media_id:'+(biz.data.logo_media_id?biz.data.logo_media_id.substring(0,8)+'...':'NULL')+' | favicon_media_id:'+(biz.data.favicon_media_id?biz.data.favicon_media_id.substring(0,8)+'...':'NULL')+' | logo_url:'+(biz.data.logo_url?biz.data.logo_url.substring(0,55)+'...':'NULL')+' | favicon_url:'+(biz.data.favicon_url?biz.data.favicon_url.substring(0,55)+'...':'NULL'));}

  // 7. file_uploads
  var fu = await c.from('file_uploads').select('id,path,original_name,file_size,created_at,uploaded_by').limit(50);
  console.log('\n=== FILE_UPLOADS:', fu.data?fu.data.length:0,'rows, count:',fu.count,'===')
  if (fu.data) fu.data.forEach(function(f){console.log((f.id?f.id.substring(0,8)+' ':'')+'| path:'+f.path+' | orig:'+f.original_name+' | size:'+f.file_size+' | created:'+f.created_at);});

  // 8. Cross-reference: all media_id values vs media_assets
  console.log('\n=== CROSS-REF: media_id → media_assets ===');
  var maMap = {};
  if (ma.data) ma.data.forEach(function(r){maMap[r.id]=true;});
  var refs = [];
  if (svc.data) svc.data.forEach(function(s){if(s.media_id)refs.push({type:'service',name:s.name,id:s.media_id});});
  if (gal.data) gal.data.forEach(function(g){if(g.media_id)refs.push({type:'gallery',name:g.title,id:g.media_id});});
  if (hero.data) hero.data.forEach(function(h){if(h.media_id)refs.push({type:'hero',name:h.title,id:h.media_id});});
  if (menu.data) menu.data.forEach(function(m){if(m.media_id)refs.push({type:'menu',name:m.name,id:m.media_id});});
  if (biz.data && biz.data.logo_media_id) refs.push({type:'logo',name:'business_logo',id:biz.data.logo_media_id});
  if (biz.data && biz.data.favicon_media_id) refs.push({type:'favicon',name:'business_favicon',id:biz.data.favicon_media_id});
  var found=0, missing=0;
  refs.forEach(function(r){if(maMap[r.id]){found++;console.log('MATCH '+r.type+': '+r.name+' -> '+r.id.substring(0,8)+'...');}else{missing++;console.log('MISSING '+r.type+': '+r.name+' -> '+r.id.substring(0,8)+'...');}});
  console.log('\nTOTAL refs:', refs.length, '| Found:', found, '| Missing:', missing, '| Unique IDs in refs:', Object.keys(refs.reduce(function(acc,r){acc[r.id]=true;return acc;},{})).length);

  // 9. Storage: list all images folders
  console.log('\n=== SUPABASE STORAGE OBJECTS ===');
  var folders = ['images/restaurant','images/lounge','images/vip','images/events','images/conference','images/autospa','images/gallery','images/hero','images/menu','images/branding'];
  var total = 0;
  for (var fi = 0; fi < folders.length; fi++) {
    try {
      var r = await c.storage.from('public-assets').list(folders[fi], {limit: 100});
      if (r.data) {
        r.data.forEach(function(o) {
          total++;
          console.log(folders[fi]+'/'+o.name + ' | id:' + (o.id ? o.id.substring(0,8)+'...' : 'no-id'));
        });
      }
    } catch (e) {}
  }
  console.log('Total storage objects:', total);
  console.log('\n=== DONE ===');
}

run().catch(function(e){console.log('FATAL:',e.message);});
