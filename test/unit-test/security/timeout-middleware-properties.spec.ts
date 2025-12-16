import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { container, DependencyContainer } from "tsyringe";
import { TimeoutService, TIMEOUT_SERVICE_TYPES, TIMEOUT_CONTEXT_KEYS } from "../../../src/security/timeout-service";
import { FlexibleLogger } from "../../../src/logging/flexible-logger";

describe("TimeoutService Property-Based Tests", () => {
    let testContainer: DependencyContainer;
    let mockLogger: FlexibleLogger;

    beforeEach(() => {
        testContainer = container.createChildContainer();

        // Create mock logger
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

    afterEach(() => {
        testContainer.clearInstances();
    });

    /**
     * Feature: timeout-cancellation-support, Property 5: Timeout configuration acceptance
     * Validates: Requirements 2.1, 2.4
     */
    it("Property 5: Timeout configuration acceptance", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 300000 }), // 1ms to 5 minutes
                (timeout) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
                        useValue: { timeout }
                    });
                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    let middleware: TimeoutService | null = null;
                    let constructorSucceeded = false;

                    try {
                        middleware = iterationContainer.resolve(TimeoutService);
                        constructorSucceeded = true;
                    } catch (error) {
                        constructorSucceeded = false;
                    }

                    iterationContainer.clearInstances();

                    // For any positive timeout, constructor should succeed
                    return constructorSucceeded && middleware !== null;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 6: Invalid timeout rejection
     * Validates: Requirements 2.2
     */
    it("Property 6: Invalid timeout rejection", () => {
        fc.assert(
            fc.property(
                fc.integer({ max: 0 }), // zero and negative values
                (timeout) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
                        useValue: { timeout }
                    });
                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    let threwError = false;
                    let errorMessage = '';

                    try {
                        iterationContainer.resolve(TimeoutService);
                    } catch (error: any) {
                        threwError = true;
                        errorMessage = error.message;
                    }

                    iterationContainer.clearInstances();

                    // For any zero or negative timeout, constructor should throw
                    const correctError = threwError &&
                                       errorMessage.includes('Invalid timeout configuration') &&
                                       errorMessage.includes('must be positive');

                    return correctError;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 1: Timeout monitoring activation
     * Validates: Requirements 1.1
     */
    it("Property 1: Timeout monitoring activation", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 300000 }), // timeout: 1ms to 5 minutes
                async (timeout) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
                        useValue: { timeout }
                    });
                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(TimeoutService);
                    const contextBinnacle: { [key: string]: any } = {};

                    const beforeTime = Date.now();
                    await middleware.processEvent(contextBinnacle);
                    const afterTime = Date.now();

                    // Verify timing information is stored in context binnacle
                    const hasStartTime = typeof contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME] === 'number';
                    const startTimeInRange = contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME] >= beforeTime &&
                                            contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME] <= afterTime;
                    const hasTimeout = contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS] === timeout;

                    iterationContainer.clearInstances();

                    // For any pipeline with timeout middleware, timing information should be tracked
                    return hasStartTime && startTimeInRange && hasTimeout;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 18: Timeout start logging
     * Validates: Requirements 8.1
     */
    it("Property 18: Timeout start logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 300000 }), // timeout: 1ms to 5 minutes
                fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // optional requestId
                async (timeout, requestId) => {
                    const iterationContainer = container.createChildContainer();

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

                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
                        useValue: { timeout }
                    });
                    iterationContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
                        useValue: iterationLogger
                    });

                    const middleware = iterationContainer.resolve(TimeoutService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create event with optional requestId
                    const event = requestId ? { requestId } : {};

                    const beforeTime = Date.now();
                    await middleware.processEvent(contextBinnacle, event);
                    const afterTime = Date.now();

                    // Verify debug log was called
                    const debugCalled = (iterationLogger.debug as jasmine.Spy).calls.count() === 1;

                    let logDataCorrect = false;
                    if (debugCalled) {
                        const call = (iterationLogger.debug as jasmine.Spy).calls.first();
                        const message = call.args[0];
                        const logData = call.args[1];

                        // Verify message
                        const correctMessage = message === 'Timeout monitoring started';

                        // Verify log data contains startTime and timeout
                        const hasStartTime = typeof logData.startTime === 'number' &&
                                           logData.startTime >= beforeTime &&
                                           logData.startTime <= afterTime;
                        const hasTimeout = logData.timeout === timeout;

                        // Verify requestId is included if provided
                        const requestIdCorrect = requestId ? logData.requestId === requestId : !logData.requestId;

                        logDataCorrect = correctMessage && hasStartTime && hasTimeout && requestIdCorrect;
                    }

                    iterationContainer.clearInstances();

                    // For any timeout middleware start, debug log should be called with correct data
                    return debugCalled && logDataCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
});
