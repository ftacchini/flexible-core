import { FlexibleEvent } from '../event';

/**
 * Default key generator: uses sourceIp from event
 */
function defaultKeyGenerator(event: FlexibleEvent): string {
    return (event as any).sourceIp || 'unknown';
}

/**
 * Default skip function: never skip rate limiting
 */
function defaultSkip(event: FlexibleEvent): boolean {
    return false;
}

/**
 * Configuration for rate limiting behavior.
 *
 * RateLimitConfig encapsulates all configuration options for rate limiting,
 * including request limits, time windows, and custom behavior functions.
 *
 * ## Usage
 *
 * ```typescript
 * // Create custom configuration
 * const config = new RateLimitConfig({
 *     max: 100,
 *     windowMs: 60000,
 *     message: 'Too many requests'
 * });
 *
 * // Use default configuration
 * const defaultConfig = RateLimitConfig.createDefault();
 * ```
 *
 * ## DI Container Setup
 *
 * ```typescript
 * import { RATE_LIMIT_TYPES, RateLimitConfig } from 'flexible-core';
 *
 * container.register(RATE_LIMIT_TYPES.CONFIG, {
 *     useValue: new RateLimitConfig({
 *         max: 100,
 *         windowMs: 60000
 *     })
 * });
 * ```
 */
export class RateLimitConfig {
    /**
     * Maximum number of requests allowed in the time window
     */
    public readonly max: number;

    /**
     * Time window in milliseconds
     */
    public readonly windowMs: number;

    /**
     * Key generator function for identifying clients.
     * Defaults to using sourceIp from event.
     */
    public readonly keyGenerator: (event: FlexibleEvent) => string;

    /**
     * Function to skip rate limiting for certain events.
     * Return true to skip rate limiting for the event.
     * Defaults to never skipping.
     */
    public readonly skip: (event: FlexibleEvent) => boolean;

    /**
     * Error message when rate limit is exceeded.
     */
    public readonly message: string;

    /**
     * Creates a new RateLimitConfig.
     *
     * @param config - Configuration options
     * @param config.max - Maximum requests allowed in the window (required)
     * @param config.windowMs - Time window in milliseconds (required)
     * @param config.keyGenerator - Custom key generator function (optional)
     * @param config.skip - Custom skip function (optional)
     * @param config.message - Custom error message (optional)
     */
    constructor(config: {
        max: number;
        windowMs: number;
        keyGenerator?: (event: FlexibleEvent) => string;
        skip?: (event: FlexibleEvent) => boolean;
        message?: string;
    }) {
        this.max = config.max;
        this.windowMs = config.windowMs;
        this.keyGenerator = config.keyGenerator || defaultKeyGenerator;
        this.skip = config.skip || defaultSkip;
        this.message = config.message || 'Too many requests, please try again later';
    }

    /**
     * Creates a default rate limit configuration.
     *
     * Default configuration:
     * - max: 100 requests
     * - windowMs: 60000ms (60 seconds)
     * - keyGenerator: Uses sourceIp from event
     * - skip: Never skips
     * - message: "Too many requests, please try again later"
     *
     * @returns A new RateLimitConfig with default values
     */
    public static createDefault(): RateLimitConfig {
        return new RateLimitConfig({
            max: 100,
            windowMs: 60000
        });
    }
}

/**
 * DI symbols for rate limiting components.
 *
 * These symbols are used to bind and resolve rate limiting components
 * in the dependency injection container.
 *
 * ## Usage
 *
 * ```typescript
 * import { RATE_LIMIT_TYPES, RateLimitConfig, MemoryRateLimitStore } from 'flexible-core';
 *
 * // Bind configuration
 * container.register(RATE_LIMIT_TYPES.CONFIG, {
 *     useValue: new RateLimitConfig({ max: 100, windowMs: 60000 })
 * });
 *
 * // Bind store
 * container.register(RATE_LIMIT_TYPES.STORE, {
 *     useClass: MemoryRateLimitStore
 * });
 * ```
 */
export const RATE_LIMIT_TYPES = {
    /**
     * Symbol for RateLimitConfig binding
     */
    CONFIG: Symbol('RateLimitConfig'),

    /**
     * Symbol for RateLimitStore binding
     */
    STORE: Symbol('RateLimitStore')
};
