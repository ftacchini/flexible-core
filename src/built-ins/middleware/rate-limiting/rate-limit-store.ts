/**
 * Information about a client's rate limit status.
 */
export interface RateLimitInfo {
    /**
     * Number of requests made in the current window
     */
    count: number;

    /**
     * Timestamp when the current window started (milliseconds since epoch)
     */
    windowStart: number;

    /**
     * Timestamp when the window will reset (milliseconds since epoch)
     */
    resetTime: number;
}

/**
 * Interface for rate limit storage backends.
 *
 * RateLimitStore provides an abstraction for storing and retrieving
 * rate limit information. Implementations can use in-memory storage,
 * Redis, or other backends.
 */
export interface RateLimitStore {
    /**
     * Increments the request count for a client.
     *
     * @param key - Unique identifier for the client (e.g., IP address, user ID)
     * @param windowMs - Time window in milliseconds
     * @returns Current rate limit information
     */
    increment(key: string, windowMs: number): Promise<RateLimitInfo>;

    /**
     * Gets the current rate limit information for a client.
     *
     * @param key - Unique identifier for the client
     * @returns Current rate limit information, or null if no data exists
     */
    get(key: string): Promise<RateLimitInfo | null>;

    /**
     * Resets the rate limit for a client.
     *
     * @param key - Unique identifier for the client
     */
    reset(key: string): Promise<void>;

    /**
     * Cleans up expired entries.
     *
     * This should be called periodically to prevent memory leaks.
     */
    cleanup(): Promise<void>;
}

/**
 * In-memory implementation of RateLimitStore.
 *
 * MemoryRateLimitStore stores rate limit data in memory using a Map.
 * It includes automatic cleanup of expired entries to prevent memory leaks.
 *
 * ## Features
 *
 * - **Fast**: O(1) lookups and updates
 * - **Automatic cleanup**: Expired entries are removed periodically
 * - **Thread-safe**: Safe for concurrent access (single-threaded Node.js)
 *
 * ## Limitations
 *
 * - **Not distributed**: Data is not shared across multiple processes
 * - **Not persistent**: Data is lost on restart
 * - **Memory-bound**: All data stored in memory
 *
 * For distributed systems, use a Redis-based implementation instead.
 *
 * @example
 * ```typescript
 * // Create store with 1-minute cleanup interval
 * const store = new MemoryRateLimitStore(60000);
 *
 * // Increment request count
 * const info = await store.increment('client-123', 60000);
 * console.log(`Requests: ${info.count}`);
 *
 * // Check current status
 * const status = await store.get('client-123');
 * if (status && status.count > 100) {
 *     console.log('Rate limit exceeded');
 * }
 *
 * // Clean up when done
 * store.destroy();
 * ```
 */
export class MemoryRateLimitStore implements RateLimitStore {
    private store: Map<string, RateLimitInfo> = new Map();
    private cleanupInterval?: NodeJS.Timeout;

    /**
     * Creates a new MemoryRateLimitStore.
     *
     * @param cleanupIntervalMs - How often to clean up expired entries (default: 60000ms = 1 minute)
     */
    constructor(cleanupIntervalMs: number = 60000) {
        // Start automatic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);

        // Prevent the interval from keeping the process alive
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Increments the request count for a client.
     *
     * If the current window has expired, a new window is started.
     *
     * @param key - Unique identifier for the client
     * @param windowMs - Time window in milliseconds
     * @returns Current rate limit information
     */
    public async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
        const now = Date.now();
        const existing = this.store.get(key);

        // Check if we need to start a new window
        if (!existing || now >= existing.resetTime) {
            const info: RateLimitInfo = {
                count: 1,
                windowStart: now,
                resetTime: now + windowMs
            };
            this.store.set(key, info);
            return info;
        }

        // Increment count in current window
        existing.count++;
        return existing;
    }

    /**
     * Gets the current rate limit information for a client.
     *
     * @param key - Unique identifier for the client
     * @returns Current rate limit information, or null if no data exists or window expired
     */
    public async get(key: string): Promise<RateLimitInfo | null> {
        const info = this.store.get(key);
        if (!info) {
            return null;
        }

        // Check if window has expired
        const now = Date.now();
        if (now >= info.resetTime) {
            this.store.delete(key);
            return null;
        }

        return info;
    }

    /**
     * Resets the rate limit for a client.
     *
     * @param key - Unique identifier for the client
     */
    public async reset(key: string): Promise<void> {
        this.store.delete(key);
    }

    /**
     * Cleans up expired entries.
     *
     * This is called automatically by the cleanup interval, but can also
     * be called manually if needed.
     */
    public async cleanup(): Promise<void> {
        const now = Date.now();
        const keysToDelete: string[] = [];

        // Find expired entries
        for (const [key, info] of this.store.entries()) {
            if (now >= info.resetTime) {
                keysToDelete.push(key);
            }
        }

        // Delete expired entries
        for (const key of keysToDelete) {
            this.store.delete(key);
        }
    }

    /**
     * Gets the number of entries in the store.
     *
     * Useful for monitoring and debugging.
     *
     * @returns Number of entries
     */
    public size(): number {
        return this.store.size;
    }

    /**
     * Clears all entries from the store.
     *
     * Useful for testing.
     */
    public clear(): void {
        this.store.clear();
    }

    /**
     * Destroys the store and stops the cleanup interval.
     *
     * Call this when you're done with the store to prevent memory leaks.
     */
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.store.clear();
    }
}
