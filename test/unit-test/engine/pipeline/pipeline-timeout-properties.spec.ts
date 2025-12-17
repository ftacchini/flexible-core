import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { FlexiblePipeline } from "../../../../src/engine/pipeline/pipeline";
import { FlexibleMiddleware } from "../../../../src/engine/pipeline/middleware.interface";
import { FlexibleEvent } from "../../../../src/extension-points/event-source/event";
import { FlexibleResponse } from "../../../../src/extension-points/event-source/response";
import { TimeoutError } from "../../../../src/built-ins/middleware/timeout/timeout-error";
import { TIMEOUT_CONTEXT_KEYS } from "../../../../src/built-ins/middleware/timeout/timeout-service";
import { FlexibleLogger } from "../../../../src/extension-points/logging/logger.interface";

describe("FlexiblePipeline Timeout Property-Based Tests", () => {
    let mockLogger: FlexibleLogger;

    beforeEach(() => {
        mockLogger = {
            emergency: jasmine.createSpy('emergency'),
            alert: jasmine.createSpy('alert'),
            crit: jasmine.createSpy('crit'),
            error: jasmine.createSpy('error'),
            warning: jasmine.createSpy('warning'),
            notice: jasmine.createSpy('notice'),
            info: jasmine.createSpy('info'),
            debug: jasmine.createSpy('debug')
        };
    });

    /**
     * Feature: timeout-cancellation-support, Property 2: Timeout enforcement
     * Validates: Requirements 1.2
     */
    it("Property 2: Timeout enforcement", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 100 }), // timeout in ms
                fc.integer({ min: 1, max: 5 }), // number of middleware
                fc.integer({ min: 20, max: 200 }), // delay per middleware (exceeds timeout)
                async (timeout, middlewareCount, delayPerMiddleware) => {
                    // Create middleware that delays execution
                    const executedMiddleware: number[] = [];
                    const middlewareStack: FlexibleMiddleware[] = [];

                    for (let i = 0; i < middlewareCount; i++) {
                        const index = i;
                        const mockMiddleware = {
                            processEvent: async () => {
                                executedMiddleware.push(index);
                                await new Promise(resolve => setTimeout(resolve, delayPerMiddleware));
                                return { data: `middleware-${index}` };
                            }
                        } as unknown as FlexibleMiddleware;
                        middlewareStack.push(mockMiddleware);
                    }

                    const pipeline = new FlexiblePipeline(middlewareStack, mockLogger);

                    // Set up timeout context
                    const contextBinnacle: { [key: string]: any } = {
                        [TIMEOUT_CONTEXT_KEYS.START_TIME]: Date.now() - (timeout + 10), // Already exceeded
                        [TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]: timeout
                    };

                    const event = {
                        data: {},
                        routeData: { route: "/test", params: {} },
                        eventType: "test"
                    } as FlexibleEvent;

                    const response = await pipeline.processEvent(event, {}, contextBinnacle);

                    // Verify timeout was enforced
                    const hasTimeoutError = response.errorStack.length > 0 &&
                                           response.errorStack[0] instanceof TimeoutError;

                    // Verify no middleware executed (timeout checked before first middleware)
                    const noMiddlewareExecuted = executedMiddleware.length === 0;

                    // Verify TimeoutError has correct properties
                    let correctErrorProperties = false;
                    if (hasTimeoutError) {
                        const error = response.errorStack[0] as TimeoutError;
                        correctErrorProperties = error.timeout === timeout &&
                                               error.elapsed >= timeout &&
                                               error.name === "TimeoutError";
                    }

                    return hasTimeoutError && noMiddlewareExecuted && correctErrorProperties;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 19: Timeout event logging
     * Validates: Requirements 8.2
     */
    it("Property 19: Timeout event logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 100 }), // timeout in ms
                fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // optional requestId
                async (timeout, requestId) => {
                    // Create a fresh mock logger for this iteration
                    const iterationLogger = {
                        emergency: jasmine.createSpy('emergency'),
                        alert: jasmine.createSpy('alert'),
                        crit: jasmine.createSpy('crit'),
                        error: jasmine.createSpy('error'),
                        warning: jasmine.createSpy('warning'),
                        notice: jasmine.createSpy('notice'),
                        info: jasmine.createSpy('info'),
                        debug: jasmine.createSpy('debug')
                    };

                    // Create simple middleware
                    const middlewareStack: FlexibleMiddleware[] = [{
                        processEvent: async () => ({ data: 'test' })
                    } as unknown as FlexibleMiddleware];

                    const pipeline = new FlexiblePipeline(middlewareStack, iterationLogger);

                    // Set up timeout context with already exceeded timeout
                    const contextBinnacle: { [key: string]: any } = {
                        [TIMEOUT_CONTEXT_KEYS.START_TIME]: Date.now() - (timeout + 10),
                        [TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]: timeout
                    };

                    const event = {
                        data: {},
                        routeData: { route: "/test", params: {} },
                        eventType: "test",
                        requestId: requestId
                    } as FlexibleEvent;

                    await pipeline.processEvent(event, {}, contextBinnacle);

                    // Verify warning log was called
                    const warningCalled = (iterationLogger.warning as jasmine.Spy).calls.count() === 1;

                    let logDataCorrect = false;
                    if (warningCalled) {
                        const call = (iterationLogger.warning as jasmine.Spy).calls.first();
                        const message = call.args[0];
                        const logData = call.args[1];

                        // Verify message
                        const correctMessage = message === 'Request timeout exceeded';

                        // Verify log data contains timeout and elapsed
                        const hasTimeout = logData.timeout === timeout;
                        const hasElapsed = typeof logData.elapsed === 'number' && logData.elapsed >= timeout;

                        // Verify requestId is included if provided
                        const requestIdCorrect = requestId ? logData.requestId === requestId : !logData.requestId;

                        logDataCorrect = correctMessage && hasTimeout && hasElapsed && requestIdCorrect;
                    }

                    // For any timeout event, warning log should be called with correct data
                    return warningCalled && logDataCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 20: Timeout completion logging
     * Validates: Requirements 8.3
     */
    it("Property 20: Timeout completion logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 100, max: 1000 }), // timeout in ms (long enough to complete)
                fc.integer({ min: 1, max: 3 }), // number of middleware
                fc.integer({ min: 1, max: 10 }), // delay per middleware (short)
                fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // optional requestId
                async (timeout, middlewareCount, delayPerMiddleware, requestId) => {
                    // Create a fresh mock logger for this iteration
                    const iterationLogger = {
                        emergency: jasmine.createSpy('emergency'),
                        alert: jasmine.createSpy('alert'),
                        crit: jasmine.createSpy('crit'),
                        error: jasmine.createSpy('error'),
                        warning: jasmine.createSpy('warning'),
                        notice: jasmine.createSpy('notice'),
                        info: jasmine.createSpy('info'),
                        debug: jasmine.createSpy('debug')
                    };

                    // Create middleware that delays execution
                    const middlewareStack: FlexibleMiddleware[] = [];
                    for (let i = 0; i < middlewareCount; i++) {
                        const mockMiddleware = {
                            processEvent: async () => {
                                await new Promise(resolve => setTimeout(resolve, delayPerMiddleware));
                                return { data: `middleware-${i}` };
                            }
                        } as unknown as FlexibleMiddleware;
                        middlewareStack.push(mockMiddleware);
                    }

                    const pipeline = new FlexiblePipeline(middlewareStack, iterationLogger);

                    // Set up timeout context that won't be exceeded
                    const startTime = Date.now();
                    const contextBinnacle: { [key: string]: any } = {
                        [TIMEOUT_CONTEXT_KEYS.START_TIME]: startTime,
                        [TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]: timeout
                    };

                    const event = {
                        data: {},
                        routeData: { route: "/test", params: {} },
                        eventType: "test",
                        requestId: requestId
                    } as FlexibleEvent;

                    await pipeline.processEvent(event, {}, contextBinnacle);

                    // Verify debug log was called for completion
                    const debugCalls = (iterationLogger.debug as jasmine.Spy).calls.all();
                    const completionLogCall = debugCalls.find((call: any) =>
                        call.args[0] === 'Request completed before timeout'
                    );

                    let logDataCorrect = false;
                    if (completionLogCall) {
                        const logData = completionLogCall.args[1];

                        // Verify log data contains elapsed time
                        const hasElapsed = typeof logData.elapsed === 'number' && logData.elapsed >= 0;

                        // Verify requestId is included if provided
                        const requestIdCorrect = requestId ? logData.requestId === requestId : !logData.requestId;

                        logDataCorrect = hasElapsed && requestIdCorrect;
                    }

                    // For any request that completes before timeout, debug log should be called with correct data
                    return completionLogCall !== undefined && logDataCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 4: No timeout without middleware
     * Validates: Requirements 1.4
     */
    it("Property 4: No timeout without middleware", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 3 }), // number of middleware
                fc.integer({ min: 1, max: 10 }), // delay per middleware
                async (middlewareCount, delayPerMiddleware) => {
                    // Create middleware that delays execution
                    const executedMiddleware: number[] = [];
                    const middlewareStack: FlexibleMiddleware[] = [];

                    for (let i = 0; i < middlewareCount; i++) {
                        const index = i;
                        const mockMiddleware = {
                            processEvent: async () => {
                                executedMiddleware.push(index);
                                await new Promise(resolve => setTimeout(resolve, delayPerMiddleware));
                                return { data: `middleware-${index}` };
                            }
                        } as unknown as FlexibleMiddleware;
                        middlewareStack.push(mockMiddleware);
                    }

                    const pipeline = new FlexiblePipeline(middlewareStack, mockLogger);

                    // No timeout configuration in context binnacle
                    const contextBinnacle: { [key: string]: any } = {};

                    const event = {
                        data: {},
                        routeData: { route: "/test", params: {} },
                        eventType: "test"
                    } as FlexibleEvent;

                    const response = await pipeline.processEvent(event, {}, contextBinnacle);

                    // Verify no timeout error occurred
                    const noTimeoutError = !response.errorStack.some(err => err instanceof TimeoutError);

                    // Verify all middleware executed
                    const allMiddlewareExecuted = executedMiddleware.length === middlewareCount;

                    // Verify all responses were collected
                    const allResponsesCollected = response.responseStack.length === middlewareCount;

                    return noTimeoutError && allMiddlewareExecuted && allResponsesCollected;
                }
            ),
            { numRuns: 100 }
        );
    });
});
