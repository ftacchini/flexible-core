import { injectable } from 'inversify';
import { FlexibleEvent } from '../event';
import { RateLimitStore, MemoryRateLimitStore } from './rate-limit-store';
import { SecurityError, SecurityErrorCodes } from './security-error';

/**
 * Middleware for rate limiting requests.
 *
 * RateLimitMiddleware tracks request counts per client within time windows
 * and rejects requests that exceed the configured limits.
 *
 * ## Usage with @BeforeExecution
 *
 * ```typescript
 * import { RateLimitMiddleware } from 'flexible-core';
 * import { Controller, Route, BeforeExecution, Param } from 'flexible-decorators';
 *
 * @Controller()
 * export class ApiController {
 *     @BeforeExecution(RateLimitMiddleware, 'check', {
 *         config: { max: 100, windowMs: 60000 }
 *     })
 *     @Route(HttpGet)
 *     public async getData(@Param(EventData) event: FlexibleEvent) {
 *         return { data: 'Hello' };
 *     }
 * }
 * ```
 *
 * ## Configuration
 *
 * The middleware is configured via the `config` property in @BeforeExecution:
 * - `max`: Maximum requests allowed in the window (required)
 * - `windowMs`: Time window in milliseconds (required)
 * - `keyGenerator`: Function to generate rate limit key from event (optional)
 * - `store`: Custom RateLimitStore implementation (optional)
 * - `skip`: Function to skip rate limiting for certain events (optional)
 * - `message`: Custom error message (optional)
 */
@injectable()
export class RateLimitMiddleware {
    /**
     * Maximum number of requests allowed in the time window
     */
    public max: number = 100;

    /**
     * Time window in milliseconds
     */
    public windowMs: number = 60000;

    /**
     * Custom key generator function
     */
    public keyGenerator?: (event: FlexibleEvent) => string;

    /**
     * Custom rate limit store
     */
    public store?: RateLimitStore;

    /**
     * Function to skip rate limiting for certain events
     */
    public skip?: (event: FlexibleEvent) => boolean;

    /**
     * Custom error message
     */
    public message?: string;

    /**
     * Checks rate limit for the current request.
     *
     * This method is called by the @BeforeExecution decorator.
     * It uses the @Param(EventData) decorator to receive the event.
     *
     * @param event - The event to check (injected via @Param(EventData))
     * @throws SecurityError if rate limit is exceeded
     */
    public async check(event: FlexibleEvent): Promise<void> {
        // Check if we should skip rate limiting
        if (this.skip && this.skip(event)) {
            return;
        }

        // Get or create store
        const store = this.store || new MemoryRateLimitStore();

        // Generate key for this client
        const keyGen = this.keyGenerator || this.defaultKeyGenerator;
        const key = keyGen(event);

        // Increment request count
        const info = await store.increment(key, this.windowMs);

        // Calculate remaining requests
        const remaining = Math.max(0, this.max - info.count);

        // Check if limit exceeded
        if (info.count > this.max) {
            const resetTimeSeconds = Math.ceil(info.resetTime / 1000);
            const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);

            throw new SecurityError(
                this.message || 'Too many requests, please try again later',
                SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                429,
                {
                    limit: this.max,
                    current: info.count,
                    remaining: 0,
                    resetTime: resetTimeSeconds,
                    retryAfter,
                    key: key.substring(0, 20)
                }
            );
        }
    }

    /**
     * Default key generator: uses sourceIp from event
     */
    private defaultKeyGenerator(event: FlexibleEvent): string {
        return (event as any).sourceIp || 'unknown';
    }
}
