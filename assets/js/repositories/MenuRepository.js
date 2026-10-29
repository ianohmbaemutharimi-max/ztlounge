/**
 * ============================================================
 * ZT Lounge Meru - Menu Repository
 * Abstraction layer for menu content
 * Version: 2.1.0
 * ============================================================
 *
 * Public Interface:
 * - MenuRepository.getCategories()
 * - MenuRepository.getSignatureItems()
 * - MenuRepository.getItemsByCategory(categoryId)
 * - MenuRepository.getMenu()
 *
 * Data Source: Supabase (menu_categories + menu_items); media URLs resolved only through MediaResolver
 * ============================================================
 */

window.MenuRepository = (function() {
    'use strict';

    var itemRepo = null;
    var categoryRepo = null;

    /**
     * Map Supabase menu_items fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapItemToUI(item) {
        if (!item) return null;
        return {
            id: item.id,
            name: item.name || '',
            description: item.description || '',
            price: item.price || 0,
            image_url: null,
            media_id: item.media_id || null,
            alt_text: item.alt_text || '',
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_featured: item.is_featured || false,
            display_order: item.display_order || 0,
            type: item.type || 'item',
            category_id: item.category_id || '',
            category: item.category || '',
            page_id: item.page_id || ''
        };
    }

    /**
     * Map Supabase menu_categories fields to UI-expected fields
     * @param {Object} cat - Raw database category
     * @returns {Object} Mapped category
     */
    function mapCategoryToUI(cat) {
        if (!cat) return null;
        return {
            id: cat.id,
            name: cat.name || '',
            slug: cat.slug || '',
            description: cat.description || '',
            display_order: cat.display_order || 0,
            is_active: cat.is_active !== undefined ? cat.is_active : true
        };
    }

    /**
     * Resolve menu imagery through the canonical media_id -> media_assets.public_url gateway.
     * Rows with a media_id must resolve successfully; legacy URL columns are not used.
     */
    function resolveMedia(items) {
        var rows = items || [];
        var withMedia = rows.filter(function(item) { return !!item.media_id; });
        if (!withMedia.length) return Promise.resolve(rows);
        if (!window.MediaResolver || typeof window.MediaResolver.resolveCollection !== 'function') {
            return Promise.reject(new Error('MEDIA_RESOLVER_UNAVAILABLE'));
        }
        return window.MediaResolver.resolveCollection(withMedia).then(function() {
            return rows;
        });
    }

    function getItemRepo() {
        if (!itemRepo) {
            itemRepo = window.BaseRepository.create(
                window.SupabaseConfig.tables.menuItems,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return itemRepo;
    }

    function getCategoryRepo() {
        if (!categoryRepo) {
            categoryRepo = window.BaseRepository.create(
                window.SupabaseConfig.tables.menuCategories,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return categoryRepo;
    }

    /**
     * Get all menu categories (from menu_categories table)
     * @returns {Promise<Array>} Array of category objects
     */
    function getCategories() {
        return getCategoryRepo().getAll({
            eq: [{ column: 'is_active', value: true }],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapCategoryToUI);
            }
            return [];
        });
    }

    /**
     * Get signature collection items (is_featured = true)
     * @returns {Promise<Array>} Array of signature menu items
     */
    function getSignatureItems() {
        return getItemRepo().getAll({
            eq: [
                { column: 'is_featured', value: true },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return resolveMedia(data.map(mapItemToUI));
            }
            return resolveMedia([]);
        });
    }

    /**
     * Get menu items by category
     * @param {string} categoryId - Category identifier (uuid or slug)
     * @returns {Promise<Array>} Array of menu items
     */
    function getItemsByCategory(categoryId) {
        return getItemRepo().getAll({
            eq: [
                { column: 'type', value: 'item' },
                { column: 'category_id', value: categoryId },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return resolveMedia(data.map(mapItemToUI));
            }
            return resolveMedia([]);
        });
    }

    /**
     * Get full menu structure: categories with their items
     * @returns {Promise<Object>} { categories: [{ ...category, items: [...] }] }
     */
    function getMenu() {
        return getCategories().then(function(categories) {
            if (!categories || !categories.length) {
                return { categories: [] };
            }

            // Fetch all active items once
            return getItemRepo().getAll({
                eq: [{ column: 'is_active', value: true }],
                orderBy: 'display_order',
                ascending: true
            }).then(function(items) {
                var mappedItems = (items || []).map(mapItemToUI);

                return resolveMedia(mappedItems).then(function(resolvedItems) {
                // Group items by category_id
                var categoriesWithItems = categories.map(function(cat) {
                    var catItems = resolvedItems.filter(function(item) {
                        return item.category_id === cat.id;
                    });
                    return {
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        display_order: cat.display_order,
                        items: catItems
                    };
                });

                return { categories: categoriesWithItems };
                });
            });
        });
    }


    /** Get full menu structure for a specific page, scoped by page_id. */
    function getMenuForPage(pageId) {
        return getCategories().then(function(categories) {
            if (!categories || !categories.length) {
                return { categories: [], uncategorizedItems: [] };
            }
            return getItemRepo().getAll({
                select: '*',
                eq: [
                    { column: 'page_id', value: pageId },
                    { column: 'is_active', value: true }
                ],
                orderBy: 'display_order',
                ascending: true
            }).then(function(items) {
                var mappedItems = (items || []).map(mapItemToUI);
                return resolveMedia(mappedItems).then(function(resolvedItems) {
                    var categoriesWithItems = categories.map(function(cat) {
                        var catItems = resolvedItems.filter(function(item) {
                            return item.category_id === cat.id;
                        });
                        return {
                            id: cat.id,
                            name: cat.name,
                            slug: cat.slug,
                            description: cat.description,
                            display_order: cat.display_order,
                            items: catItems
                        };
                    });
                    var uncategorizedItems = resolvedItems.filter(function(item) {
                        return !item.category_id || item.category_id === '';
                    });
                    return {
                        categories: categoriesWithItems,
                        uncategorizedItems: uncategorizedItems
                    };
                });
            });
        });
    }
    return {
        getCategories: getCategories,
        getSignatureItems: getSignatureItems,
        getItemsByCategory: getItemsByCategory,
        getMenu: getMenu,
        getMenuForPage: getMenuForPage
    };
})();