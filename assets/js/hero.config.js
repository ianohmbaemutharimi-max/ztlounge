/**
 * ============================================================
 * ZT Lounge Meru - Hero Configuration
 * Single Source of Truth for Hero Section Content
 * Version: 1.0.0
 * ============================================================
 */

window.HeroConfig = Object.freeze({
    home: {
        slides: [
            {
                badge: "Meru's Finest",
                title: "ZT Lounge",
                highlight: "Meru",
                subtitle: "Premium Dining â€¢ VIP Cabins â€¢ Pool Table â€¢ Lounge & Bar â€¢ Events â€¢ Conference â€¢ Auto Spa",
                buttons: [
                    { text: "Explore Services", href: "#services", style: "primary" },
                    { text: "Contact Us", href: "pages/contact/contact.html", style: "secondary" }
                ]
            },
            {
                badge: "Night Experience",
                title: "Unforgettable",
                highlight: "Evenings",
                subtitle: "From sunset cocktails to late-night entertainment, experience Meru's finest hospitality.",
                buttons: [
                    { text: "Explore Services", href: "#services", style: "primary" },
                    { text: "Contact Us", href: "pages/contact/contact.html", style: "secondary" }
                ]
            }
        ]
    },
    restaurant: {
        slides: [
            {
                badge: "â˜… Meru's Premier Dining Destination",
                title: "Exceptional",
                highlight: "Dining",
                subtitle: "Gourmet Cuisine â€¢ Elegant Ambiance â€¢ Signature Grills â€¢ Premium Service",
                buttons: [
                    { text: "Book a Table", href: "#reservation", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            },
            {
                badge: "â˜… Signature Dishes",
                title: "Gourmet",
                highlight: "Creations",
                subtitle: "Crafted with passion using the finest ingredients",
                buttons: [
                    { text: "Book a Table", href: "#reservation", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            },
            {
                badge: "â˜… Premium Dining",
                title: "Elegant",
                highlight: "Ambiance",
                subtitle: "Sophisticated setting for unforgettable dining experiences",
                buttons: [
                    { text: "Book a Table", href: "#reservation", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            }
        ]
    },
    restaurantMenu: {
        slides: [
            {
                badge: "Meru's Finest Dining",
                title: "Culinary",
                highlight: "Excellence",
                subtitle: "Signature grills, gourmet creations, and an ambiance of refined luxury",
                buttons: [
                    { text: "Explore the Menu", href: "#menu", style: "primary" },
                    { text: "Reserve a Table", href: "restaurant.html#reservation", style: "secondary" }
                ]
            },
            {
                badge: "Chef's Signature",
                title: "Artisanal",
                highlight: "Creations",
                subtitle: "Each dish crafted with precision, passion, and the finest ingredients",
                buttons: [
                    { text: "View the Menu", href: "#menu", style: "primary" },
                    { text: "Reserve Now", href: "restaurant.html#reservation", style: "secondary" }
                ]
            },
            {
                badge: "Private Dining",
                title: "Exclusive",
                highlight: "Experiences",
                subtitle: "Intimate gatherings and celebrations in our sophisticated VIP cabins",
                buttons: [
                    { text: "Discover the Menu", href: "#menu", style: "primary" },
                    { text: "Private Dining", href: "vip.html", style: "secondary" }
                ]
            }
        ]
    },
    lounge: {
        slides: [
            {
                badge: "Lounge Experience",
                title: "Premium",
                highlight: "Lounge",
                subtitle: "Handcrafted Cocktails â€¢ Live Entertainment â€¢ Sophisticated Atmosphere",
                buttons: [
                    { text: "Reserve a Table", href: "#booking", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            },
            {
                badge: "Premium Spirits",
                title: "Crafted",
                highlight: "Cocktails",
                subtitle: "Expert mixologists creating signature drinks for every palate",
                buttons: [
                    { text: "Reserve a Table", href: "#booking", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            },
            {
                badge: "Evening Vibes",
                title: "Live",
                highlight: "Entertainment",
                subtitle: "Curated performances and vibrant energy nightly",
                buttons: [
                    { text: "Reserve a Table", href: "#booking", style: "primary" },
                    { text: "View Menu", href: "restaurant-menu.html", style: "secondary" }
                ]
            }
        ]
    },
    vip: {
        slides: [
            {
                badge: "VIP Experience",
                title: "Exclusive",
                highlight: "Cabins",
                subtitle: "Private Spaces â€¢ Premium Service â€¢ Luxury Amenities",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "View Gallery", href: "../contact/gallery.html", style: "secondary" }
                ]
            },
            {
                badge: "Privacy First",
                title: "Intimate",
                highlight: "Dining",
                subtitle: "Exclusive private spaces for your special occasions",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "View Gallery", href: "../contact/gallery.html", style: "secondary" }
                ]
            },
            {
                badge: "Luxury Amenities",
                title: "Premium",
                highlight: "Services",
                subtitle: "Dedicated butler service and custom menu options",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "View Gallery", href: "../contact/gallery.html", style: "secondary" }
                ]
            }
        ]
    },
    events: {
        slides: [
            {
                badge: "Celebrations",
                title: "Create",
                highlight: "Unforgettable",
                subtitle: "Weddings â€¢ Birthdays â€¢ Graduations â€¢ Anniversaries â€¢ Corporate Events",
                buttons: [
                    { text: "Plan Your Event", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Weddings",
                title: "Elegant",
                highlight: "Weddings",
                subtitle: "Stunning decor, gourmet catering, and dedicated wedding coordination",
                buttons: [
                    { text: "Plan Your Event", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Birthdays",
                title: "Celebrate",
                highlight: "Life's Milestones",
                subtitle: "Custom birthday parties with catering, decorations, and entertainment",
                buttons: [
                    { text: "Plan Your Event", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            }
        ]
    },
    conference: {
        slides: [
            {
                badge: "Corporate Events",
                title: "Premium",
                highlight: "Conference",
                subtitle: "State-of-the-art â€¢ Corporate Meetings â€¢ Training â€¢ Seminars â€¢ Workshops",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Professional Environment",
                title: "Corporate",
                highlight: "Meetings",
                subtitle: "Professional business meetings with premium AV equipment",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Flexible Spaces",
                title: "Versatile",
                highlight: "Event",
                subtitle: "From boardroom meetings to large conferences",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            }
        ]
    },
    autospa: {
        slides: [
            {
                badge: "Premium Car Care",
                title: "Auto",
                highlight: "Spa",
                subtitle: "Professional Detailing â€¢ Premium Washing â€¢ Polishing â€¢ Interior Cleaning",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Expert Detailing",
                title: "Precision",
                highlight: "Detailing",
                subtitle: "Meticulous attention to every curve, surface, and finish",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            },
            {
                badge: "Interior Care",
                title: "Spotless",
                highlight: "Interiors",
                subtitle: "Deep cleaning, sanitization, and premium interior care",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            }
        ]
    },
    gallery: {
        slides: [
            {
                badge: "Gallery",
                title: "Our",
                highlight: "Spaces",
                subtitle: "Visual journey through ZT Lounge Meru",
                buttons: [
                    { text: "Book Now", href: "contact.html", style: "primary" },
                    { text: "View Services", href: "#services", style: "secondary" }
                ]
            }
        ]
    },
    contact: {
        slides: [
            {
                badge: "Contact Us",
                title: "Your",
                highlight: "Event",
                subtitle: "Destination â€¢ Corporate meetings â€¢ Celebrations and more",
                buttons: [
                    { text: "Book Now", href: "#booking", style: "primary" },
                    { text: "Explore Services", href: "#services", style: "secondary" }
                ]
            }
        ]
    }
});
