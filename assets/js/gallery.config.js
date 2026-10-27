/**
 * ============================================================
 * ZT Lounge Meru - Gallery Configuration
 * Single Source of Truth for Gallery Content
 * Version: 2.0.0 (Canonical Media Migration)
 *
 * MEDIA CONTRACT: entries reference media assets exclusively via
 * media_id (media_assets UUID). No image URL fallbacks â€” resolution
 * happens through window.MediaResolver.
 * NOTE: GalleryRepository is DB-sourced (gallery table) and does not
 * consume this file; it is retained as a canonical media_id reference
 * map for the home + full gallery sections.
 * ============================================================
 */

window.GalleryConfig = Object.freeze({
    home: {
        tag: "Our Spaces",
        title: "Photo",
        highlight: "Gallery",
        subtitle: "Take a visual tour of our luxurious facilities",
        media_ids: [
            "e558d226-2b12-421a-a7f5-6208b96b9875",
            "46dbd272-7e27-4816-ad40-3b66b70f00e0",
            "f9f4ea0e-6e0c-4d45-a9b0-dcbbbdee8fb1",
            "95a6a0c4-78b0-45f0-a4cc-65a392b14062"
        ]
    },
    full: {
        tag: "Collection",
        title: "Photo",
        highlight: "Gallery",
        subtitle: "Take a visual tour of our luxurious facilities",
        items: [
            {
                media_id: "e558d226-2b12-421a-a7f5-6208b96b9875",
                alt: "Luxury dining experience at ZT Lounge Meru featuring gourmet cuisine and elegant table setting",
                label: "Fine Dining",
                caption: "Elegant dining with premium table settings"
            },
            {
                media_id: "46dbd272-7e27-4816-ad40-3b66b70f00e0",
                alt: "Luxurious VIP cabin at ZT Lounge Meru with private dining area and premium furnishings",
                label: "VIP Cabin",
                caption: "Luxury with modern amenities"
            },
            {
                media_id: "f9f4ea0e-6e0c-4d45-a9b0-dcbbbdee8fb1",
                alt: "Modern conference hall at ZT Lounge Meru with professional meeting facilities",
                label: "Conference Hall",
                caption: "State-of-the-art AV equipment"
            },
            {
                media_id: "95a6a0c4-78b0-45f0-a4cc-65a392b14062",
                alt: "Premium lounge area at ZT Lounge Meru with comfortable seating and ambient lighting",
                label: "Lounge & Bar",
                caption: "Stylish seating and ambient lighting"
            },
            {
                media_id: "7bb512c2-7d7c-44d6-b72f-1eaabc9cac50",
                alt: "Elegant event setup with floral decorations",
                label: "Events",
                caption: "Elegant floral decorations"
            },
            {
                media_id: "8d6aafe8-639f-40e1-8363-120bc2e28f73",
                alt: "Vibrant nightlife experience at the lounge bar",
                label: "Nightlife",
                caption: "Vibrant atmosphere at the bar"
            },
            {
                media_id: "17b3eb91-a3f8-4afc-980f-7a18322fa1c3",
                alt: "Professional car detailing at the auto spa",
                label: "Auto Spa",
                caption: "Professional car detailing"
            },
            {
                media_id: "85182540-30fe-4819-87f2-207ca1a34e18",
                alt: "Restaurant interior showcasing premium dining atmosphere",
                label: "Restaurant Interior",
                caption: "Premium dining atmosphere"
            },
            {
                media_id: "0d4a4fc8-e6f6-480c-9e69-9566f77cfb6e",
                alt: "VIP cabin with premium amenities and luxury furnishings",
                label: "VIP Cabin",
                caption: "Premium amenities and luxury furnishings"
            },
            {
                media_id: "3831a32b-2c4d-4e51-9b2c-fbee538f0a09",
                alt: "Conference room setup with modern presentation technology",
                label: "Conference Room",
                caption: "Modern presentation technology"
            },
            {
                media_id: "0eb20c33-b6a1-446d-9d08-2de31fba497a",
                alt: "Outdoor patio and lounge seating area",
                label: "Outdoor Patio",
                caption: "Relaxing outdoor lounge seating"
            },
            {
                media_id: "1e4b1562-c219-424e-bfd7-683ca958137e",
                alt: "Private event dining setup with elegant table decor",
                label: "Private Dining",
                caption: "Elegant table decor for private events"
            },
            {
                media_id: "ab89bffb-ea49-4bcf-aa8f-a3853daea9ec",
                alt: "Auto spa premium detailing service in progress",
                label: "Auto Detailing",
                caption: "Premium service in progress"
            },
            {
                media_id: "c720f127-b6f6-43ee-9e26-8a9a1aed9702",
                alt: "ZT Lounge exterior showing the luxury facade and entrance",
                label: "Exterior",
                caption: "Luxury facade and entrance"
            }
        ]
    }
});
