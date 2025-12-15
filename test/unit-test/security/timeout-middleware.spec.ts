import "reflect-metadata";
import "jasmine";
import { container, DependencyContainer } from "tsyringe";
import { TimeoutMiddleware, TIMEOUT_MIDDLEWARE_TYPES, TIMEOUT_CONTEXT_KEYS } from "../../../src/security/timeout-middleware";
import { FlexibleLogger } from "../../../src/logging/flexible-logger";

describe("TimeoutMiddleware Unit Tests", () => {
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

    describe("Constructor", () => {
        /**
         * Requirements: 2.1, 2.2
         * Test valid timeout acceptance
         */
        it("should accept valid positive timeout values", () => {
            const validTimeouts = [1, 100, 1000, 5000, 30000, 60000];

            for (const timeout of validTimeouts) {
                testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
                    useValue: { timeout }
                });
                testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
                    useValue: mockLogger
                });

                expect(() => {
                    testContainer.resolve(TimeoutMiddleware);
                }).not.toThrow();

                testContainer.clearInstances();
            }
        });

        /**
         * Requirements: 2.1, 2.2
         * Test invalid timeout rejection (zero)
         */
        it("should reject zero timeout", () => {
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
                useValue: { timeout: 0 }
            });
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            expect(() => {
                testContainer.resolve(TimeoutMiddleware);
            }).toThrowError(/Invalid timeout configuration.*must be positive.*0ms/);
        });

        /**
         * Requirements: 2.1, 2.2
         * Test invalid timeout rejection (negative)
         */
        it("should reject negative timeout values", () => {
            const invalidTimeouts = [-1, -100, -1000, -5000];

            for (const timeout of invalidTimeouts) {
                testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
                    useValue: { timeout }
                });
                testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
                    useValue: mockLogger
                });

                expect(() => {
                    testContainer.resolve(TimeoutMiddleware);
                }).toThrowError(/Invalid timeout configuration.*must be positive/);

                testContainer.clearInstances();
            }
        });
    });

    describe("processEvent", () => {
        /**
         * Requirements: 1.1
         * Test that timing information is stored in context binnacle
         */
        it("should store start time and timeout in context binnacle", async () => {
            const timeout = 5000;
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
                useValue: { timeout }
            });
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(TimeoutMiddleware);
            const contextBinnacle: { [key: string]: any } = {};

            const beforeTime = Date.now();
            await middleware.processEvent(contextBinnacle);
            const afterTime = Date.now();

            // Verify start time is stored and within reasonable range
            expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME]).toBeDefined();
            expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME]).toBeGreaterThanOrEqual(beforeTime);
            expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.START_TIME]).toBeLessThanOrEqual(afterTime);

            // Verify timeout is stored
            expect(contextBinnacle[TIMEOUT_CONTEXT_KEYS.TIMEOUT_MS]).toBe(timeout);
        });

        /**
         * Requirements: 8.1
         * Test that debug logging occurs when monitoring starts
         */
        it("should log timeout monitoring start at debug level", async () => {
            const timeout = 3000;
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
                useValue: { timeout }
            });
            testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(TimeoutMiddleware);
            const contextBinnacle: { [key: string]: any } = {};

            await middleware.processEvent(contextBinnacle);

            // Verify debug log was called
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Timeout monitoring started',
                jasmine.objectContaining({
                    startTime: jasmine.any(Number),
                    timeout: timeout
                })
            );
        });
    });
});
