# 📸 GALLERY SETUP - COMPLETE GUIDE

**Status:** Admin UI Complete ✅ | Ready to Migrate Images  
**Time to Complete:** ~30 minutes total

---

## 🎯 WHAT YOU HAVE vs WHAT'S NEEDED

**✅ Complete:**
- Admin gallery UI with all 4 toggles
- 14 gallery images in Supabase storage
- Database schema ready
- Public gallery pages expecting images

**⏳ Needed:**
- Populate images from storage into database
- Arrange by page (Conference=4, Home=2, Gallery=14)
- Mark 6 as featured for carousels
- Test on public site

---

## 🚀 THREE MIGRATION OPTIONS

### OPTION A: SQL Direct (FASTEST - 5 min) ⭐ RECOMMENDED

1. Go to https://jczwilrysvnhcjzjztbi.supabase.co → SQL Editor
2. Copy all content from: `supabase/migrations/044_gallery_image_migration.sql`
3. Click Run (Ctrl+Enter)
4. Done! ✅

### OPTION B: TypeScript Script (3 min)

```bash
cd d:\zt\ lounge\zt-lounge-demo\zt-lounge
npx ts-node scripts/migrate-gallery.ts
```

### OPTION C: Manual API Calls (10 min)

Create each image via POST /api/admin/gallery with proper page_id.

---

## ✅ VERIFICATION TESTS

After migration, verify:

**Admin UI** → http://localhost:3000/dashboard/gallery
- [ ] Conference: 4 images with ⭐ badges
- [ ] Home: 2 images with ⭐ badges
- [ ] Gallery: 14 images (no badges)
- [ ] Toggles work (Featured, Active, Order)
- [ ] Page isolation (no overlap)

**Public Site**
- [ ] Conference Gallery: 4-image carousel
- [ ] Home: Hero carousel shows 2 images
- [ ] All images load without 404s
- [ ] Lightbox works

**Database**
```sql
SELECT page_key, COUNT(*) as total,
  SUM(CASE WHEN is_featured THEN 1 ELSE 0 END) as featured
FROM gallery g JOIN website_pages wp ON g.page_id = wp.id
GROUP BY page_key;

Expected:
conference | 4 | 4
gallery    | 14| 0
home       | 2 | 2
```

---

## 📊 IMAGE DISTRIBUTION

**Conference (4 featured):**
```
gallery-01.webp → Main Conference Room ⭐
gallery-02.webp → Meeting Setup ⭐
gallery-03.webp → Breakout Area ⭐
gallery-04.webp → Dining Setup ⭐
```

**Home (2 featured):**
```
gallery-10.webp → ZT Lounge Hero ⭐
gallery-09.webp → Luxury Experience ⭐
```

**Gallery (14 all):**
```
All 14 images in grid, sorted by order
```

---

## 🎬 NEXT STEPS

1. Pick Option A, B, or C
2. Run migration (5-10 min)
3. Run verification tests (10-15 min)
4. Deploy to production

**Total: ~30 minutes**

---

## 📁 FILES

- `supabase/migrations/044_gallery_image_migration.sql`
- `scripts/migrate-gallery.ts`
- `IMAGE_MIGRATION_PLAN.md`
- `GALLERY_MIGRATION_EXECUTION.md`

**Ready to execute? Choose your option above! 🚀**
