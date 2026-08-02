/**
 * ============================================================
 * ZT Lounge Meru - Contact Configuration
 * Single Source of Truth for Contact Page Content
 * Version: 1.0.0
 * ============================================================
 */

window.ContactConfig = Object.freeze({
    hero: {
        badge: "Contact Us",
        title: "Your",
        highlight: "Event",
        subtitle: "Destination • Corporate meetings • Celebrations and more",
        buttons: [
            { text: "Book Now", href: "#booking", style: "primary" },
            { text: "Explore Services", href: "#services", style: "secondary" }
        ]
    },
    contactInfo: {
        heading: "Contact Information",
        items: [
            { icon: "fa-phone", value: "+254 143 542 601" },
            { icon: "fab-whatsapp", value: "WhatsApp", href: "https://wa.me/254143542601" },
            { icon: "fa-envelope", value: "ztloungemeru@gmail.com" },
            { icon: "fa-map-marker-alt", value: "Opposite Ezri Hotel, Milimani, Meru" },
            { icon: "fa-clock", value: "Mon–Sun: 10:00 AM – 2:00 AM" },
            { icon: "fa-parking", value: "Secure on-site parking available" }
        ]
    },
    trustBadges: {
        happyGuests: "200+",
        eventsHosted: "500+",
        responseTime: "Within 30 minutes"
    }
});