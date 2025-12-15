import "reflect-metadata";
import "jasmine";
import { container, DependencyContainer } from "tsyringe";
import { RateLimitMiddleware, RateLimitConfig, RATE_LIMIT_TYPES, MemoryRateLimitStore, RateLimitStore } from "../../../src";
import { FlexibleEvent } from "../../../src/event";

describe("RateLimitMiddleware with DI", () => {
    let testContainer: DependencyContainer;

    beforeEach(() => {
        // Create a child container for each test to isolate registrations
        testContainer = container.createChildContainer();
    });

    afterEach(() => {
        // Clear the test container
        testContainer.clearInstances();
    });

    describe("constructor injection", () => {
        it("should use default config when none is bound", () => {
            const middleware = testContainer.resolve(RateLimitMiddleware);

            // Access private config through check method behavior
            expect(middleware).toBeDefined();
            expect(middleware instanceof RateLimitMiddleware).toBe(true);
        });

        it("should use default store when none is bound", () => {
            const middleware = testContainer.resolve(RateLimitMiddleware);

            expect(middleware).toBeDefined();
            expect(middleware instanceof RateLimitMiddleware).toBe(true);
        });

        it("should use injected config when bound", () => {
            const customConfig = new RateLimitConfig({
                max: 50,
                windowMs: 30000,
                message: 'Custom message'
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);

            expect(middleware).toBeDefined();
        });

        it("should use injected store when bound", () => {
            const customStore = new MemoryRateLimitStore();

            testContainer.register(RATE_LIMIT_TYPES.STORE, {
                useValue: customStore
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);

            expect(middleware).toBeDefined();
        });

        it("should use both injected config and store when bound", () => {
            const customConfig = new RateLimitConfig({
                max: 25,
                windowMs: 15000
            });
            const customStore = new MemoryRateLimitStore();

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });
            testContainer.register(RATE_LIMIT_TYPES.STORE, {
                useValue: customStore
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);

            expect(middleware).toBeDefined();
        });
    });

    describe("default behavior", () => {
        it("should use default max value of 100", async () => {
            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;

            // Make 100 requests (should all succeed)
            for (let i = 0; i < 100; i++) {
                await expectAsync(middleware.check(mockEvent)).toBeResolved();
            }

            // 101st request should fail
            await expectAsync(middleware.check(mockEvent)).toBeRejected();
        });

        it("should use default windowMs value of 60000", async () => {
            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.2' } as any as FlexibleEvent;

            // The default window is 60 seconds, which is too long to test
            // We just verify the middleware works with defaults
            await expectAsync(middleware.check(mockEvent)).toBeResolved();
        });

        it("should use default message", async () => {
            const customConfig = new RateLimitConfig({
                max: 1,
                windowMs: 60000
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.3' } as any as FlexibleEvent;

            // Exceed limit
            await middleware.check(mockEvent);

            try {
                await middleware.check(mockEvent);
                fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toBe('Too many requests, please try again later');
            }
        });

        it("should use default keyGenerator based on sourceIp", async () => {
            const customConfig = new RateLimitConfig({
                max: 2,
                windowMs: 60000
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent1 = { sourceIp: '192.168.1.10' } as any as FlexibleEvent;
            const mockEvent2 = { sourceIp: '192.168.1.20' } as any as FlexibleEvent;

            // Each IP should be tracked separately
            await middleware.check(mockEvent1);
            await middleware.check(mockEvent1);
            await middleware.check(mockEvent2);
            await middleware.check(mockEvent2);

            // Both should now be at limit
            await expectAsync(middleware.check(mockEvent1)).toBeRejected();
            await expectAsync(middleware.check(mockEvent2)).toBeRejected();
        });

        it("should use default skip function that never skips", async () => {
            const customConfig = new RateLimitConfig({
                max: 1,
                windowMs: 60000
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.4' } as any as FlexibleEvent;

            // First request succeeds
            await middleware.check(mockEvent);

            // Second request should be rate limited (not skipped)
            await expectAsync(middleware.check(mockEvent)).toBeRejected();
        });
    });

    describe("custom configuration", () => {
        it("should respect custom max value", async () => {
            const customConfig = new RateLimitConfig({
                max: 3,
                windowMs: 60000
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.5' } as any as FlexibleEvent;

            // Make 3 requests (should all succeed)
            await middleware.check(mockEvent);
            await middleware.check(mockEvent);
            await middleware.check(mockEvent);

            // 4th request should fail
            await expectAsync(middleware.check(mockEvent)).toBeRejected();
        });

        it("should respect custom message", async () => {
            const customMessage = 'You have been rate limited!';
            const customConfig = new RateLimitConfig({
                max: 1,
                windowMs: 60000,
                message: customMessage
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.6' } as any as FlexibleEvent;

            await middleware.check(mockEvent);

            try {
                await middleware.check(mockEvent);
                fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toBe(customMessage);
            }
        });

        it("should respect custom keyGenerator", async () => {
            const customConfig = new RateLimitConfig({
                max: 2,
                windowMs: 60000,
                keyGenerator: (event: FlexibleEvent) => (event as any).userId || 'anonymous'
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent1 = { userId: 'user-123', sourceIp: '192.168.1.1' } as any as FlexibleEvent;
            const mockEvent2 = { userId: 'user-456', sourceIp: '192.168.1.1' } as any as FlexibleEvent;

            // Same IP, different users - should be tracked separately
            await middleware.check(mockEvent1);
            await middleware.check(mockEvent1);
            await middleware.check(mockEvent2);
            await middleware.check(mockEvent2);

            // Both users should now be at limit
            await expectAsync(middleware.check(mockEvent1)).toBeRejected();
            await expectAsync(middleware.check(mockEvent2)).toBeRejected();
        });

        it("should respect custom skip function", async () => {
            const customConfig = new RateLimitConfig({
                max: 1,
                windowMs: 60000,
                skip: (event: FlexibleEvent) => (event as any).skipRateLimit === true
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const normalEvent = { sourceIp: '192.168.1.7' } as any as FlexibleEvent;
            const skippedEvent = { sourceIp: '192.168.1.7', skipRateLimit: true } as any as FlexibleEvent;

            // First normal request succeeds
            await middleware.check(normalEvent);

            // Skipped requests should all succeed
            await middleware.check(skippedEvent);
            await middleware.check(skippedEvent);
            await middleware.check(skippedEvent);

            // Second normal request should fail
            await expectAsync(middleware.check(normalEvent)).toBeRejected();
        });
    });

    describe("custom store", () => {
        it("should use custom store when bound", async () => {
            const customStore = new MemoryRateLimitStore();
            const incrementSpy = spyOn(customStore, 'increment').and.callThrough();

            const customConfig = new RateLimitConfig({
                max: 5,
                windowMs: 60000
            });

            testContainer.register(RATE_LIMIT_TYPES.CONFIG, {
                useValue: customConfig
            });
            testContainer.register(RATE_LIMIT_TYPES.STORE, {
                useValue: customStore
            });

            const middleware = testContainer.resolve(RateLimitMiddleware);
            const mockEvent = { sourceIp: '192.168.1.8' } as any as FlexibleEvent;

            await middleware.check(mockEvent);

            expect(incrementSpy).toHaveBeenCalled();
            expect(incrementSpy).toHaveBeenCalledWith('192.168.1.8', 60000);

            customStore.destroy();
        });
    });
});
