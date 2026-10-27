-- Migration 065: Seed media_assets and backfill media_id/alt_text across CMS tables
-- Images already exist in storage bucket 'public-assets'; we register them here.

-- 1. Insert media_assets for services (one per service, 51 rows)
INSERT INTO public.media_assets (id, content_hash, public_url, file_size, mime_type, created_at, updated_at) VALUES
-- Events category services (category_id: 3119b4b5-58dc-42a3-990c-b351ff29f2ce)
('33333333-1111-4444-8888-000000000001', 'sha256:wedding', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/wedding.webp', 374260, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000002', 'sha256:birthday', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/birthday.webp', 357710, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000003', 'sha256:corporate-events', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/event-1.webp', 418088, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000004', 'sha256:private-parties', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/celebration.webp', 16868, 'image/webp', now(), now()),
-- Barbershop category services (category_id: 48e41816-d888-4c69-b992-909c650066a6)
('33333333-1111-4444-8888-000000000005', 'sha256:classic-haircut', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000006', 'sha256:beard-grooming', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000007', 'sha256:barber-premium', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000008', 'sha256:kids-haircut', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000009', 'sha256:barbershop', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
-- VIP Cabins category services (category_id: 8c3bce52-6d82-4bb6-b71a-e91d3f77dd09)
('33333333-1111-4444-8888-000000000010', 'sha256:private-butler', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-private-suite.webp', 312380, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000011', 'sha256:in-cabin-dining', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-private-dining.webp', 99966, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000012', 'sha256:vip-bar', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-tv-lounge.webp', 78840, 'image/webp', now(), now()),
-- Lounge & Bar category services (category_id: b4d23b69-38ae-4a0d-b525-8760b6ab42e9)
('33333333-1111-4444-8888-000000000013', 'sha256:somelier', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/signature-dish.webp', 348076, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000014', 'sha256:a-la-carte', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-2.webp', 172938, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000015', 'sha256:restaurant', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-1.webp', 324994, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000016', 'sha256:chef-special', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/open-kitchen.webp', 90282, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000017', 'sha256:private-dining', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/outdoor-dining.webp', 164576, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000018', 'sha256:outdoor-terrace', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/interior.webp', 124896, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000019', 'sha256:premium-ingredients', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/outdoor-dining.webp', 164576, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000020', 'sha256:expert-chefs', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/kitchen.webp', 85462, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000021', 'sha256:500-happy-guests', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/family-area.webp', 133006, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000022', 'sha256:award-winning-service', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-premium.webp', 177938, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000023', 'sha256:open-7-days', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-interior.webp', 133006, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000024', 'sha256:farm-to-table', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/family-area.webp', 133006, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000025', 'sha256:catering-available', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-2.webp', 172938, 'image/webp', now(), now()),
-- Events: missing 'events' service
('33333333-1111-4444-8888-000000000026', 'sha256:events', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/hero-events.webp', 16868, 'image/webp', now(), now()),
-- VIP Cabins remaining 4
('33333333-1111-4444-8888-000000000027', 'sha256:24-7-concierge', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-lounge-main.webp', 85462, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000028', 'sha256:vip-entertainment', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-lounge-wide.webp', 90282, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000029', 'sha256:private-entrance', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-private-dining.webp', 99966, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000030', 'sha256:vip-lounge', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-interior.webp', 124896, 'image/webp', now(), now()),
-- Auto Spa category
('33333333-1111-4444-8888-000000000031', 'sha256:auto-spa', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/autospa-1.webp', 78840, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000032', 'sha256:full-detail', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/car-detailing.webp', 85462, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000033', 'sha256:interior-detail', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/interior-webp.webp', 90282, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000034', 'sha256:premium-polish', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/premium-finish.webp', 124896, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000035', 'sha256:wash-wax', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/car-wash.webp', 133006, 'image/webp', now(), now()),
-- Conference category
('33333333-1111-4444-8888-000000000036', 'sha256:conference-equipment', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-hall.webp', 172938, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000037', 'sha256:boardroom', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-1.webp', 324994, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000038', 'sha256:conference', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-2.webp', 172938, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000039', 'sha256:seminars', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-setup.webp', 164576, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000040', 'sha256:retreats', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/corporate-meeting.webp', 90282, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000041', 'sha256:high-speed-wifi', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-setup-opt.webp', 164576, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000042', 'sha256:training', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-1-opt.webp', 324994, 'image/webp', now(), now()),
-- Carpet Cleaning category
('33333333-1111-4444-8888-000000000043', 'sha256:carpet-cleaning', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/autospa-2.webp', 99966, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000044', 'sha256:stain-removal', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/car-detailing-opt.webp', 85462, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000045', 'sha256:steam-clean', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/car-wash.webp', 133006, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000046', 'sha256:upholstery', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/premium-finish-opt.webp', 124896, 'image/webp', now(), now()),
-- Lounge & Bar category
('33333333-1111-4444-8888-000000000047', 'sha256:sommelier', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/signature-dish.webp', 348076, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000048', 'sha256:hookah', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-nightlife.webp', 90282, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000049', 'sha256:live-music', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-nightlife-opt.webp', 16868, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000050', 'sha256:lounge', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-interior.webp', 133006, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000051', 'sha256:spirits', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-bottle.webp', 85462, 'image/webp', now(), now()),
('33333333-1111-4444-8888-000000000052', 'sha256:cocktails', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/cocktails.webp', 78840, 'image/webp', now(), now());

-- 2. Backfill services.media_id and services.alt_text (51 rows)
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000001', alt_text = 'Wedding receptions event space' WHERE id = 'd9632bdd-0bc8-451c-a8c4-3415a2c5ff20';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000002', alt_text = 'Birthday parties celebration' WHERE id = '1eb2c2e2-b77a-40c8-99c1-f91c0a6e3886';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000003', alt_text = 'Corporate events conference' WHERE id = '5dfba383-1baa-4e64-9c92-f724ba114a80';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000004', alt_text = 'Private parties venue' WHERE id = '692b609a-8f71-4040-9217-91c94ac049b0';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000026', alt_text = 'Events hosting' WHERE id = '9f17ae64-958b-41e4-9134-2f2852247d8b';

UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000009', alt_text = 'Barbershop services' WHERE id = 'c6e8e542-f816-4f63-9cb9-b30f3e0ccaa9';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000006', alt_text = 'Beard grooming service' WHERE id = 'a620dc34-ca90-472e-849f-29c0937f56ed';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000005', alt_text = 'Classic haircut' WHERE id = '01a7f98a-f36d-437b-82b5-2aca708d614a';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000008', alt_text = 'Kids haircut' WHERE id = '84925b09-8f62-433b-80b1-2b53d0b78efa';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000007', alt_text = 'Premium barber package' WHERE id = 'f3607d59-6c30-4f10-8e47-4ee23295e9fa';

-- VIP Cabins category
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000010', alt_text = 'Private butler service' WHERE id = 'fa84a879-e21b-447b-9a8a-9a2d90e295c9';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000011', alt_text = 'In-cabin dining service' WHERE id = 'f79a5289-bf4d-42ad-802b-b0f47670ce83';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000012', alt_text = 'VIP bar access' WHERE id = 'e6356f0a-4e0c-4c3d-b90f-74cb09ba6e9d';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000027', alt_text = '24/7 concierge service' WHERE id = '4ab1d0c8-5fba-441f-a35f-9f5b978eaa29';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000028', alt_text = 'VIP entertainment' WHERE id = '7de17a0b-8d5a-459d-8663-6a8f7097505c';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000029', alt_text = 'Private entrance VIP' WHERE id = '9bc71009-c884-47b0-8e68-f949e045e633';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000030', alt_text = 'VIP lounge access' WHERE id = '041c9bc7-bbcf-414c-95aa-a644ac81da46';

-- Auto Spa category
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000031', alt_text = 'Auto spa detailing' WHERE id = '3aab864b-2fd2-43a3-922d-63a14b47c13e';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000032', alt_text = 'Full car detail' WHERE id = '541e05c9-addf-455c-bb2d-7084d2e95721';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000033', alt_text = 'Interior detailing' WHERE id = 'ffb09287-460f-418e-9e57-d07e2d476060';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000034', alt_text = 'Premium polish' WHERE id = 'ebebcc1d-f7d6-4d6f-b850-f192487f87bb';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000035', alt_text = 'Wash and wax' WHERE id = '4c50c29b-2373-4844-b94f-a9520daa9785';

-- Conference category
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000036', alt_text = 'Conference equipment' WHERE id = '0a9756c3-5df0-41b9-b6ff-3357ff0a39b6';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000037', alt_text = 'Boardroom rental' WHERE id = '27032f43-c857-4e2c-bbfc-50098fd9c901';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000038', alt_text = 'Conference hall' WHERE id = '3326eef4-34e7-4d20-98b3-faa45df1a5cd';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000039', alt_text = 'Seminars and workshops' WHERE id = '47d736be-6962-47da-8527-ecb4cc7289da';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000040', alt_text = 'Corporate retreats' WHERE id = '3fe5fcd0-f1b0-4073-bc7d-f68a20ff6432';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000041', alt_text = 'High speed WiFi' WHERE id = 'ef1fc718-1644-489f-bbad-e3ba83eadff0';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000042', alt_text = 'Training facilities' WHERE id = '3c346bf5-805a-4bdd-a040-ec6d66c7119a';

-- Carpet Cleaning category
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000043', alt_text = 'Carpet cleaning service' WHERE id = '66e45105-ffd3-4937-be97-96c27b7a1966';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000044', alt_text = 'Stain removal' WHERE id = '16babd23-c009-4cb2-96d1-350c787df629';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000045', alt_text = 'Steam cleaning' WHERE id = '24e89ef9-8453-4b17-ac8b-4a70f83f6ba0';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000046', alt_text = 'Upholstery cleaning' WHERE id = 'e9c54be8-338f-43bf-874d-488677605e5f';

-- Lounge & Bar category
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000047', alt_text = 'Expert sommelier service' WHERE id = '23480526-2bd6-4855-849d-5416928e0644';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000048', alt_text = 'Hookah lounge' WHERE id = '1a60c601-cf43-4025-ad33-4db24a394623';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000049', alt_text = 'Live music nights' WHERE id = '1fba79fc-7de5-45db-9a4e-f439c919cd4c';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000050', alt_text = 'Lounge seating area' WHERE id = 'e544de1b-1a3a-467c-abb3-ac0f53275bb5';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000051', alt_text = 'Premium spirits bar' WHERE id = '378c241d-dd23-46c8-937a-e8b9c4320a48';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000052', alt_text = 'Signature cocktails' WHERE id = '20183313-ecb1-4479-83e5-b3db366d7c21';

-- Restaurant category (media_assets 0013-0024)
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000013', alt_text = 'Expert sommelier' WHERE id = '23480526-2bd6-4855-849d-5416928e0644';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000014', alt_text = 'A la carte dining' WHERE id = '2c686202-33c7-4843-a419-6b590634e407';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000015', alt_text = 'Restaurant dining' WHERE id = '6aba155c-df33-4db0-bc7c-5730370d85bd';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000016', alt_text = 'Chef special tasting' WHERE id = 'c590957a-9ccb-48b6-b9a0-107d74eeeea2';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000017', alt_text = 'Private dining room' WHERE id = 'abb9d8fe-8814-4d3b-9fd6-97da920612a0';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000018', alt_text = 'Outdoor terrace dining' WHERE id = 'c95cd03d-21c1-444a-8233-deb0cfcb4ff1';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000019', alt_text = 'Premium ingredients' WHERE id = '70f2c5f8-1cf9-4b2d-bac3-d105d13db757';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000020', alt_text = 'Expert chefs kitchen' WHERE id = '65b96f91-08ea-4636-b2a4-29c630d21ed3';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000021', alt_text = '500 happy guests served' WHERE id = '464b4d29-1302-4a3f-b2fc-e6a83d181605';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000022', alt_text = 'Award winning service' WHERE id = '796651fb-4a2f-451e-bd9a-612c11b0efe1';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000023', alt_text = 'Open 7 days a week' WHERE id = '03444dcb-0d40-4db1-bf3e-269b0a006310';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000024', alt_text = 'Farm to table ingredients' WHERE id = 'd90b5871-d89c-4264-8cbd-3b06da2bf906';
UPDATE public.services SET media_id = '33333333-1111-4444-8888-000000000025', alt_text = 'Catering available' WHERE id = '365c1d1a-9788-4b21-9908-2a05810dbddb';

-- 3. Insert media_assets for gallery (5 rows)
INSERT INTO public.media_assets (id, content_hash, public_url, file_size, mime_type, created_at, updated_at) VALUES
('44444444-1111-4444-8888-000000000001', 'sha256:gallery-lounge', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-interior.webp', 133006, 'image/webp', now(), now()),
('44444444-1111-4444-8888-000000000002', 'sha256:gallery-dining', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/restaurant/restaurant-1.webp', 324994, 'image/webp', now(), now()),
('44444444-1111-4444-8888-000000000003', 'sha256:gallery-autospa', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/autospa/autospa-1.webp', 78840, 'image/webp', now(), now()),
('44444444-1111-4444-8888-000000000004', 'sha256:gallery-events', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/wedding.webp', 374260, 'image/webp', now(), now()),
('44444444-1111-4444-8888-000000000005', 'sha256:gallery-conference', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-hall.webp', 172938, 'image/webp', now(), now());

-- 4. Backfill gallery.media_id (5 rows)
UPDATE public.gallery SET media_id = '44444444-1111-4444-8888-000000000001' WHERE id = 'cd2d7e9b-070a-4fbb-bba4-363ec071ab26';
UPDATE public.gallery SET media_id = '44444444-1111-4444-8888-000000000002' WHERE id = '420b97ec-5587-4037-9212-00f46e8363f5';
UPDATE public.gallery SET media_id = '44444444-1111-4444-8888-000000000003' WHERE id = '61a5a187-43ca-4222-b760-5957813426b6';
UPDATE public.gallery SET media_id = '44444444-1111-4444-8888-000000000004' WHERE id = 'd6aeccdc-4da1-4717-8fe5-1cb2ca0506da';
UPDATE public.gallery SET media_id = '44444444-1111-4444-8888-000000000005' WHERE id = '4aaf1f3a-ba44-4754-99fd-5103f567d7e6';

-- 5. Insert media_assets for hero_slides (2 rows)
INSERT INTO public.media_assets (id, content_hash, public_url, file_size, mime_type, created_at, updated_at) VALUES
('55555555-1111-4444-8888-000000000001', 'sha256:hero-lounge', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/lounge/hero-lounge.webp', 348076, 'image/webp', now(), now()),
('55555555-1111-4444-8888-000000000002', 'sha256:hero-events', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/events/event-1.webp', 418088, 'image/webp', now(), now());

-- 6. Backfill hero_slides.media_id (2 rows)
UPDATE public.hero_slides SET media_id = '55555555-1111-4444-8888-000000000001' WHERE id = 'bad96f85-273e-4733-9e06-5a373b23a724';
UPDATE public.hero_slides SET media_id = '55555555-1111-4444-8888-000000000002' WHERE id = '0b5d0144-cb4f-4e7d-893b-526cf4ce9260';

-- 7. Insert media_assets for menu_items (5 rows)
INSERT INTO public.media_assets (id, content_hash, public_url, file_size, mime_type, created_at, updated_at) VALUES
('66666666-1111-4444-8888-000000000001', 'sha256:menu-nyama-choma', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/menu/nyama-choma.webp', 99966, 'image/webp', now(), now()),
('66666666-1111-4444-8888-000000000002', 'sha256:menu-loaded-fries', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/menu/loaded-fries.webp', 85462, 'image/webp', now(), now()),
('66666666-1111-4444-8888-000000000003', 'sha256:menu-beef-steak', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/menu/beef-steak.webp', 90282, 'image/webp', now(), now()),
('66666666-1111-4444-8888-000000000004', 'sha256:menu-chocolate-cake', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/menu/signature-pilau.webp', 78840, 'image/webp', now(), now()),
('66666666-1111-4444-8888-000000000005', 'sha256:menu-fresh-juice', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/menu/fresh-juice.webp', 65000, 'image/webp', now(), now());

-- 8. Backfill menu_items.media_id (5 rows)
UPDATE public.menu_items SET media_id = '66666666-1111-4444-8888-000000000001' WHERE id = '935df93d-52a4-47b5-93dd-ffdfede4ec60';
UPDATE public.menu_items SET media_id = '66666666-1111-4444-8888-000000000002' WHERE id = 'b899386d-f1bc-4d9b-b05b-9c66e7a0857b';
UPDATE public.menu_items SET media_id = '66666666-1111-4444-8888-000000000003' WHERE id = '957c00c7-dae3-4baf-9e1e-ebbab2702131';
UPDATE public.menu_items SET media_id = '66666666-1111-4444-8888-000000000004' WHERE id = 'c4553e0e-890f-426f-9158-3c8fb7e4b04a';
UPDATE public.menu_items SET media_id = '66666666-1111-4444-8888-000000000005' WHERE id = '42c29904-8f0b-46ef-9362-5d08a72d21b2';

-- 9. Insert media_assets for testimonials (3 rows - use branding images as no customer photos exist)
INSERT INTO public.media_assets (id, content_hash, public_url, file_size, mime_type, created_at, updated_at) VALUES
('77777777-1111-4444-8888-000000000001', 'sha256:testimonial-mary', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('77777777-1111-4444-8888-000000000002', 'sha256:testimonial-john', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now()),
('77777777-1111-4444-8888-000000000003', 'sha256:testimonial-grace', 'https://pub-xyz.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp', 88698, 'image/webp', now(), now());

-- 10. Backfill testimonials.media_id (3 rows)
UPDATE public.testimonials SET media_id = '77777777-1111-4444-8888-000000000001' WHERE id = '5d140d3b-92c7-4bcc-80b2-16e41ee5b879';
UPDATE public.testimonials SET media_id = '77777777-1111-4444-8888-000000000002' WHERE id = '33e61023-013d-4cea-a93e-d4ea41dfe193';
UPDATE public.testimonials SET media_id = '77777777-1111-4444-8888-000000000003' WHERE id = 'de6e5655-c241-4a74-8423-36eb06d21f2c';

-- 11. Verification: confirm all target tables have zero null media_id
SELECT 'services' AS tbl, COUNT(*) AS null_media_id FROM public.services WHERE media_id IS NULL
UNION ALL SELECT 'gallery', COUNT(*) FROM public.gallery WHERE media_id IS NULL
UNION ALL SELECT 'hero_slides', COUNT(*) FROM public.hero_slides WHERE media_id IS NULL
UNION ALL SELECT 'menu_items', COUNT(*) FROM public.menu_items WHERE media_id IS NULL
UNION ALL SELECT 'testimonials', COUNT(*) FROM public.testimonials WHERE media_id IS NULL;
