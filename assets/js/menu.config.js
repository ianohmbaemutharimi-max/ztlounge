/**
 * ============================================================
 * ZT Lounge Meru - Menu Configuration
 * Single Source of Truth for Menu Items
 * Version: 2.0.0 (Canonical Media Migration)
 *
 * MEDIA CONTRACT: entries reference media assets exclusively via
 * media_id (media_assets UUID). No image URL fallbacks â€” resolution
 * happens through window.MediaResolver (see MenuRepository).
 * ============================================================
 */

/**
 * Page key to UUID mapping for menu engine resolution.
 * menu-engine.js uses this to resolve data-page-key to Supabase page_id.
 */
window.pageKeyToId = Object.freeze({
    "restaurant-menu": "1ff74409-98f8-4ab6-a3b6-0741b19f2040"
});

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
            media_id: "06914e55-16d8-410a-aacc-712ff7169891",
            alt: "Signature Nyama Choma slow-grilled to perfection"
        },
        {
            id: "signature-pilau",
            name: "ZT Signature Pilau",
            description: "Aromatic basmati rice cooked with special spices and herbs.",
            price: "KES 650",
            media_id: "c611e8d6-dea2-4a74-86b2-dbb8b9ff5063",
            alt: "ZT Signature Pilau aromatic basmati rice"
        },
        {
            id: "beef-steak",
            name: "Premium Beef Steak",
            description: "Prime cuts grilled to your preference. Tender & juicy.",
            price: "KES 1,650",
            media_id: "8b6b9ce0-29c4-49f9-abb2-fd81c1c3e67b",
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
