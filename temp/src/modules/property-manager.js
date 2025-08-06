"use strict";
/**
 * Thread-safe Property Manager
 * Handles concurrent access to Google Apps Script Properties Service
 * Prevents race conditions and data corruption
 */
var PropertyManager;
(function (PropertyManager) {
    // Lock mechanism using script properties
    var LOCK_PREFIX = 'LOCK_';
    var LOCK_TIMEOUT_MS = 5000; // 5 seconds
    var MAX_RETRIES = 3;
    var RETRY_DELAY_MS = 100;
    /**
     * Acquire a lock for a specific key
     */
    function acquireLock(key, timeout) {
        if (timeout === void 0) { timeout = LOCK_TIMEOUT_MS; }
        var lockKey = "".concat(LOCK_PREFIX).concat(key);
        var lockValue = Utilities.getUuid();
        var expirationTime = new Date().getTime() + timeout;
        try {
            var properties = PropertiesService.getScriptProperties();
            var currentLock = properties.getProperty(lockKey);
            if (currentLock) {
                // Check if lock is expired
                var lockData = Utils.parseJsonSafe(currentLock, { expires: 0, id: '' });
                if (lockData.expires > new Date().getTime()) {
                    return false; // Lock is still valid
                }
            }
            // Try to acquire lock
            properties.setProperty(lockKey, JSON.stringify({
                expires: expirationTime,
                id: lockValue
            }));
            // Verify we got the lock (in case of race condition)
            Utilities.sleep(10); // Small delay to ensure write is complete
            var verifyLock = properties.getProperty(lockKey);
            if (verifyLock) {
                var verifyData = Utils.parseJsonSafe(verifyLock, { id: '' });
                return verifyData.id === lockValue;
            }
            return false;
        }
        catch (error) {
            AppLogger.error('Failed to acquire lock', error);
            return false;
        }
    }
    /**
     * Release a lock
     */
    function releaseLock(key) {
        var lockKey = "".concat(LOCK_PREFIX).concat(key);
        try {
            PropertiesService.getScriptProperties().deleteProperty(lockKey);
        }
        catch (error) {
            AppLogger.warn('Failed to release lock', error);
        }
    }
    /**
     * Get property with thread safety
     */
    function getProperty(key, service) {
        if (service === void 0) { service = 'script'; }
        var retries = 0;
        while (retries < MAX_RETRIES) {
            if (acquireLock(key)) {
                try {
                    var properties_1 = service === 'script'
                        ? PropertiesService.getScriptProperties()
                        : PropertiesService.getUserProperties();
                    return properties_1.getProperty(key);
                }
                finally {
                    releaseLock(key);
                }
            }
            retries++;
            if (retries < MAX_RETRIES) {
                Utilities.sleep(RETRY_DELAY_MS * retries);
            }
        }
        // Fallback: read without lock if all retries failed
        AppLogger.warn("Failed to acquire lock for property: ".concat(key, ", reading without lock"));
        var properties = service === 'script'
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
        return properties.getProperty(key);
    }
    PropertyManager.getProperty = getProperty;
    /**
     * Set property with thread safety
     */
    function setProperty(key, value, service) {
        if (service === void 0) { service = 'script'; }
        var retries = 0;
        while (retries < MAX_RETRIES) {
            if (acquireLock(key)) {
                try {
                    var properties = service === 'script'
                        ? PropertiesService.getScriptProperties()
                        : PropertiesService.getUserProperties();
                    properties.setProperty(key, value);
                    return true;
                }
                catch (error) {
                    AppLogger.error("Failed to set property: ".concat(key), error);
                    return false;
                }
                finally {
                    releaseLock(key);
                }
            }
            retries++;
            if (retries < MAX_RETRIES) {
                Utilities.sleep(RETRY_DELAY_MS * retries);
            }
        }
        AppLogger.error("Failed to acquire lock for property: ".concat(key, " after ").concat(MAX_RETRIES, " retries"));
        return false;
    }
    PropertyManager.setProperty = setProperty;
    /**
     * Delete property with thread safety
     */
    function deleteProperty(key, service) {
        if (service === void 0) { service = 'script'; }
        var retries = 0;
        while (retries < MAX_RETRIES) {
            if (acquireLock(key)) {
                try {
                    var properties = service === 'script'
                        ? PropertiesService.getScriptProperties()
                        : PropertiesService.getUserProperties();
                    properties.deleteProperty(key);
                    return true;
                }
                catch (error) {
                    AppLogger.error("Failed to delete property: ".concat(key), error);
                    return false;
                }
                finally {
                    releaseLock(key);
                }
            }
            retries++;
            if (retries < MAX_RETRIES) {
                Utilities.sleep(RETRY_DELAY_MS * retries);
            }
        }
        AppLogger.error("Failed to acquire lock for property: ".concat(key, " after ").concat(MAX_RETRIES, " retries"));
        return false;
    }
    PropertyManager.deleteProperty = deleteProperty;
    /**
     * Get all properties with thread safety
     */
    function getAllProperties(service) {
        if (service === void 0) { service = 'script'; }
        var lockKey = service === 'script' ? 'ALL_SCRIPT_PROPS' : 'ALL_USER_PROPS';
        var retries = 0;
        while (retries < MAX_RETRIES) {
            if (acquireLock(lockKey)) {
                try {
                    var properties_2 = service === 'script'
                        ? PropertiesService.getScriptProperties()
                        : PropertiesService.getUserProperties();
                    return properties_2.getProperties();
                }
                finally {
                    releaseLock(lockKey);
                }
            }
            retries++;
            if (retries < MAX_RETRIES) {
                Utilities.sleep(RETRY_DELAY_MS * retries);
            }
        }
        // Fallback: read without lock if all retries failed
        AppLogger.warn('Failed to acquire lock for all properties, reading without lock');
        var properties = service === 'script'
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
        return properties.getProperties();
    }
    PropertyManager.getAllProperties = getAllProperties;
    /**
     * Batch update properties with thread safety
     */
    function setProperties(updates, service) {
        if (service === void 0) { service = 'script'; }
        var lockKey = service === 'script' ? 'BATCH_SCRIPT_PROPS' : 'BATCH_USER_PROPS';
        var retries = 0;
        while (retries < MAX_RETRIES) {
            if (acquireLock(lockKey, LOCK_TIMEOUT_MS * 2)) { // Double timeout for batch operations
                try {
                    var properties = service === 'script'
                        ? PropertiesService.getScriptProperties()
                        : PropertiesService.getUserProperties();
                    properties.setProperties(updates);
                    return true;
                }
                catch (error) {
                    AppLogger.error('Failed to batch update properties', error);
                    return false;
                }
                finally {
                    releaseLock(lockKey);
                }
            }
            retries++;
            if (retries < MAX_RETRIES) {
                Utilities.sleep(RETRY_DELAY_MS * retries);
            }
        }
        AppLogger.error("Failed to acquire lock for batch update after ".concat(MAX_RETRIES, " retries"));
        return false;
    }
    PropertyManager.setProperties = setProperties;
    /**
     * Clean up expired locks (maintenance function)
     */
    function cleanupExpiredLocks() {
        try {
            var properties_3 = PropertiesService.getScriptProperties();
            var allProps = properties_3.getProperties();
            var now = new Date().getTime();
            var keysToDelete = [];
            for (var key in allProps) {
                if (key.startsWith(LOCK_PREFIX)) {
                    try {
                        var lockData = JSON.parse(allProps[key] || '{}');
                        if (lockData.expires < now) {
                            keysToDelete.push(key);
                        }
                    }
                    catch (_a) {
                        // Invalid lock data, delete it
                        keysToDelete.push(key);
                    }
                }
            }
            keysToDelete.forEach(function (key) {
                try {
                    properties_3.deleteProperty(key);
                }
                catch (error) {
                    AppLogger.warn("Failed to delete expired lock: ".concat(key), error);
                }
            });
            if (keysToDelete.length > 0) {
                AppLogger.info("Cleaned up ".concat(keysToDelete.length, " expired locks"));
            }
        }
        catch (error) {
            AppLogger.error('Failed to cleanup expired locks', error);
        }
    }
    PropertyManager.cleanupExpiredLocks = cleanupExpiredLocks;
})(PropertyManager || (PropertyManager = {}));
//# sourceMappingURL=property-manager.js.map