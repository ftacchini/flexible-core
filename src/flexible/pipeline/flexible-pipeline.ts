import { FlexibleEvent } from "../../event";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleResponse } from "../flexible-response";
import { TimeoutError } from "../../event/timeout-error";
import { TIMEOUT_CONTEXT_KEYS } from "../../security/timeout-middleware";
import { FlexibleLogger } from "../../logging/flexible-logger";

/**
 * A pipeline that processes events through a stack of middleware functions.
 *
 * The pipeline executes middleware in order, collecting responses and errors.
 * Each middleware can:
 * - Transform the event
 * - Add data to the response
 * - Throw errors (which are caught and added to the error stack)
 * - Access shared context through the contextBinnacle
 *
 * Middleware execution continues even if errors occur, allowing error handlers
 * to process errors from earlier middleware.
 *
 * @example
 * ```typescript
 * const pipeline = new FlexiblePipeline([
 *   authMiddleware,
 *   validationMiddleware,
 *   businessLogicMiddleware,
 *   errorHandlerMiddleware
 * ]);
 *
 * const response = await pipeline.processEvent(event, {}, {});
 * ```
 */
export class FlexiblePipeline {

    constructor(
        private middlewareStack: FlexibleMiddleware[],
        private logger?: FlexibleLogger
    ) {

    }

    /**
     * Processes an event through the middleware stack.
     *
     * The processing flow:
     * 1. Creates an empty response object
     * 2. Executes each middleware in order
     * 3. Before each middleware, checks if timeout has been exceeded
     * 4. Collects successful responses in responseStack
     * 5. Collects errors in errorStack
     * 6. Returns the complete response with all results
     *
     * @param event - The event to process
     * @param filterBinnacle - Shared state from filter evaluation (e.g., route parameters)
     * @param contextBinnacle - Shared context across middleware (e.g., user session, request ID)
     * @returns Response object containing all middleware results and any errors
     */
    public async processEvent(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: string }): Promise<FlexibleResponse> {

        let response: FlexibleResponse = {
            errorStack: [],
            responseStack: []
        }

        for(var i = 0; i < this.middlewareStack.length; i++) {
            // Check for timeout before executing each middleware
            const startTime = contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME];
            const timeoutMs = contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS];

            if (startTime !== undefined && timeoutMs !== undefined) {
                const startTimeNum = typeof startTime === 'number' ? startTime : parseInt(startTime, 10);
                const timeoutMsNum = typeof timeoutMs === 'number' ? timeoutMs : parseInt(timeoutMs, 10);

                const elapsed = Date.now() - startTimeNum;
                if (elapsed >= timeoutMsNum) {
                    const timeoutError = new TimeoutError(timeoutMsNum, elapsed);
                    response.errorStack.push(timeoutError);

                    // Log timeout event at warning level
                    if (this.logger) {
                        const logData: any = {
                            timeout: timeoutMsNum,
                            elapsed
                        };

                        if (event.requestId) {
                            logData.requestId = event.requestId;
                        }

                        this.logger.warning('Request timeout exceeded', logData);
                    }

                    // Stop pipeline execution
                    return response;
                }
            }

            try {
                var newResponse = await this.middlewareStack[i].processEvent(
                    event,
                    response,
                    filterBinnacle,
                    contextBinnacle);

                response.responseStack.push(newResponse);
            }
            catch(ex) {
                response.errorStack.push(ex);
            }
        }

        // Log successful completion if timeout monitoring was active
        const startTime = contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME];
        const timeoutMs = contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS];

        if (startTime !== undefined && timeoutMs !== undefined && this.logger) {
            const startTimeNum = typeof startTime === 'number' ? startTime : parseInt(startTime, 10);
            const elapsed = Date.now() - startTimeNum;

            const logData: any = {
                elapsed
            };

            if (event.requestId) {
                logData.requestId = event.requestId;
            }

            this.logger.debug('Request completed before timeout', logData);
        }

        return response;
    }
}