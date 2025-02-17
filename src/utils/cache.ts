import { CommandResult } from '../types/index.js';
import { Logger } from './logger.js';

interface CacheEntry {
  result: CommandResult;
  timestamp: number;
}

export class CommandCache {
  private static instance: CommandCache;
  private cache: Map<string, CacheEntry>;
  private logger: Logger;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
    this.logger = Logger.getInstance();
  }

  static getInstance(): CommandCache {
    if (!CommandCache.instance) {
      CommandCache.instance = new CommandCache();
    }
    return CommandCache.instance;
  }

  get(key: string, ttl?: number): CommandResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > (ttl || this.TTL)) {
      this.logger.debug('Cache entry expired', { key, age });
      this.cache.delete(key);
      return null;
    }

    this.logger.debug('Retrieved result from cache', { key });
    return entry.result;
  }

  set(key: string, result: CommandResult): void {
    this.logger.debug('Setting cache', { key });
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.logger.debug('Starting cache cleanup schedule', { interval: this.TTL });
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.TTL);

    process.on('beforeExit', () => {
      this.stopCleanup();
    });
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      this.logger.debug('Stopping cache cleanup schedule');
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  clear(): void {
    this.logger.debug('Clearing all cache');
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Cleaned expired cache entries', { 
        entriesRemoved: cleaned,
        entriesRemaining: this.cache.size
      });
    }
  }
} 