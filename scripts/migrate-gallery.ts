/**
 * Gallery Migration Utility
 * Run: npx ts-node scripts/migrate-gallery.ts
 * 
 * This utility populates your gallery with 14 images organized by page
 * using your existing admin API endpoints.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Image configuration by page
const imageConfig = {
  conference: [
    { num: 1, title: "Main Conference Room", category: "Interior", featured: true, desc: "Spacious conference room with modern setup" },
    { num: 2, title: "Meeting Setup", category: "Setup", featured: true, desc: "U-shaped seating arrangement for interactive meetings" },
    { num: 3, title: "Breakout Area", category: "Lounge", featured: true, desc: "Comfortable breakout space for networking" },
    { num: 4, title: "Dining Setup", category: "Catering", featured: true, desc: "Full catering facilities for conference events" },
  ],
  home: [
    { num: 10, title: "ZT Lounge Hero", category: "Hero", featured: true, desc: "Welcome to ZT Lounge Meru" },
    { num: 9, title: "Luxury Experience", category: "Hero", featured: true, desc: "Luxury dining and entertainment" },
  ],
  gallery: [
    { num: 1, title: "Conference Room", category: "Interior", featured: false, desc: "Professional conference facilities" },
    { num: 2, title: "Meeting Setup", category: "Setup", featured: false, desc: "Flexible meeting arrangements" },
    { num: 3, title: "Breakout Area", category: "Lounge", featured: false, desc: "Relaxation and networking space" },
    { num: 4, title: "Dining Area", category: "Catering", featured: false, desc: "Catering and dining facilities" },
    { num: 5, title: "Restaurant Interior", category: "Restaurant", featured: false, desc: "Fine dining restaurant ambiance" },
    { num: 6, title: "Restaurant Ambiance", category: "Restaurant", featured: false, desc: "Elegant dining atmosphere" },
    { num: 7, title: "Lounge Setup", category: "Lounge", featured: false, desc: "Premium lounge and bar environment" },
    { num: 8, title: "Bar Area", category: "Lounge", featured: false, desc: "Full-service bar with premium beverages" },
    { num: 9, title: "Premium Seating", category: "Lounge", featured: false, desc: "Comfortable premium seating arrangements" },
    { num: 10, title: "Main Entrance", category: "Exterior", featured: false, desc: "Grand entrance and reception area" },
    { num: 11, title: "VIP Cabin", category: "VIP", featured: false, desc: "Luxury VIP cabin with premium amenities" },
    { num: 12, title: "VIP Suite", category: "VIP", featured: false, desc: "Exclusive VIP suite for special occasions" },
    { num: 13, title: "Event Setup", category: "Events", featured: false, desc: "Versatile event space setup" },
    { num: 14, title: "Event Detail", category: "Events", featured: false, desc: "Professional event details and setup" },
  ],
};

async function migrate() {
  console.log("🎬 Gallery Migration Utility\n");

  try {
    // Step 1: Get all pages
    console.log("📖 Fetching pages...");
    const { data: pages, error: pageErr } = await supabase
      .from("website_pages")
      .select("id, page_key, title");

    if (pageErr) throw pageErr;

    const pageMap = Object.fromEntries(pages!.map(p => [p.page_key, p]));
    console.log(`✅ Found ${pages?.length} pages\n`);

    // Step 2: Migrate images for each page
    for (const [pageKey, images] of Object.entries(imageConfig)) {
      if (!pageMap[pageKey]) {
        console.log(`❌ Page not found: ${pageKey}`);
        continue;
      }

      const pageId = pageMap[pageKey].id;
      console.log(`📄 ${pageMap[pageKey].title}:`);

      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        const imageUrl = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-${String(img.num).padStart(2, "0")}.webp`;

        const { error } = await supabase.from("gallery").insert({
          title: img.title,
          category: img.category,
          image_url: imageUrl,
          alt_text: img.title,
          description: img.desc,
          display_order: idx + 1,
          is_featured: img.featured,
          is_active: true,
          page_id: pageId,
          type: "general",
        });

        if (error) {
          console.error(`  ❌ ${img.title}: ${error.message}`);
        } else {
          console.log(`  ✅ ${img.title} (order: ${idx + 1}${img.featured ? ", featured" : ""})`);
        }
      }
    }

    console.log("\n✅ Migration complete!\n");

    // Step 3: Verify
    console.log("📊 Verification:");
    const { data: stats } = await supabase
      .from("gallery")
      .select("page_id, count");

    const { data: summary } = await supabase.rpc("gallery_summary");
    console.log(summary);

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

migrate();
