/**
 * Thread-safe Property Manager
 * Handles concurrent access to Google Apps Script Properties Service
 * Prevents race conditions and data corruption
 */

namespace PropertyManager {
  
  // Lock mechanism using script properties
  const LOCK_PREFIX = 'LOCK_';
  const LOCK_TIMEOUT_MS = 5000; // 5 seconds
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 100;
  
  /**
   * Acquire a lock for a specific key
   */
  function acquireLock(key: string, timeout: number = LOCK_TIMEOUT_MS): boolean {
    const lockKey = `${LOCK_PREFIX}${key}`;
    const lockValue = Utilities.getUuid();
    const expirationTime = new Date().getTime() + timeout;
    
    try {
      const properties = PropertiesService.getScriptProperties();
      const currentLock = properties.getProperty(lockKey);
      
      if (currentLock) {
        // Check if lock is expired
        const lockData = Utils.parseJsonSafe<{expires: number; id: string}>(
          currentLock, 
          { expires: 0, id: '' }
        );
        
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
      const verifyLock = properties.getProperty(lockKey);
      if (verifyLock) {
        const verifyData = Utils.parseJsonSafe<{id: string}>(verifyLock, { id: '' });
        return verifyData.id === lockValue;
      }
      
      return false;
    } catch (error) {
      AppLogger.error('Failed to acquire lock', error);
      return false;
    }
  }
  
  /**
   * Release a lock
   */
  function releaseLock(key: string): void {
    const lockKey = `${LOCK_PREFIX}${key}`;
    try {
      PropertiesService.getScriptProperties().deleteProperty(lockKey);
    } catch (error) {
      AppLogger.warn('Failed to release lock', error);
    }
  }
  
  /**
   * Get property with thread safety
   */
  export function getProperty(key: string, service: 'script' | 'user' = 'script'): string | null {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      if (acquireLock(key)) {
        try {
          const properties = service === 'script' 
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
          
          return properties.getProperty(key);
        } finally {
          releaseLock(key);
        }
      }
      
      retries++;
      if (retries < MAX_RETRIES) {
        Utilities.sleep(RETRY_DELAY_MS * retries);
      }
    }
    
    // Fallback: read without lock if all retries failed
    AppLogger.warn(`Failed to acquire lock for property: ${key}, reading without lock`);
    const properties = service === 'script' 
      ? PropertiesService.getScriptProperties()
      : PropertiesService.getUserProperties();
    return properties.getProperty(key);
  }
  
  /**
   * Set property with thread safety
   */
  export function setProperty(key: string, value: string, service: 'script' | 'user' = 'script'): boolean {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      if (acquireLock(key)) {
        try {
          const properties = service === 'script' 
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
          
          properties.setProperty(key, value);
          return true;
        } catch (error) {
          AppLogger.error(`Failed to set property: ${key}`, error);
          return false;
        } finally {
          releaseLock(key);
        }
      }
      
      retries++;
      if (retries < MAX_RETRIES) {
        Utilities.sleep(RETRY_DELAY_MS * retries);
      }
    }
    
    AppLogger.error(`Failed to acquire lock for property: ${key} after ${MAX_RETRIES} retries`);
    return false;
  }
  
  /**
   * Delete property with thread safety
   */
  export function deleteProperty(key: string, service: 'script' | 'user' = 'script'): boolean {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      if (acquireLock(key)) {
        try {
          const properties = service === 'script' 
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
          
          properties.deleteProperty(key);
          return true;
        } catch (error) {
          AppLogger.error(`Failed to delete property: ${key}`, error);
          return false;
        } finally {
          releaseLock(key);
        }
      }
      
      retries++;
      if (retries < MAX_RETRIES) {
        Utilities.sleep(RETRY_DELAY_MS * retries);
      }
    }
    
    AppLogger.error(`Failed to acquire lock for property: ${key} after ${MAX_RETRIES} retries`);
    return false;
  }
  
  /**
   * Get all properties with thread safety
   */
  export function getAllProperties(service: 'script' | 'user' = 'script'): {[key: string]: string} {
    const lockKey = service === 'script' ? 'ALL_SCRIPT_PROPS' : 'ALL_USER_PROPS';
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      if (acquireLock(lockKey)) {
        try {
          const properties = service === 'script' 
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
          
          return properties.getProperties();
        } finally {
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
    const properties = service === 'script' 
      ? PropertiesService.getScriptProperties()
      : PropertiesService.getUserProperties();
    return properties.getProperties();
  }
  
  /**
   * Batch update properties with thread safety
   */
  export function setProperties(
    updates: {[key: string]: string}, 
    service: 'script' | 'user' = 'script'
  ): boolean {
    const lockKey = service === 'script' ? 'BATCH_SCRIPT_PROPS' : 'BATCH_USER_PROPS';
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      if (acquireLock(lockKey, LOCK_TIMEOUT_MS * 2)) { // Double timeout for batch operations
        try {
          const properties = service === 'script' 
            ? PropertiesService.getScriptProperties()
            : PropertiesService.getUserProperties();
          
          properties.setProperties(updates);
          return true;
        } catch (error) {
          AppLogger.error('Failed to batch update properties', error);
          return false;
        } finally {
          releaseLock(lockKey);
        }
      }
      
      retries++;
      if (retries < MAX_RETRIES) {
        Utilities.sleep(RETRY_DELAY_MS * retries);
      }
    }
    
    AppLogger.error(`Failed to acquire lock for batch update after ${MAX_RETRIES} retries`);
    return false;
  }
  
  /**
   * Clean up expired locks (maintenance function)
   */
  export function cleanupExpiredLocks(): void {
    try {
      const properties = PropertiesService.getScriptProperties();
      const allProps = properties.getProperties();
      const now = new Date().getTime();
      const keysToDelete: string[] = [];
      
      for (const key in allProps) {
        if (key.startsWith(LOCK_PREFIX)) {
          try {
            const lockData = JSON.parse(allProps[key] || '{}');
            if (lockData.expires < now) {
              keysToDelete.push(key);
            }
          } catch {
            // Invalid lock data, delete it
            keysToDelete.push(key);
          }
        }
      }
      
      keysToDelete.forEach(key => {
        try {
          properties.deleteProperty(key);
        } catch (error) {
          AppLogger.warn(`Failed to delete expired lock: ${key}`, error);
        }
      });
      
      if (keysToDelete.length > 0) {
        AppLogger.info(`Cleaned up ${keysToDelete.length} expired locks`);
      }
    } catch (error) {
      AppLogger.error('Failed to cleanup expired locks', error);
    }
  }
}