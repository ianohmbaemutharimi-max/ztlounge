/**
 * ============================================================
 * ZT Lounge Meru - Menu Configuration
 * Single Source of Truth for Menu Items
 * Version: 1.0.0
 * ============================================================
 */

window.MenuConfig = Object.freeze({
    categories: [
        { id: "appetizers", name: "Appetizers", icon: "fa-leaf" },
        { id: "mains", name: "Main Dishes", icon: "fa-utensils" },
        { id: "signature", name: "Signature Grills", icon: "fa-fire" },
        { id: "desserts", name: "Desserts", icon: "fa-ice-cream" },
        { id: "beverages", name: "Beverages", icon: "fa-glass-cheers" },
        { id: "bar", name: "Bar Menu", icon: "fa-cocktail" }
    ],
    signatureCollection: [
        {
            id: "nyama-choma",
            name: "Signature Nyama Choma",
            description: "Slow-grilled to perfection, juicy, flavorful, and unforgettable.",
            price: "KES 1,800",
            image: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/menu/nyama-choma.webp",
            alt: "Signature Nyama Choma slow-grilled to perfection"
        },
        {
            id: "signature-pilau",
            name: "ZT Signature Pilau",
            description: "Aromatic basmati rice cooked with special spices and herbs.",
            price: "KES 650",
            image: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/menu/signature-pilau.webp",
            alt: "ZT Signature Pilau aromatic basmati rice"
        },
        {
            id: "beef-steak",
            name: "Premium Beef Steak",
            description: "Prime cuts grilled to your preference. Tender & juicy.",
            price: "KES 1,650",
            image: "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/menu/beef-steak.webp",
            alt: "Premium Beef Steak prime cuts grilled to preference"
        }
    ],
    fullMenu: {
        appetizers: [
            {
                id: "samaki",
                name: "Samaki Wings",
                description: "Crispy fish wings with tangy mango salsa",
                price: "KES 850"
            },
            {
                id: "chapati-rolls",
                name: "Chapati Rolls",
                description: "Soft chapati wrapped with spiced beef and vegetables",
                price: "KES 450"
            }
        ],
        mains: [
            {
                id: "nyama-choma-full",
                name: "Nyama Choma Platter",
                description: "Traditional beef or goat, slow-grilled to perfection with kachumbari",
                price: "KES 1,800"
            },
            {
                id: "grilled-chicken",
                name: "Grilled Chicken",
                description: "Marinated half chicken with herb potatoes and seasonal vegetables",
                price: "KES 1,500"
            }
        ],
        signature: [
            {
                id: "signature-nyama-choma",
                name: "Signature Nyama Choma",
                description: "Slow-grilled to perfection, juicy, flavorful, and unforgettable.",
                price: "KES 1,800"
            },
            {
                id: "signature-pilau",
                name: "ZT Signature Pilau",
                description: "Aromatic basmati rice cooked with special spices and herbs.",
                price: "KES 650"
            },
            {
                id: "beef-steak-full",
                name: "Premium Beef Steak",
                description: "Prime cuts grilled to your preference. Tender & juicy.",
                price: "KES 1,650"
            }
        ],
        desserts: [
            {
                id: "chocolate-lava",
                name: "Chocolate Lava Cake",
                description: "Warm molten chocolate cake with vanilla ice cream",
                price: "KES 550"
            },
            {
                id: "fruit-salad",
                name: "Seasonal Fruit Salad",
                description: "Fresh tropical fruits with honey-lime dressing",
                price: "KES 400"
            }
        ],
        beverages: [
            {
                id: "fresh-juice",
                name: "Fresh Tropical Juice",
                description: "Blend of seasonal fruits - passion, mango, pineapple",
                price: "KES 300"
            },
            {
                id: "soda",
                name: "Soft Drinks",
                description: "Coca-Cola, Fanta, Sprite, or Stoney",
                price: "KES 150"
            }
        ],
        bar: [
            {
                id: "dawa-cocktail",
                name: "Dawa Cocktail",
                description: "Vodka, honey, and lime shaken with fresh mint",
                price: "KES 600"
            },
            {
                id: "moscow-mule",
                name: "Moscow Mule",
                description: "Vodka, ginger beer, and lime in a chilled copper mug",
                price: "KES 750"
            }
        ]
    }
});