/**
 * Upload all assets/images/ files to Supabase Storage bucket "public-assets".
 * Preserves folder structure: assets/images/autospa/autospa-1.webp → public-assets/images/autospa/autospa-1.webp
 * 
 * Usage: node scripts/upload-to-storage.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDEyNTAsImV4cCI6MjA5OTUxNzI1MH0.TooU0gjA4VcKsGBF07O1hpiCvJgACLxvZY09bukpXhw';
const BUCKET_ID = 'public-assets';
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');

// MIME type mapping
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif'
    };
    return types[ext] || 'application/octet-stream';
}

// Upload a single file to Supabase Storage
function uploadFile(localPath, storagePath) {
    return new Promise((resolve, reject) => {
        const fileData = fs.readFileSync(localPath);
        const mimeType = getMimeType(localPath);
        
        const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET_ID}/${storagePath}`);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': mimeType,
                'Content-Length': fileData.length,
                'x-upsert': 'true'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, status: res.statusCode, path: storagePath });
                } else {
                    resolve({ success: false, status: res.statusCode, path: storagePath, error: body });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ success: false, path: storagePath, error: error.message });
        });
        
        req.write(fileData);
        req.end();
    });
}

// Recursively get all files in a directory
function getAllFiles(dir, baseDir = dir) {
    let results = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            results = results.concat(getAllFiles(fullPath, baseDir));
        } else {
            // Calculate relative path from assets/images/
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            // Storage path: images/autospa/autospa-1.webp
            const storagePath = `images/${relativePath}`;
            results.push({
                localPath: fullPath,
                storagePath: storagePath,
                size: stat.size
            });
        }
    }
    
    return results;
}

// Main
async function main() {
    console.log('=== Supabase Storage Upload ===');
    console.log(`Bucket: ${BUCKET_ID}`);
    console.log(`Source: ${IMAGES_DIR}`);
    console.log('');
    
    // Get all files
    const files = getAllFiles(IMAGES_DIR);
    console.log(`Found ${files.length} files to upload.`);
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    const failures = [];
    
    // Upload files sequentially (to avoid overwhelming the API)
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = `[${i + 1}/${files.length}]`;
        process.stdout.write(`${progress} Uploading ${file.storagePath} (${(file.size / 1024).toFixed(1)}KB)... `);
        
        const result = await uploadFile(file.localPath, file.storagePath);
        
        if (result.success) {
            console.log('OK');
            successCount++;
        } else {
            console.log(`FAILED (${result.status || 'error'})`);
            console.log(`  Error: ${result.error || 'Unknown'}`);
            failures.push({ path: file.storagePath, error: result.error || result.status });
            failCount++;
        }
        
        // Small delay to avoid rate limiting
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('');
    console.log('=== Upload Complete ===');
    console.log(`Success: ${successCount}/${files.length}`);
    console.log(`Failed: ${failCount}/${files.length}`);
    
    if (failures.length > 0) {
        console.log('');
        console.log('Failed uploads:');
        failures.forEach(f => console.log(`  - ${f.path}: ${f.error}`));
    }
    
    // Output the public URL format
    console.log('');
    console.log('Public URL format:');
    console.log(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_ID}/images/{category}/{filename}`);
}

main().catch(console.error);