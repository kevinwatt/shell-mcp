import { CommandResult } from '../types/index.js';

interface CacheEntry {
  result: CommandResult;
  timestamp: number;
  ttl: number;
}

export class CommandCache {
  private static instance: CommandCache;
  private cache: Map<string, CacheEntry>;
  private readonly defaultTTL = 60 * 1000; // 1 分鐘

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CommandCache {
    if (!CommandCache.instance) {
      CommandCache.instance = new CommandCache();
    }
    return CommandCache.instance;
  }

  private generateKey(command: string, args: string[]): string {
    return `${command}:${args.join(':')}`;
  }

  set(command: string, args: string[], result: CommandResult, ttl = this.defaultTTL): void {
    const key = this.generateKey(command, args);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  get(command: string, args: string[]): CommandResult | null {
    const key = this.generateKey(command, args);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  clear(): void {
    this.cache.clear();
  }

  // 定期清理過期的快取
  startCleanup(interval = 5 * 60 * 1000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, interval);
  }
} 