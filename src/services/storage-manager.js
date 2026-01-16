/**
 * Storage Manager - Abstraction layer for chrome.storage
 * Handles both local and sync storage with automatic migration
 *
 * CHROME SYNC BEHAVIOR:
 * - Uses user's Google account (must be signed into Chrome)
 * - No external servers involved (Chrome handles sync)
 * - 100 KB total quota limit
 * - 8 KB per item limit
 * - Max 1,800 writes per hour
 * - Syncs across all Chrome instances with same account
 *
 * WHAT GETS SYNCED:
 * - Filter rules (filterData)
 * - Settings (options)
 * - UI theme
 *
 * WHAT DOES NOT GET SYNCED:
 * - UI password (uiPass) - security
 * - Logs or analytics
 * - Runtime state
 */

(function() {
  'use strict';

  // Chrome sync quota constants
  const QUOTA_BYTES = 102400;           // 100 KB total
  const QUOTA_BYTES_PER_ITEM = 8192;    // 8 KB per item
  const MAX_WRITES_PER_MIN = 120;
  const MAX_WRITES_PER_HOUR = 1800;

  // Debounce settings
  const WRITE_DEBOUNCE_MS = 5000;       // 5 seconds

  class StorageManager {
    constructor() {
      this.syncEnabled = false;
      this.deviceId = null;
      this.writeQueue = null;
      this.changeListeners = [];
      this.quotaExceededCallback = null;
      this.initialized = false;
    }

    /**
     * Initialize storage manager
     * Checks if sync is enabled and loads device ID
     */
    async init() {
      if (this.initialized) return;

      const metadata = await this.getLocal('syncMetadata');
      if (metadata) {
        this.syncEnabled = metadata.syncEnabled || false;
        this.deviceId = metadata.deviceId || this.generateDeviceId();
      } else {
        this.deviceId = this.generateDeviceId();
        await this.saveMetadata();
      }

      this.initialized = true;
    }

    /**
     * Generate unique device ID
     */
    generateDeviceId() {
      return 'device-' + crypto.randomUUID();
    }

    /**
     * Get configuration (from sync or local)
     * @returns {Promise<Object>} Configuration object
     */
    async getConfig() {
      await this.init();

      if (this.syncEnabled) {
        // Read from chrome.storage.sync
        const data = await chrome.storage.sync.get('syncConfig');
        if (data.syncConfig) {
          // Restore uiPass from local storage
          const localData = await chrome.storage.local.get('storageData');
          const config = data.syncConfig.data;
          if (localData.storageData && localData.storageData.uiPass) {
            config.uiPass = localData.storageData.uiPass;
          }
          return config;
        }
      }

      // Fallback to local storage
      const data = await chrome.storage.local.get('storageData');
      return data.storageData || this.getDefaultConfig();
    }

    /**
     * Set configuration (to sync or local)
     * @param {Object} config - Configuration object
     */
    async setConfig(config) {
      await this.init();

      if (this.syncEnabled) {
        // Debounce writes to sync storage
        this.debouncedWrite(config);
      } else {
        // Write immediately to local
        await chrome.storage.local.set({ storageData: config });
      }
    }

    /**
     * Debounced write to sync storage
     * Prevents hitting Chrome's write rate limits
     */
    debouncedWrite(config) {
      // Clear existing queue
      if (this.writeQueue) {
        clearTimeout(this.writeQueue);
      }

      // Queue new write
      this.writeQueue = setTimeout(async () => {
        await this.writeSyncConfig(config);
        this.writeQueue = null;
      }, WRITE_DEBOUNCE_MS);
    }

    /**
     * Write config to sync storage
     */
    async writeSyncConfig(config) {
      // Remove sensitive data before syncing
      const sanitized = this.sanitizeConfig(config);

      const syncData = {
        version: '1.0.0',
        updatedAt: Date.now(),
        deviceId: this.deviceId,
        data: sanitized
      };

      try {
        // Check quota before writing
        const quotaUsed = this.estimateQuota(syncData);
        if (quotaUsed > QUOTA_BYTES) {
          console.error('Sync quota exceeded:', quotaUsed, 'bytes');
          if (this.quotaExceededCallback) {
            this.quotaExceededCallback();
          }
          return;
        }

        // Write to sync
        await chrome.storage.sync.set({ syncConfig: syncData });

        // Also keep local backup (with password)
        await chrome.storage.local.set({ storageData: config });

        // Update metadata
        await this.saveMetadata({ lastSyncAt: Date.now() });

      } catch (error) {
        console.error('Sync write failed:', error);
        // Fallback to local
        await chrome.storage.local.set({ storageData: config });
      }
    }

    /**
     * Remove sensitive data before syncing
     */
    sanitizeConfig(config) {
      const sanitized = JSON.parse(JSON.stringify(config));

      // Remove password (keep local only)
      delete sanitized.uiPass;

      return sanitized;
    }

    /**
     * Estimate quota usage
     */
    estimateQuota(data) {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    }

    /**
     * Enable sync and migrate data
     */
    async enableSync() {
      await this.init();

      // 1. Get current local config
      const localData = await chrome.storage.local.get('storageData');
      const config = localData.storageData;

      // 2. Check if sync already has data
      const syncData = await chrome.storage.sync.get('syncConfig');

      if (syncData.syncConfig) {
        // Sync already has data - ask user which to keep
        // Restore uiPass to syncConfig for comparison
        const syncConfig = syncData.syncConfig.data;
        if (config && config.uiPass) {
          syncConfig.uiPass = config.uiPass;
        }

        return {
          needsResolution: true,
          localConfig: config,
          syncConfig: syncConfig
        };
      }

      // 3. Upload local to sync
      this.syncEnabled = true;
      await this.setConfig(config);
      await this.saveMetadata({ syncEnabled: true });

      return { success: true };
    }

    /**
     * Disable sync and migrate back to local
     */
    async disableSync() {
      await this.init();

      // 1. Get current sync config
      const config = await this.getConfig();

      // 2. Write to local
      await chrome.storage.local.set({ storageData: config });

      // 3. Disable sync
      this.syncEnabled = false;
      await this.saveMetadata({ syncEnabled: false });

      // 4. Clear sync storage (optional)
      await chrome.storage.sync.remove('syncConfig');

      return { success: true };
    }

    /**
     * Listen for config changes
     */
    onConfigChange(callback) {
      this.changeListeners.push(callback);

      // Set up Chrome storage listeners (only once)
      if (this.changeListeners.length === 1) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'sync' && changes.syncConfig) {
            // Sync config changed remotely
            const newConfig = changes.syncConfig.newValue?.data;
            if (newConfig) {
              this.changeListeners.forEach(cb => cb(newConfig, 'sync'));
            }
          } else if (areaName === 'local' && changes.storageData) {
            // Local config changed
            const newConfig = changes.storageData.newValue;
            if (newConfig && !this.syncEnabled) {
              this.changeListeners.forEach(cb => cb(newConfig, 'local'));
            }
          }
        });
      }
    }

    /**
     * Set callback for quota exceeded
     */
    onQuotaExceeded(callback) {
      this.quotaExceededCallback = callback;
    }

    /**
     * Get sync status
     */
    async getSyncStatus() {
      await this.init();

      const metadata = await this.getLocal('syncMetadata');
      let quotaUsed = 0;

      if (this.syncEnabled) {
        const syncData = await chrome.storage.sync.get('syncConfig');
        if (syncData.syncConfig) {
          quotaUsed = this.estimateQuota(syncData.syncConfig);
        }
      }

      return {
        enabled: this.syncEnabled,
        deviceId: this.deviceId,
        lastSyncAt: metadata?.lastSyncAt,
        quotaUsed: quotaUsed,
        quotaTotal: QUOTA_BYTES,
        quotaPercent: Math.round((quotaUsed / QUOTA_BYTES) * 100)
      };
    }

    /**
     * Save sync metadata (local only)
     */
    async saveMetadata(updates = {}) {
      const current = await this.getLocal('syncMetadata') || {};
      const metadata = {
        ...current,
        syncEnabled: this.syncEnabled,
        deviceId: this.deviceId,
        ...updates
      };
      await chrome.storage.local.set({ syncMetadata: metadata });
    }

    /**
     * Get from local storage
     */
    async getLocal(key) {
      const data = await chrome.storage.local.get(key);
      return data[key];
    }

    /**
     * Get default config
     */
    getDefaultConfig() {
      return {
        filterData: {
          javascript: "(video, objectType) => { return false; }",
          videoId: [],
          channelId: [],
          channelName: [],
          comment: [],
          title: [],
          vidLength: [NaN, NaN]
        },
        options: {},
        uiTheme: 'light',
        uiPass: ''
      };
    }
  }

  // Create singleton instance and expose globally
  // Use globalThis to work in both browser and service worker contexts
  const global = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this);
  global.storageManager = new StorageManager();

})();
