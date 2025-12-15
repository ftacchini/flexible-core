import { injectable, inject } from 'tsyringe';
import { FlexibleEvent } from '../event';
import { RateLimitStore, MemoryRateLimitStore } from './rate-limit-store';
import { RateLimitConfig, RATE_LIMIT_TYPES } from './rate-limit-config';
import { SecurityError, SecurityErrorCodes } from './security-error';

/**
 * Middleware for rate limiting requests.
 *
 * RateLimitMiddleware tracks request counts per client within time windows
 * and rejects requests that exceed the configured limits.
 *
 * ## Usage with DI Container (Recommended)
 *
 * ```typescript
 * import { RATE_LIMIT_TYPES, RateLimitConfig, RateLimitMiddleware } from 'flexible-core';
 * import { Controller, Route, BeforeExecution, Param } from 'flexible-decorators';
 *
 * // Configure in DI container
 * container.register(RATE_LIMIT_TYPES.CONFIG, {
 *     useValue: new RateLimitConfig({
 *         max: 100,
 *         windowMs: 60000,
 *         message: 'Too many requests'
 *     })
 * });
 *
 * @Controller()
 * export class ApiController {
 *     @BeforeExecution(RateLimitMiddleware, 'check')
 *     @Route(HttpGet)
 *     public async getData(@Param(EventData) event: FlexibleEvent) {
 *         return { data: 'Hello' };
 *     }
 * }
 * ```
 *
 * ## Multiple Rate Limiters
 *
 * You can create multiple rate limiter instances with different configurations
 * using named bindings:
 *
 * ```typescript
 * // Strict rate limit for sensitive endpoints
 * container.register('strictRateLimit', {
 *     useValue: new RateLimitConfig({ max: 10, windowMs: 60000 })
 * });
 *
 * // Lenient rate limit for public endpoints
 * container.register('lenientRateLimit', {
 *     useValue: new RateLimitConfig({ max: 1000, windowMs: 60000 })
 * });
 * ```
 *
 * ## Custom Store
 *
 * You can provide a custom store implementation (e.g., Redis):
 *
 * ```typescript
 * container.register(RATE_LIMIT_TYPES.STORE, {
 *     useClass: RedisRateLimitStore
 * });
 * ```
 *
 * ## Migration from Old Pattern
 *
 * Old pattern (deprecated):
 * ```typescript
 * @BeforeExecution(RateLimitMiddleware, 'check', {
 *     config: { max: 100, windowMs: 60000 }
 * })
 * ```
 *
 * New pattern (recommended):
 * ```typescript
 * // Configure in DI container first
 * container.register(RATE_LIMIT_TYPES.CONFIG, {
 *     useValue: new RateLimitConfig({ max: 100, windowMs: 60000 })
 * });
 *
 * // Then use without config in decorator
 * @BeforeExecution(RateLimitMiddleware, 'check')
 * ```
 */
@injectable()
export class RateLimitMiddleware {
    private readonly config: RateLimitConfig;
    private readonly store: RateLimitStore;

    /**
     * Creates a new RateLimitMiddleware instance.
     *
     * Configuration and store are injected via the DI container.
     * If not provided, default values are used.
     *
     * @param config - Rate limit configuration (injected from DI container)
     * @param store - Rate limit store (injected from DI container)
     */
    constructor(
        @inject(RATE_LIMIT_TYPES.CONFIG) config?: RateLimitConfig,
        @inject(RATE_LIMIT_TYPES.STORE) store?: RateLimitStore
    ) {
        this.config = config || RateLimitConfig.createDefault();
        this.store = store || new MemoryRateLimitStore();
    }

    /**
     * Checks rate limit for the current request.
     *
     * This method is called by the @BeforeExecution decorator.
     * When using with @BeforeExecution, the event parameter must be decorated
     * with @Param(EventData) in the calling context.
     *
     * @param event - The event to check
     * @throws SecurityError if rate limit is exceeded
     */
    public async check(event: FlexibleEvent): Promise<void> {
        // Check if we should skip rate limiting
        if (this.config.skip(event)) {
            return;
        }

        // Generate key for this client
        const key = this.config.keyGenerator(event);

        // Increment request count
        const info = await this.store.increment(key, this.config.windowMs);

        // Check if limit exceeded
        if (info.count > this.config.max) {
            const resetTimeSeconds = Math.ceil(info.resetTime / 1000);
            const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);

            throw new SecurityError(
                this.config.message,
                SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                429,
                {
                    limit: this.config.max,
                    current: info.count,
                    remaining: 0,
                    resetTime: resetTimeSeconds,
                    retryAfter,
                    key: key.substring(0, 20)
                }
            );
        }
    }
}
