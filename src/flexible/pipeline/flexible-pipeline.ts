import { FlexibleEvent } from "../../event";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleResponse } from "../flexible-response";

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

    constructor(private middlewareStack: FlexibleMiddleware[]) {

    }

    /**
     * Processes an event through the middleware stack.
     *
     * The processing flow:
     * 1. Creates an empty response object
     * 2. Executes each middleware in order
     * 3. Collects successful responses in responseStack
     * 4. Collects errors in errorStack
     * 5. Returns the complete response with all results
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

        return response;
    }
}