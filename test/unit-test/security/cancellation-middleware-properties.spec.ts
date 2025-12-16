import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { container, DependencyContainer } from "tsyringe";
import { CancellationService, CANCELLATION_SERVICE_TYPES, CANCELLATION_CONTEXT_KEYS } from "../../../src/security/cancellation-service";
import { CancellationError } from "../../../src/event/cancellation-error";
import { FlexibleLogger } from "../../../src/logging/flexible-logger";

describe("CancellationService Property-Based Tests", () => {
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
     * Feature: timeout-cancellation-support, Property 9: Cancellation checking
     * Validates: Requirements 4.1
     */
    it("Property 9: Cancellation checking", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.boolean(), // whether token is aborted
                async (requestId, isAborted) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create token
                    const abortController = new AbortController();
                    if (isAborted) {
                        abortController.abort('Test cancellation');
                    }

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    let tokenWasChecked = false;
                    let errorThrown = false;

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                        // If we get here, token was checked and not aborted
                        tokenWasChecked = !isAborted;
                    } catch (error) {
                        // If error thrown, token was checked and was aborted
                        if (error instanceof CancellationError) {
                            tokenWasChecked = isAborted;
                            errorThrown = true;
                        }
                    }

                    iterationContainer.clearInstances();

                    // For any pipeline with cancellation middleware, the token should be checked
                    // If aborted, error should be thrown; if not aborted, no error
                    return tokenWasChecked && (isAborted === errorThrown);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 10: Cancellation enforcement
     * Validates: Requirements 4.2
     */
    it("Property 10: Cancellation enforcement", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.option(fc.string(), { nil: undefined }), // optional reason
                async (requestId, reason) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create aborted token
                    const abortController = new AbortController();
                    abortController.abort(reason);

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    let threwCancellationError = false;
                    let errorHasCorrectStructure = false;

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                    } catch (error) {
                        threwCancellationError = error instanceof CancellationError;
                        if (threwCancellationError) {
                            errorHasCorrectStructure =
                                (error as CancellationError).name === 'CancellationError' &&
                                typeof (error as CancellationError).message === 'string';
                        }
                    }

                    iterationContainer.clearInstances();

                    // For any event with signaled cancellation token,
                    // CancellationError should be thrown with correct structure
                    return threwCancellationError && errorHasCorrectStructure;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 12: Cancellation passthrough
     * Validates: Requirements 4.4
     */
    it("Property 12: Cancellation passthrough", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                async (requestId) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Event without cancellation token
                    const event = {
                        requestId
                    };

                    let processingContinued = false;
                    let noErrorThrown = false;

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                        processingContinued = true;
                        noErrorThrown = true;
                    } catch (error) {
                        noErrorThrown = false;
                    }

                    // Token should not be in binnacle
                    const tokenNotStored = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] === undefined;

                    iterationContainer.clearInstances();

                    // For any event without cancellation token, processing should continue normally
                    return processingContinued && noErrorThrown && tokenNotStored;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 13: Token binnacle storage
     * Validates: Requirements 5.1
     */
    it("Property 13: Token binnacle storage", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.boolean(), // whether token is aborted
                async (requestId, isAborted) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create token
                    const abortController = new AbortController();
                    if (isAborted) {
                        abortController.abort('Test');
                    }

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                    } catch (error) {
                        // Expected if aborted
                    }

                    // Token should be stored in binnacle regardless of abort status
                    const tokenStored = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] === abortController.signal;

                    iterationContainer.clearInstances();

                    // For any event with cancellation token, token should be stored in binnacle
                    return tokenStored;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 14: Cancellation status access
     * Validates: Requirements 5.3
     */
    it("Property 14: Cancellation status access", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.boolean(), // whether token is aborted
                async (requestId, isAborted) => {
                    const iterationContainer = container.createChildContainer();

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: mockLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create token
                    const abortController = new AbortController();
                    if (isAborted) {
                        abortController.abort('Test');
                    }

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                    } catch (error) {
                        // Expected if aborted
                    }

                    // Retrieve token from binnacle
                    const retrievedToken = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal | undefined;

                    // Check that status is accessible and correct
                    const statusAccessible = retrievedToken !== undefined;
                    const statusCorrect = retrievedToken?.aborted === isAborted;

                    iterationContainer.clearInstances();

                    // For any middleware that retrieves token from binnacle,
                    // checking the token should provide current cancellation status
                    return statusAccessible && statusCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 21: Cancellation detection logging
     * Validates: Requirements 9.1
     */
    it("Property 21: Cancellation detection logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.option(fc.string(), { nil: undefined }), // optional reason
                async (requestId, reason) => {
                    const iterationContainer = container.createChildContainer();

                    // Create fresh mock logger for each iteration
                    const iterationLogger: FlexibleLogger = {
                        emergency: jasmine.createSpy('emergency'),
                        alert: jasmine.createSpy('alert'),
                        crit: jasmine.createSpy('crit'),
                        error: jasmine.createSpy('error'),
                        warning: jasmine.createSpy('warning'),
                        notice: jasmine.createSpy('notice'),
                        info: jasmine.createSpy('info'),
                        debug: jasmine.createSpy('debug')
                    };

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: iterationLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create aborted token
                    const abortController = new AbortController();
                    abortController.abort(reason);

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                    } catch (error) {
                        // Expected CancellationError
                    }

                    // Verify warning log was called with request ID
                    const warningCalled = (iterationLogger.warning as jasmine.Spy).calls.count() === 1;
                    const callArgs = (iterationLogger.warning as jasmine.Spy).calls.mostRecent()?.args;
                    const hasRequestId = callArgs && callArgs[1] && callArgs[1].requestId === requestId;

                    iterationContainer.clearInstances();

                    // For any cancellation detected, system should log with request ID at warning level
                    return warningCalled && hasRequestId;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 22: Cancellation reason logging
     * Validates: Requirements 9.2
     */
    it("Property 22: Cancellation reason logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                fc.string().filter(s => s.length > 0), // non-empty reason
                async (requestId, reason) => {
                    const iterationContainer = container.createChildContainer();

                    // Create fresh mock logger for each iteration
                    const iterationLogger: FlexibleLogger = {
                        emergency: jasmine.createSpy('emergency'),
                        alert: jasmine.createSpy('alert'),
                        crit: jasmine.createSpy('crit'),
                        error: jasmine.createSpy('error'),
                        warning: jasmine.createSpy('warning'),
                        notice: jasmine.createSpy('notice'),
                        info: jasmine.createSpy('info'),
                        debug: jasmine.createSpy('debug')
                    };

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: iterationLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Create aborted token with reason
                    const abortController = new AbortController();
                    abortController.abort(reason);

                    const event = {
                        cancellationToken: abortController.signal,
                        requestId
                    };

                    try {
                        await middleware.processEvent(contextBinnacle, event);
                    } catch (error) {
                        // Expected CancellationError
                    }

                    // Verify log message includes the reason
                    const callArgs = (iterationLogger.warning as jasmine.Spy).calls.mostRecent()?.args;
                    const hasReason = callArgs && callArgs[1] && callArgs[1].reason === reason;

                    iterationContainer.clearInstances();

                    // For any cancellation with available reason, system should include it in log message
                    return hasReason;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 23: No-token no-logging
     * Validates: Requirements 9.3
     */
    it("Property 23: No-token no-logging", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // requestId
                async (requestId) => {
                    const iterationContainer = container.createChildContainer();

                    // Create fresh mock logger for each iteration
                    const iterationLogger: FlexibleLogger = {
                        emergency: jasmine.createSpy('emergency'),
                        alert: jasmine.createSpy('alert'),
                        crit: jasmine.createSpy('crit'),
                        error: jasmine.createSpy('error'),
                        warning: jasmine.createSpy('warning'),
                        notice: jasmine.createSpy('notice'),
                        info: jasmine.createSpy('info'),
                        debug: jasmine.createSpy('debug')
                    };

                    iterationContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                        useValue: iterationLogger
                    });

                    const middleware = iterationContainer.resolve(CancellationService);
                    const contextBinnacle: { [key: string]: any } = {};

                    // Event without cancellation token
                    const event = {
                        requestId
                    };

                    await middleware.processEvent(contextBinnacle, event);

                    // Verify no log calls were made
                    const noWarningCalls = (iterationLogger.warning as jasmine.Spy).calls.count() === 0;
                    const noDebugCalls = (iterationLogger.debug as jasmine.Spy).calls.count() === 0;
                    const noInfoCalls = (iterationLogger.info as jasmine.Spy).calls.count() === 0;
                    const noErrorCalls = (iterationLogger.error as jasmine.Spy).calls.count() === 0;

                    iterationContainer.clearInstances();

                    // For any event without cancellation token, no logging should occur
                    return noWarningCalls && noDebugCalls && noInfoCalls && noErrorCalls;
                }
            ),
            { numRuns: 100 }
        );
    });
});
