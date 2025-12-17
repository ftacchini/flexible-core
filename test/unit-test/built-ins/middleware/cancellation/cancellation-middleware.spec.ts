import "reflect-metadata";
import "jasmine";
import { container, DependencyContainer } from "tsyringe";
import { CancellationService, CANCELLATION_SERVICE_TYPES, CANCELLATION_CONTEXT_KEYS } from "../../../../../src/built-ins/middleware/cancellation/cancellation-service";
import { CancellationError } from "../../../../../src/built-ins/middleware/cancellation/cancellation-error";
import { FlexibleLogger } from "../../../../../src/extension-points/logging/logger.interface";

describe("CancellationService Unit Tests", () => {
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

    describe("processEvent", () => {
        /**
         * Requirements: 5.1
         * Test token storage in binnacle
         */
        it("should store cancellation token in context binnacle", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            // Create a non-aborted token
            const abortController = new AbortController();
            const event = {
                cancellationToken: abortController.signal,
                requestId: 'test-123'
            };

            await middleware.processEvent(contextBinnacle, event);

            // Verify token is stored in binnacle
            expect(contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN]).toBe(abortController.signal);
        });

        /**
         * Requirements: 4.1, 4.2
         * Test CancellationError thrown for aborted tokens
         */
        it("should throw CancellationError for aborted tokens", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            // Create an aborted token
            const abortController = new AbortController();
            abortController.abort('User cancelled');

            const event = {
                cancellationToken: abortController.signal,
                requestId: 'test-456'
            };

            // Verify CancellationError is thrown
            try {
                await middleware.processEvent(contextBinnacle, event);
                fail('Expected CancellationError to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(CancellationError);
                expect((error as CancellationError).name).toBe('CancellationError');
            }
        });

        /**
         * Requirements: 4.4, 5.1
         * Test passthrough for non-aborted tokens
         */
        it("should allow processing to continue for non-aborted tokens", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            // Create a non-aborted token
            const abortController = new AbortController();
            const event = {
                cancellationToken: abortController.signal,
                requestId: 'test-789'
            };

            // Should not throw
            await expectAsync(middleware.processEvent(contextBinnacle, event)).toBeResolved();

            // Token should still be stored
            expect(contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN]).toBe(abortController.signal);
        });

        /**
         * Requirements: 4.4
         * Test handling of events without tokens
         */
        it("should handle events without cancellation tokens gracefully", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            const event = {
                requestId: 'test-no-token'
            };

            // Should not throw
            await expectAsync(middleware.processEvent(contextBinnacle, event)).toBeResolved();

            // Token should not be in binnacle
            expect(contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN]).toBeUndefined();
        });

        /**
         * Requirements: 9.1
         * Test that cancellation detection is logged
         */
        it("should log cancellation detection at warning level", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            // Create an aborted token with reason
            const abortController = new AbortController();
            abortController.abort('Client disconnected');

            const event = {
                cancellationToken: abortController.signal,
                requestId: 'test-log-123'
            };

            try {
                await middleware.processEvent(contextBinnacle, event);
            } catch (error) {
                // Expected
            }

            // Verify warning log was called
            expect(mockLogger.warning).toHaveBeenCalledWith(
                'Request cancellation detected',
                jasmine.objectContaining({
                    requestId: 'test-log-123',
                    reason: jasmine.any(String)
                })
            );
        });

        /**
         * Requirements: 9.3
         * Test that no logging occurs for events without tokens
         */
        it("should not log when event has no cancellation token", async () => {
            testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
                useValue: mockLogger
            });

            const middleware = testContainer.resolve(CancellationService);
            const contextBinnacle: { [key: string]: any } = {};

            const event = {
                requestId: 'test-no-log'
            };

            await middleware.processEvent(contextBinnacle, event);

            // Verify no log calls were made
            expect(mockLogger.warning).not.toHaveBeenCalled();
            expect(mockLogger.debug).not.toHaveBeenCalled();
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });
});
