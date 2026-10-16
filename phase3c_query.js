var SB = require('d:/zt lounge/zt-lounge-demo/zt-lounge/node_modules/@supabase/supabase-js');
var supabaseUrl = 'https://xhujcmadplbapgixnton.supabase.co';
varanonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zaXRpdW0iLCJpYXQiOjE3MzUyMjI0NzIsImV4cCI6MTc0NTY4ODQ3Mn0.rX7W-Gq9dPSwqXamkCg2lG4D_4trb--miyH_ZbwZ93s';
var client = SB.createClient(supabaseUrl, anonKey);

var results = {};

client.from('media_assets').select('*').order('created_at')
  .then(function(d) {
    results.media_assets = d.data;
    return client.from('file_uploads').select('*').order('created_at');
  })
  .then(function(d) {
    results.file_uploads = d.data;
    return client.from('services').select('id,name,slug,media_id,image_url,is_active');
  })
  .then(function(d) {
    results.services = d.data;
    return client.from('gallery').select('id,title,media_id,image_url,category,is_active');
  })
  .then(function(d) {
    results.gallery = d.data;
    return client.from('hero_slides').select('id,title,media_id,image_url,is_active');
  })
  .then(function(d) {
    results.hero_slides = d.data;
    return client.from('menu_items').select('id,name,media_id,image_url,is_active');
  })
  .then(function(d) {
    results.menu_items = d.data;
    return client.from('business_settings').select('id,logo_media_id,favicon_media_id,logo_url,favicon_url');
  })
  .then(function(d) {
    results.business_settings = d.data;
    // Now verify storage URLs for media_assets
    var ma = results.media_assets || [];
    var storageChecks = ma.map(function(row) {
      return client.storage.from('public-assets')
        .getPublicUrl(row.storage_path)
        .then(function(u) {
          return { storage_path: row.storage_path, public_url: row.public_url, generated_url: u.data ? u.data.publicUrl : null, match: u.data && u.data.publicUrl === row.public_url };
        })
        .catch(function(e) {
          return { storage_path: row.storage_path, public_url: row.public_url, error: e.message };
        });
    });
    return Promise.all(storageChecks);
  })
  .then(function(storageResults) {
    results.storage_verification = storageResults;
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(function(e) {
    console.log('FATAL ERROR:', e.message);
    console.log('STACK:', e.stack);
  });
