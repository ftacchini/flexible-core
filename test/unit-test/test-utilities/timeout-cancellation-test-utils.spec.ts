import "reflect-metadata";
import "jasmine";
import {
    TestTimeoutMiddleware,
    TestCancellationMiddleware,
    TestAbortController,
    createMockLogger
} from "../../test-utilities/timeout-cancellation-test-utils";
import { TimeoutMiddleware, TIMEOUT_CONTEXT_KEYS } from "../../../src/security/timeout-middleware";
import { CancellationMiddleware, CANCELLATION_CONTEXT_KEYS } from "../../../src/security/cancellation-middleware";
import { CancellationError } from "../../../src/event/cancellation-error";

describe("Test Utilities for Timeout and Cancellation", () => {
    describe("createMockLogger", () => {
        it("should create a mock logger with all spy methods", () => {
            const logger = createMockLogger();

            expect(logger.emergency).toBeDefined();
            expect(logger.alert).toBeDefined();
            expect(logger.crit).toBeDefined();
            expect(logger.error).toBeDefined();
            expect(logger.warning).toBeDefined();
            expect(logger.notice).toBeDefined();
            expect(logger.info).toBeDefined();
            expect(logger.debug).toBeDefined();

            // Verify they are spies
            expect(jasmine.isSpy(logger.emergency)).toBe(true);
            expect(jasmine.isSpy(logger.debug)).toBe(true);
        });
    });

    describe("TestTimeoutMiddleware", () => {
        describe("create", () => {
            /**
             * Requirements: All (testing support)
             * Test TestTimeoutMiddleware.create()
             */
            it("should create a TimeoutMiddleware instance with specified timeout", () => {
                const timeout = 3000;
                const middleware = TestTimeoutMiddleware.create(timeout);

                expect(middleware).toBeInstanceOf(TimeoutMiddleware);
            });

            it("should create middleware that stores timeout configuration", async () => {
                const timeout = 5000;
                const middleware = TestTimeoutMiddleware.create(timeout);
                const contextBinnacle: { [key: string]: any } = {};

                await middleware.processEvent(contextBinnacle);

                expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]).toBe(timeout);
                expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME]).toBeDefined();
            });

            it("should create middleware with different timeout values", () => {
                const timeouts = [100, 1000, 5000, 10000];

                for (const timeout of timeouts) {
                    const middleware = TestTimeoutMiddleware.create(timeout);
                    expect(middleware).toBeInstanceOf(TimeoutMiddleware);
                }
            });

            it("should throw error for invalid timeout values", () => {
                expect(() => TestTimeoutMiddleware.create(0)).toThrow();
                expect(() => TestTimeoutMiddleware.create(-100)).toThrow();
            });
        });

        describe("createWithMockLogger", () => {
            /**
             * Requirements: All (testing support)
             * Test TestTimeoutMiddleware.createWithMockLogger()
             */
            it("should create middleware and return mock logger", () => {
                const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger(3000);

                expect(middleware).toBeInstanceOf(TimeoutMiddleware);
                expect(logger).toBeDefined();
                expect(jasmine.isSpy(logger.debug)).toBe(true);
            });

            it("should use default timeout when not specified", async () => {
                const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger();
                const contextBinnacle: { [key: string]: any } = {};

                await middleware.processEvent(contextBinnacle);

                expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]).toBe(5000);
            });

            it("should allow verification of log calls", async () => {
                const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger(2000);
                const contextBinnacle: { [key: string]: any } = {};

                await middleware.processEvent(contextBinnacle);

                expect(logger.debug).toHaveBeenCalledWith(
                    'Timeout monitoring started',
                    jasmine.objectContaining({
                        timeout: 2000,
                        startTime: jasmine.any(Number)
                    })
                );
            });
        });
    });

    describe("TestCancellationMiddleware", () => {
        describe("create", () => {
            /**
             * Requirements: All (testing support)
             * Test TestCancellationMiddleware.create()
             */
            it("should create a CancellationMiddleware instance", () => {
                const middleware = TestCancellationMiddleware.create();

                expect(middleware).toBeInstanceOf(CancellationMiddleware);
            });

            it("should create middleware that handles events without tokens", async () => {
                const middleware = TestCancellationMiddleware.create();
                const contextBinnacle: { [key: string]: any } = {};
                const event = { requestId: 'test-123' };

                await expectAsync(middleware.processEvent(event, contextBinnacle)).toBeResolved();
                expect(contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN]).toBeUndefined();
            });

            it("should create middleware that stores tokens in binnacle", async () => {
                const middleware = TestCancellationMiddleware.create();
                const contextBinnacle: { [key: string]: any } = {};
                const controller = new AbortController();
                const event = {
                    cancellationToken: controller.signal,
                    requestId: 'test-456'
                };

                await middleware.processEvent(event, contextBinnacle);

                expect(contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN]).toBe(controller.signal);
            });
        });

        describe("createWithMockLogger", () => {
            /**
             * Requirements: All (testing support)
             * Test TestCancellationMiddleware.createWithMockLogger()
             */
            it("should create middleware and return mock logger", () => {
                const { middleware, logger } = TestCancellationMiddleware.createWithMockLogger();

                expect(middleware).toBeInstanceOf(CancellationMiddleware);
                expect(logger).toBeDefined();
                expect(jasmine.isSpy(logger.warning)).toBe(true);
            });

            it("should allow verification of log calls on cancellation", async () => {
                const { middleware, logger } = TestCancellationMiddleware.createWithMockLogger();
                const contextBinnacle: { [key: string]: any } = {};
                const controller = new AbortController();
                controller.abort('Test reason');

                const event = {
                    cancellationToken: controller.signal,
                    requestId: 'test-789'
                };

                try {
                    await middleware.processEvent(event, contextBinnacle);
                    fail('Expected CancellationError to be thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(CancellationError);
                }

                expect(logger.warning).toHaveBeenCalledWith(
                    'Request cancellation detected',
                    jasmine.objectContaining({
                        requestId: 'test-789'
                    })
                );
            });
        });
    });

    describe("TestAbortController", () => {
        describe("createAborted", () => {
            /**
             * Requirements: All (testing support)
             * Test TestAbortController.createAborted()
             */
            it("should create an AbortController with aborted signal", () => {
                const controller = TestAbortController.createAborted();

                expect(controller).toBeInstanceOf(AbortController);
                expect(controller.signal.aborted).toBe(true);
            });

            it("should create aborted controller with reason", () => {
                const reason = 'Test cancellation reason';
                const controller = TestAbortController.createAborted(reason);

                expect(controller.signal.aborted).toBe(true);
                expect((controller.signal as any).reason).toBe(reason);
            });

            it("should create aborted controller without reason", () => {
                const controller = TestAbortController.createAborted();

                expect(controller.signal.aborted).toBe(true);
            });
        });

        describe("createWithDelay", () => {
            /**
             * Requirements: All (testing support)
             * Test TestAbortController.createWithDelay()
             */
            it("should create controller that is not initially aborted", () => {
                const controller = TestAbortController.createWithDelay(100);

                expect(controller.signal.aborted).toBe(false);
            });

            it("should abort after specified delay", async () => {
                const controller = TestAbortController.createWithDelay(50);

                expect(controller.signal.aborted).toBe(false);

                // Wait for abort
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(controller.signal.aborted).toBe(true);
            });

            it("should abort with reason after delay", async () => {
                const reason = 'Delayed abort';
                const controller = TestAbortController.createWithDelay(50, reason);

                await new Promise(resolve => setTimeout(resolve, 100));

                expect(controller.signal.aborted).toBe(true);
                expect((controller.signal as any).reason).toBe(reason);
            });
        });

        describe("waitForAbort", () => {
            /**
             * Requirements: All (testing support)
             * Test TestAbortController helper methods
             */
            it("should resolve immediately for already-aborted signal", async () => {
                const controller = TestAbortController.createAborted();
                const startTime = Date.now();

                await TestAbortController.waitForAbort(controller.signal);

                const elapsed = Date.now() - startTime;
                expect(elapsed).toBeLessThan(10); // Should be nearly instant
            });

            it("should wait for signal to be aborted", async () => {
                const controller = new AbortController();
                const waitPromise = TestAbortController.waitForAbort(controller.signal);

                // Abort after a short delay
                setTimeout(() => controller.abort(), 50);

                const startTime = Date.now();
                await waitPromise;
                const elapsed = Date.now() - startTime;

                expect(elapsed).toBeGreaterThanOrEqual(40); // Should wait for abort
                expect(controller.signal.aborted).toBe(true);
            });
        });

        describe("createWithAbortPromise", () => {
            /**
             * Requirements: All (testing support)
             * Test TestAbortController helper methods
             */
            it("should return controller and abort promise", () => {
                const { controller, abortPromise } = TestAbortController.createWithAbortPromise();

                expect(controller).toBeInstanceOf(AbortController);
                expect(abortPromise).toBeInstanceOf(Promise);
            });

            it("should resolve promise when controller is aborted", async () => {
                const { controller, abortPromise } = TestAbortController.createWithAbortPromise();

                expect(controller.signal.aborted).toBe(false);

                // Abort the controller
                setTimeout(() => controller.abort(), 50);

                // Wait for promise to resolve
                await abortPromise;

                expect(controller.signal.aborted).toBe(true);
            });

            it("should allow testing async cancellation scenarios", async () => {
                const { controller, abortPromise } = TestAbortController.createWithAbortPromise();

                // Simulate async operation that checks for cancellation
                const asyncOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (controller.signal.aborted) {
                        throw new Error('Operation cancelled');
                    }
                    return 'completed';
                };

                // Abort after 50ms
                setTimeout(() => controller.abort(), 50);

                // Both should complete
                await Promise.all([
                    abortPromise,
                    expectAsync(asyncOperation()).toBeRejectedWithError('Operation cancelled')
                ]);
            });
        });
    });
});
