/**
 * ============================================================
 * ZT Lounge Meru - Business Repository
 * Abstraction layer for business settings
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - BusinessRepository.getAll()
 * - BusinessRepository.getSettings()
 * - BusinessRepository.getBusinessInfo()
 * - BusinessRepository.updateSettings() (admin-ready)
 * 
 * Data Source: Supabase (business_settings table) with local config fallback
 * ============================================================
 */

window.BusinessRepository = (function() {
    'use strict';

    var repo = null;
    var cachedData = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * Returns canonical database field names with camelCase compatibility fallbacks
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapToUI(item) {
        if (!item) return null;
        // Return canonical database field names (snake_case) with camelCase fallbacks
        return {
            id: item.id,
            business_name: item.business_name || item.businessName || '',
            tagline: item.tagline || '',
            description: item.description || '',
            email: item.email || '',
            phone: item.phone || '',
            phoneRaw: (item.phone || '').replace(/\D/g, ''),
            address: item.address || '',
            city: item.city || '',
            country: item.country || '',
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            opening_hours: item.opening_hours || item.hours || {},
            logo_url: item.logo_url || item.logo || '',
            whatsapp: item.whatsapp || '',
            facebook: item.facebook || '',
            instagram: item.instagram || '',
            twitter: item.twitter || '',
            youtube: item.youtube || '',
            google_maps_url: item.google_maps_url || ''
        };
    }

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.businessSettings ? config.tables.businessSettings : 'business_settings';
            repo = window.BaseRepository.create(
                tableName,
                function() {
                    // Fallback to local config
                    var localConfig = window.BusinessConfig || {};
                    return [localConfig];
                },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get all business settings (single row)
     * @returns {Promise<Object>} Business settings object
     */
    function getAll() {
        // Return cached data if available
        if (cachedData) {
            return Promise.resolve(cachedData);
        }

        return getRepo().getAll({
            limit: 1
        }).then(function(data) {
            if (data && data.length > 0) {
                cachedData = mapToUI(data[0]);
                // Add backwards compatible camelCase aliases
                cachedData.businessName = cachedData.business_name;
                cachedData.hours = cachedData.opening_hours;
                cachedData.logo = cachedData.logo_url;
                return cachedData;
            }
            // Fallback to local config
            var config = window.BusinessConfig || {};
            cachedData = {
                id: config.id || '1',
                business_name: config.businessName || 'ZT Lounge Meru',
                businessName: config.businessName || 'ZT Lounge Meru',  // Backwards compatibility
                tagline: config.tagline || '',
                description: config.description || '',
                email: config.email || 'ztloungemeru@gmail.com',
                phone: config.phone || '+254 143 542 601',
                phoneRaw: '254143542601',
                address: config.address && config.address.full || 'Opposite Ezri Hotel, Milimani, Meru, Kenya',
                city: config.address && config.address.city || 'Meru',
                country: config.address && config.address.country || 'Kenya',
                latitude: config.latitude || 0.0476,
                longitude: config.longitude || 37.6822,
                opening_hours: config.hours || {},
                hours: config.hours || {}  // Backwards compatibility
            };
            return cachedData;
        }).catch(function(error) {
            console.warn('[BusinessRepository] Supabase query failed, using fallback:', error.message);
            // Fallback to local config
            var config = window.BusinessConfig || {};
            cachedData = {
                id: config.id || '1',
                business_name: config.businessName || 'ZT Lounge Meru',
                businessName: config.businessName || 'ZT Lounge Meru',  // Backwards compatibility
                tagline: config.tagline || '',
                description: config.description || '',
                email: config.email || 'ztloungemeru@gmail.com',
                phone: config.phone || '+254 143 542 601',
                phoneRaw: '254143542601',
                address: config.address && config.address.full || 'Opposite Ezri Hotel, Milimani, Meru, Kenya',
                city: config.address && config.address.city || 'Meru',
                country: config.address && config.address.country || 'Kenya',
                latitude: config.latitude || 0.0476,
                longitude: config.longitude || 37.6822,
                opening_hours: config.hours || {},
                hours: config.hours || {}  // Backwards compatibility
            };
            return cachedData;
        });
    }

    /**
     * Get business settings (alias for getAll)
     * @returns {Promise<Object>} Business settings object
     */
    function getSettings() {
        return getAll();
    }

    /**
     * Get business contact information
     * @returns {Promise<Object>} Contact info with phone, email, address
     */
    function getBusinessInfo() {
        return getAll().then(function(settings) {
            if (!settings) return null;
            var config = window.BusinessConfig || {};
            return {
                businessName: settings.businessName || config.businessName,
                phone: settings.phone || config.phone,
                phoneRaw: settings.phoneRaw || config.phoneRaw,
                email: settings.email || config.email,
                address: settings.address || (config.address && config.address.full),
                city: settings.city || (config.address && config.address.city),
                country: settings.country || (config.address && config.address.country),
                hours: settings.hours || config.hours,
                social: config.social
            };
        });
    }

    /**
     * Update business settings (admin-ready)
     * @param {string} id - Business settings ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Updated settings
     */
    function updateSettings(id, data) {
        if (!window.supabaseClient) {
            return Promise.reject(new Error('Supabase client not initialized'));
        }
        
        return window.supabaseClient
            .from('business_settings')
            .update(data)
            .eq('id', id)
            .select()
            .single()
            .then(function(result) {
                if (result.error) throw result.error;
                cachedData = null; // Clear cache
                return mapToUI(result.data);
            });
    }

    /**
     * Get business settings (for BusinessService compatibility)
     * @returns {Promise<Object>} Business settings object
     */
    function getBusiness() {
        return getAll();
    }

    /**
     * Get contact information (for BusinessService compatibility)
     * @returns {Promise<Object>} Contact info with phone, email, address
     */
    function getContact() {
        return getAll().then(function(settings) {
            if (!settings) return null;
            var config = window.BusinessConfig || {};
            return {
                phone: settings.phone,
                phoneRaw: settings.phoneRaw,
                email: settings.email,
                address: settings.address,
                hours: settings.hours,
                social: {
                    facebook: settings.facebook || config.social && config.social.facebook || '',
                    instagram: settings.instagram || config.social && config.social.instagram || '',
                    twitter: settings.twitter || config.social && config.social.twitter || '',
                    youtube: settings.youtube || config.social && config.social.youtube || '',
                    whatsapp: settings.whatsapp || config.social && config.social.whatsapp || ''
                }
            };
        });
    }

    return {
        getAll: getAll,
        getSettings: getSettings,
        getBusiness: getBusiness,
        getContact: getContact,
        getBusinessInfo: getBusinessInfo,
        updateSettings: updateSettings
    };
})();
