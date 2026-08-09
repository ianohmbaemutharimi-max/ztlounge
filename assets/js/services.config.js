/**
 * ============================================================
 * ZT Lounge Meru - Services Configuration
 * Single Source of Truth for Services Section
 * Version: 1.0.0
 * ============================================================
 */

window.ServicesConfig = Object.freeze({
    home: {
        tag: "Our Services",
        heading: "Explore",
        highlight: "ZT Lounge",
        subtitle: "Discover our premium hospitality experiences",
        services: [
            {
                id: "restaurant",
                name: "Restaurant",
                description: "Fine dining with exquisite cuisine and elegant ambiance",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/restaurant/interior.webp",
                alt_text: "Fine dining restaurant at ZT Lounge with elegant table setting and ambient lighting",
                tag: "✦ Signature",
                page_id: "home",
                type: "service",
                display_order: 1,
                href: "pages/experiences/restaurant.html"
            },
            {
                id: "lounge",
                name: "Lounge & Bar",
                description: "Premium cocktails, live entertainment, and sophisticated atmosphere",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/lounge/lounge-interior-main.webp",
                alt_text: "Luxury lounge and bar at ZT Lounge with premium seating and sophisticated atmosphere",
                tag: "✦ Nightlife",
                page_id: "home",
                type: "service",
                display_order: 2,
                href: "pages/experiences/lounge.html"
            },
            {
                id: "vip",
                name: "VIP Cabins",
                description: "Private, exclusive cabins for intimate dining and celebrations",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-fireplace-lounge.webp",
                alt_text: "Luxury VIP cabin at ZT Lounge with private dining and exclusive amenities",
                tag: "✦ Private",
                page_id: "home",
                type: "service",
                display_order: 3,
                href: "pages/experiences/vip.html"
            },
            {
                id: "events",
                name: "Events",
                description: "Weddings, birthdays, graduations, and private celebrations",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/events/wedding.webp",
                alt_text: "Elegant event setup at ZT Lounge with floral arrangements and celebratory decor",
                tag: "✦ Celebrations",
                page_id: "home",
                type: "service",
                display_order: 4,
                href: "pages/business/events.html"
            },
            {
                id: "conference",
                name: "Conference",
                description: "State-of-the-art facilities for corporate meetings and seminars",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/conference/conference-hall.webp",
                alt_text: "Modern conference hall at ZT Lounge with state-of-the-art audiovisual equipment",
                tag: "✦ Corporate",
                page_id: "home",
                type: "service",
                display_order: 5,
                href: "pages/business/conference.html"
            },
            {
                id: "autospa",
                name: "Auto Spa",
                description: "Professional detailing, washing, and premium car care services",
                image_url: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/autospa/car-detailing.webp",
                alt_text: "Professional auto detailing at ZT Lounge with premium car care services",
                tag: "✦ Premium",
                page_id: "home",
                type: "service",
                display_order: 6,
                href: "pages/business/autospa.html"
            }
        ]
    },
    restaurant: {
        experiences: [
            { icon: "fa-tree", name: "Outdoor Garden Dining", description: "Dine under beautiful shades surrounded by nature, fresh air, and warm lights.", display_order: 1 },
            { icon: "fa-door-closed", name: "Private Dining", description: "Exclusive spaces for birthdays, business meetings, and intimate celebrations.", display_order: 2 },
            { icon: "fa-users", name: "Family Friendly", description: "Spacious seating, welcoming service, and a menu everyone will enjoy.", display_order: 3 },
            { icon: "fa-fire", name: "Live Grill Experience", description: "Signature dishes grilled to perfection over open flames right before you.", display_order: 4 }
        ]
    },
    vip: {
        experiences: [
            { icon: "fa-door-closed", name: "Private Entrance", description: "Dedicated access for discreet arrivals and departures.", display_order: 1 },
            { icon: "fa-concierge-bell", name: "Premium Service", description: "Dedicated butler service available throughout your stay.", display_order: 2 },
            { icon: "fa-glass-cheers", name: "Exclusive Bar", description: "Personalized premium spirits and signature cocktails.", display_order: 3 },
            { icon: "fa-moon", name: "Evening Privacy", description: "Soundproof cabins for uninterrupted conversations.", display_order: 4 }
        ]
    },
    events: {
        features: [
            { icon: "fa-users", name: "Event Planning", description: "Full-service event coordination from start to finish.", display_order: 1 },
            { icon: "fa-utensils", name: "Catering", description: "Customizable menus for any occasion.", display_order: 2 },
            { icon: "fa-glass-cheers", name: "Premium Bar", description: "Open bar options with top-shelf spirits.", display_order: 3 },
            { icon: "fa-parking", name: "Parking", description: "Secure on-site parking for all guests.", display_order: 4 }
        ]
    },
    conference: {
        features: [
            { icon: "fa-video", name: "AV Equipment", description: "State-of-the-art audiovisual presentation technology.", display_order: 1 },
            { icon: "fa-wifi", name: "High-Speed WiFi", description: "Enterprise-grade internet throughout the venue.", display_order: 2 },
            { icon: "fa-coffee", name: "Catering", description: "Coffee breaks, lunch, and dinner options.", display_order: 3 },
            { icon: "fa-chair", name: "Flexible Seating", description: "Customizable layouts from boardroom to theater.", display_order: 4 }
        ]
    },
    autospa: {
        features: [
            { icon: "fa-shower", name: "Premium Wash", description: "Gentle hand wash with premium pH-neutral products.", display_order: 1 },
            { icon: "fa-spray-can", name: "Detailing", description: "Interior and exterior detailing with meticulous care.", display_order: 2 },
            { icon: "fa-fill-drip", name: "Engine Bay", description: "Degreasing and dressing of engine compartment.", display_order: 3 },
            { icon: "fa-certificate", name: "Wax & Polish", description: "Paint protection with premium carnauba wax.", display_order: 4 }
        ]
    }
});
