import { injectable, inject } from 'tsyringe';
import { FlexibleLogger } from '../logging/flexible-logger';
import { CancellationError } from '../event/cancellation-error';

/**
 * Dependency injection types for CancellationService.
 */
export const CANCELLATION_SERVICE_TYPES = {
    LOGGER: Symbol.for('FlexibleLogger')
} as const;

/**
 * Context binnacle keys used by CancellationService.
 */
export const CANCELLATION_CONTEXT_KEYS = {
    TOKEN: '__cancellation_token'
} as const;

/**
 * Middleware for monitoring cancellation tokens and stopping pipeline execution when cancelled.
 *
 * CancellationService checks if an event has a cancellation token (AbortSignal) and:
 * 1. Stores the token in the context binnacle for downstream middleware access
 * 2. Checks if the token is already aborted
 * 3. Throws CancellationError if the token is aborted
 *
 * ## Usage with DI Container
 *
 * ```typescript
 * import { CANCELLATION_SERVICE_TYPES, CancellationService } from 'flexible-core';
 * import { Controller, Route, BeforeExecution } from 'flexible-decorators';
 *
 * @Controller()
 * export class ApiController {
 *     @BeforeExecution(CancellationService, 'processEvent')
 *     @Route(HttpGet)
 *     public async getData() {
 *         return { data: 'Hello' };
 *     }
 * }
 * ```
 *
 * ## HTTP Integration
 *
 * When integrated with HTTP event sources, cancellation tokens are automatically
 * created from request close events, allowing client disconnections to cancel processing:
 *
 * ```typescript
 * const httpSource = new HttpSource({
 *     enableCancellation: true // default
 * });
 * ```
 *
 * ## Accessing Cancellation Token in Middleware
 *
 * Downstream middleware can access the cancellation token from the context binnacle:
 *
 * ```typescript
 * public async processEvent(contextBinnacle: { [key: string]: any }): Promise<void> {
 *     const token = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal | undefined;
 *
 *     if (token?.aborted) {
 *         // Handle cancellation
 *         return;
 *     }
 *
 *     // Long-running operation...
 * }
 * ```
 */
@injectable()
export class CancellationService {
    private readonly logger: FlexibleLogger;

    /**
     * Creates a new CancellationService instance.
     *
     * @param logger - Logger instance (injected from DI container)
     */
    constructor(
        @inject(CANCELLATION_SERVICE_TYPES.LOGGER) logger: FlexibleLogger
    ) {
        this.logger = logger;
    }

    /**
     * Processes an event by checking its cancellation token.
     *
     * This method:
     * 1. Checks if the event has a cancellation token
     * 2. If present, stores it in the context binnacle for downstream middleware
     * 3. Checks if the token is already aborted
     * 4. If aborted, throws CancellationError with the reason
     *
     * @param contextBinnacle - Context storage for request-scoped data
     * @param event - The event being processed
     * @throws CancellationError if the cancellation token is aborted
     */
    public async processEvent(
        contextBinnacle: { [key: string]: any },
        event?: { cancellationToken?: AbortSignal; requestId?: string }
    ): Promise<void> {
        // If no event or no cancellation token, allow processing to continue
        if (!event || !event.cancellationToken) {
            return;
        }
        // Store token in context binnacle for downstream middleware access
        contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] = event.cancellationToken;

        // Check if token is already aborted
        if (event.cancellationToken.aborted) {
            const reason = (event.cancellationToken as any).reason;

            // Log cancellation detection at warning level
            this.logger.warning('Request cancellation detected', {
                requestId: event.requestId,
                reason: reason || 'No reason provided'
            });

            throw new CancellationError(reason, 'Request cancelled');
        }
    }
}
