// src/services/cache.js
// Simple in-memory cache utility

const cache = {
  data: new Map(),
  timestamps: new Map(),
  ttl: 5 * 60 * 1000, // 5 minutes default

  get(key, allowStale = false) {
    if (this.data.has(key)) {
      const age = Date.now() - (this.timestamps.get(key) || 0);
      if (allowStale || age < this.ttl) {
        return this.data.get(key);
      }
      // Clean up expired entry
      this.data.delete(key);
      this.timestamps.delete(key);
    }
    return null;
  },

  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },

  clear() {
    this.data.clear();
    this.timestamps.clear();
  }
};

export function getCachedData(key, allowStale = false) {
  return cache.get(key, allowStale);
}

export function cacheData(key, data) {
  cache.set(key, data);
}

export function clearCache() {
  cache.clear();
}

export default cache;