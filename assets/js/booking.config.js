/**
 * ============================================================
 * ZT Lounge Meru - Booking Configuration
 * Single Source of Truth for Booking Options
 * Version: 1.0.0
 * ============================================================
 */

window.BookingConfig = Object.freeze({
    guestOptions: [2, 4, 6, 8, 10],
    restaurantTimes: ["12:00", "12:30", "13:00", "13:30", "14:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
    loungeTimes: ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
    occasions: {
        restaurant: [
            { value: "dinner", label: "Dinner" },
            { value: "lunch", label: "Lunch" },
            { value: "date-night", label: "Date Night" },
            { value: "celebration", label: "Celebration" },
            { value: "business", label: "Business Meeting" },
            { value: "other", label: "Other" }
        ],
        lounge: [
            { value: "date-night", label: "Date Night" },
            { value: "friends", label: "Friends Gathering" },
            { value: "business", label: "Business Meeting" },
            { value: "celebration", label: "Celebration" },
            { value: "after-work", label: "After-Work Drinks" },
            { value: "other", label: "Other" }
        ],
        vip: [
            { value: "private-dining", label: "Private Dining" },
            { value: "celebration", label: "Celebration" },
            { value: "business", label: "Business Meeting" },
            { value: "other", label: "Other" }
        ],
        events: [
            { value: "wedding", label: "Wedding" },
            { value: "birthday", label: "Birthday" },
            { value: "graduation", label: "Graduation" },
            { value: "corporate", label: "Corporate Event" },
            { value: "other", label: "Other" }
        ],
        conference: [
            { value: "meeting", label: "Meeting" },
            { value: "training", label: "Training" },
            { value: "seminar", label: "Seminar" },
            { value: "workshop", label: "Workshop" },
            { value: "other", label: "Other" }
        ],
        autospa: [
            { value: "wash", label: "Basic Wash" },
            { value: "detailing", label: "Full Detailing" },
            { value: "wax", label: "Wax & Polish" },
            { value: "interior", label: "Interior Cleaning" }
        ],
        contact: [
            { value: "dinner", label: "Dinner" },
            { value: "celebration", label: "Celebration" },
            { value: "corporate", label: "Corporate" },
            { value: "wedding", label: "Wedding" },
            { value: "other", label: "Other" }
        ]
    },
    serviceOptions: [
        { value: "restaurant", label: "Restaurant" },
        { value: "vip", label: "VIP Cabin" },
        { value: "lounge", label: "Lounge & Bar" },
        { value: "conference", label: "Conference Hall" },
        { value: "events", label: "Events Venue" },
        { value: "autospa", label: "Auto Spa" }
    ],
    successMessages: {
        restaurant: "Thank you! We'll confirm your reservation within 30 minutes.",
        lounge: "Thank you! We'll confirm your reservation within 30 minutes.",
        vip: "Thank you! We'll confirm your VIP cabin booking within 30 minutes.",
        events: "Thank you! We'll contact you to discuss your event details.",
        conference: "Thank you! We'll confirm your conference booking shortly.",
        autospa: "Thank you! We'll confirm your auto spa appointment within 30 minutes.",
        contact: "Thank you! We'll respond within 30 minutes."
    }
});
