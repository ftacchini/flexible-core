import { injectable, inject } from 'tsyringe';
import { FlexibleLogger } from '../logging/flexible-logger';

/**
 * Configuration for TimeoutMiddleware.
 */
export interface TimeoutMiddlewareConfig {
    /**
     * Timeout duration in milliseconds.
     * Must be a positive number.
     */
    timeout: number;
}

/**
 * Dependency injection types for TimeoutMiddleware.
 */
export const TIMEOUT_MIDDLEWARE_TYPES = {
    CONFIG: Symbol.for('TimeoutMiddlewareConfig'),
    LOGGER: Symbol.for('FlexibleLogger')
} as const;

/**
 * Context binnacle keys used by TimeoutMiddleware.
 */
export const TIMEOUT_CONTEXT_KEYS = {
    START_TIME: '__timeout_start_time',
    TIMEOUT_MS: '__timeout_ms'
} as const;

/**
 * Middleware for enforcing timeout limits on request processing.
 *
 * TimeoutMiddleware monitors execution time and stores timing information
 * in the context binnacle for use by the pipeline. The actual timeout
 * enforcement is handled by FlexiblePipeline.
 *
 * ## Usage with DI Container
 *
 * ```typescript
 * import { TIMEOUT_MIDDLEWARE_TYPES, TimeoutMiddleware } from 'flexible-core';
 * import { Controller, Route, BeforeExecution } from 'flexible-decorators';
 *
 * // Configure in DI container
 * container.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
 *     useValue: { timeout: 5000 } // 5 second timeout
 * });
 *
 * @Controller()
 * export class ApiController {
 *     @BeforeExecution(TimeoutMiddleware, 'processEvent')
 *     @Route(HttpGet)
 *     public async getData() {
 *         return { data: 'Hello' };
 *     }
 * }
 * ```
 *
 * ## Composable Timeout Layers
 *
 * TimeoutMiddleware can be composed at different layers:
 *
 * ```typescript
 * // Global timeout layer
 * const globalApp = FlexibleApp.builder()
 *   .addEventSource(httpSource)
 *   .addFramework(timeoutFramework({ timeout: 30000 })) // 30s global timeout
 *   .createApp();
 *
 * // API-specific timeout layer
 * const apiApp = FlexibleApp.builder()
 *   .addEventSource(apiEventSource)
 *   .addFramework(timeoutFramework({ timeout: 5000 })) // 5s API timeout
 *   .addFramework(businessFramework)
 *   .createApp();
 * ```
 */
@injectable()
export class TimeoutMiddleware {
    private readonly config: TimeoutMiddlewareConfig;
    private readonly logger: FlexibleLogger;

    /**
     * Creates a new TimeoutMiddleware instance.
     *
     * @param config - Timeout configuration (injected from DI container)
     * @param logger - Logger instance (injected from DI container)
     * @throws Error if timeout is zero or negative
     */
    constructor(
        @inject(TIMEOUT_MIDDLEWARE_TYPES.CONFIG) config: TimeoutMiddlewareConfig,
        @inject(TIMEOUT_MIDDLEWARE_TYPES.LOGGER) logger: FlexibleLogger
    ) {
        // Validate timeout configuration
        if (config.timeout <= 0) {
            throw new Error(`Invalid timeout configuration: timeout must be positive, got ${config.timeout}ms`);
        }

        this.config = config;
        this.logger = logger;
    }

    /**
     * Processes an event by recording start time and timeout configuration.
     *
     * This method stores timing information in the context binnacle for use
     * by the pipeline. The actual timeout enforcement is handled by FlexiblePipeline.
     *
     * @param event - The event being processed (optional, used for extracting request ID)
     * @param contextBinnacle - Context storage for request-scoped data
     */
    public async processEvent(
        eventOrContextBinnacle: any,
        contextBinnacle?: { [key: string]: any }
    ): Promise<void> {
        // Support both old signature (contextBinnacle only) and new signature (event, contextBinnacle)
        let event: any = null;
        let binnacle: { [key: string]: any };

        if (contextBinnacle !== undefined) {
            // New signature: (event, contextBinnacle)
            event = eventOrContextBinnacle;
            binnacle = contextBinnacle;
        } else {
            // Old signature: (contextBinnacle)
            binnacle = eventOrContextBinnacle;
        }

        const startTime = Date.now();

        // Store timing information in context binnacle
        binnacle[TIMEOUT_CONTEXT_KEYS.START_TIME] = startTime;
        binnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS] = this.config.timeout;

        // Extract request ID if available
        const requestId = event?.requestId;

        // Log timeout monitoring start at debug level
        const logData: any = {
            startTime,
            timeout: this.config.timeout
        };

        if (requestId) {
            logData.requestId = requestId;
        }

        this.logger.debug('Timeout monitoring started', logData);
    }
}
