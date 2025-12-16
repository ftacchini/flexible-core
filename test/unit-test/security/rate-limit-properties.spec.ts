import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { container, DependencyContainer } from "tsyringe";
import { RateLimitService, RateLimitConfig, RATE_LIMIT_TYPES, MemoryRateLimitStore, RateLimitStore, RateLimitInfo } from "../../../src";
import { FlexibleEvent } from "../../../src/event";

describe("RateLimitService Property-Based Tests", () => {
    let testContainer: DependencyContainer;

    beforeEach(() => {
        testContainer = container.createChildContainer();
    });

    afterEach(() => {
        testContainer.clearInstances();
    });

    /**
     * Feature: rate-limiter-di-config, Property 1: Configuration injection consistency
     * Validates: Requirements 1.1
     */
    it("Property 1: Configuration injection consistency", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 1000 }),
                fc.integer({ min: 100, max: 300000 }),
                fc.string({ minLength: 1, maxLength: 100 }),
                async (max, windowMs, message) => {
                    const iterationContainer = container.createChildContainer();
                    const config = new RateLimitConfig({ max, windowMs, message });
                    const store = new MemoryRateLimitStore();
                    iterationContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: config });
                    iterationContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: store });
                    const middleware = iterationContainer.resolve(RateLimitService);
                    const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;

                    for (let i = 0; i < max; i++) {
                        await middleware.check(mockEvent);
                    }

                    try {
                        await middleware.check(mockEvent);
                        return false;
                    } catch (error: any) {
                        return error.message === message && error.statusCode === 429;
                    } finally {
                        store.destroy();
                        iterationContainer.clearInstances();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: rate-limiter-di-config, Property 2: Store injection consistency
     * Validates: Requirements 1.4
     */
    it("Property 2: Store injection consistency", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1000, max: 60000 }),
                async (max, windowMs) => {
                    const iterationContainer = container.createChildContainer();
                    const incrementCalls: any[] = [];
                    const mockStore: RateLimitStore = {
                        async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
                            incrementCalls.push({ key, windowMs });
                            const count = incrementCalls.filter((c: any) => c.key === key).length;
                            return { count, windowStart: Date.now(), resetTime: Date.now() + windowMs };
                        },
                        async get(key: string): Promise<RateLimitInfo | null> { return null; },
                        async reset(key: string): Promise<void> { },
                        async cleanup(): Promise<void> { }
                    };

                    const config = new RateLimitConfig({ max, windowMs });
                    iterationContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: config });
                    iterationContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: mockStore });
                    const middleware = iterationContainer.resolve(RateLimitService);
                    const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;
                    await middleware.check(mockEvent);

                    const wasUsed = incrementCalls.length > 0 && incrementCalls[0].windowMs === windowMs;
                    iterationContainer.clearInstances();
                    return wasUsed;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: rate-limiter-di-config, Property 6: Custom key generator behavior
     * Validates: Requirements 8.3
     */
    it("Property 6: Custom key generator behavior", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 1000, max: 60000 }),
                fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 2, maxLength: 5 })
                    .filter(userIds => {
                        // Filter out strings that collide with Object.prototype properties
                        const safeUserIds = userIds.filter(id =>
                            !Object.prototype.hasOwnProperty(id) &&
                            typeof (Object.prototype as any)[id] === 'undefined'
                        );
                        return safeUserIds.length >= 2;
                    }),
                async (max, windowMs, userIds) => {
                    const iterationContainer = container.createChildContainer();
                    const config = new RateLimitConfig({
                        max,
                        windowMs,
                        keyGenerator: (event: FlexibleEvent) => (event as any).userId || 'anonymous'
                    });
                    const store = new MemoryRateLimitStore();
                    iterationContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: config });
                    iterationContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: store });
                    const middleware = iterationContainer.resolve(RateLimitService);

                    for (const userId of userIds) {
                        for (let i = 0; i < max; i++) {
                            const mockEvent = { userId, sourceIp: '192.168.1.1' } as any as FlexibleEvent;
                            await middleware.check(mockEvent);
                        }
                    }

                    let allAtLimit = true;
                    for (const userId of userIds) {
                        try {
                            const mockEvent = { userId, sourceIp: '192.168.1.1' } as any as FlexibleEvent;
                            await middleware.check(mockEvent);
                            allAtLimit = false;
                            break;
                        } catch (error: any) {
                            // Expected
                        }
                    }

                    store.destroy();
                    iterationContainer.clearInstances();
                    return allAtLimit;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: rate-limiter-di-config, Property 7: Skip function behavior
     * Validates: Requirements 8.4
     */
    it("Property 7: Skip function behavior", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 5 }),
                fc.integer({ min: 1000, max: 60000 }),
                fc.boolean(),
                async (max, windowMs, shouldSkip) => {
                    const iterationContainer = container.createChildContainer();
                    const config = new RateLimitConfig({
                        max,
                        windowMs,
                        skip: (event: FlexibleEvent) => (event as any).skipFlag === true
                    });
                    const store = new MemoryRateLimitStore();
                    iterationContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: config });
                    iterationContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: store });
                    const middleware = iterationContainer.resolve(RateLimitService);
                    const mockEvent = { sourceIp: '192.168.1.1', skipFlag: shouldSkip } as any as FlexibleEvent;

                    if (shouldSkip) {
                        for (let i = 0; i < max + 10; i++) {
                            await middleware.check(mockEvent);
                        }
                        store.destroy();
                        iterationContainer.clearInstances();
                        return true;
                    } else {
                        for (let i = 0; i < max; i++) {
                            await middleware.check(mockEvent);
                        }

                        try {
                            await middleware.check(mockEvent);
                            store.destroy();
                            iterationContainer.clearInstances();
                            return false;
                        } catch (error: any) {
                            store.destroy();
                            iterationContainer.clearInstances();
                            return true;
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe("RateLimitService Multiple Instance Property Tests", () => {
    /**
     * Feature: rate-limiter-di-config, Property 3: Multiple instance isolation
     * Validates: Requirements 2.1, 2.3
     */
    it("Property 3: Multiple instance isolation", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 2, maxLength: 5 }),
                fc.integer({ min: 1000, max: 60000 }),
                async (maxValues, windowMs) => {
                    const iterationContainer = container.createChildContainer();
                    const configs = maxValues.map(max => new RateLimitConfig({ max, windowMs }));
                    const stores = configs.map(() => new MemoryRateLimitStore());
                    const middlewares: RateLimitService[] = [];

                    for (let i = 0; i < configs.length; i++) {
                        const childContainer = iterationContainer.createChildContainer();
                        childContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: configs[i] });
                        childContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: stores[i] });
                        middlewares.push(childContainer.resolve(RateLimitService));
                    }

                    const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;

                    for (let i = 0; i < middlewares.length; i++) {
                        for (let j = 0; j < maxValues[i]; j++) {
                            await middlewares[i].check(mockEvent);
                        }
                    }

                    let allAtLimit = true;
                    for (let i = 0; i < middlewares.length; i++) {
                        try {
                            await middlewares[i].check(mockEvent);
                            allAtLimit = false;
                            break;
                        } catch (error: any) {
                            // Expected
                        }
                    }

                    stores.forEach(store => store.destroy());
                    iterationContainer.clearInstances();
                    return allAtLimit;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: rate-limiter-di-config, Property 4: Named binding resolution
     * Validates: Requirements 2.2
     */
    it("Property 4: Named binding resolution", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({ name: fc.string({ minLength: 5, maxLength: 15 }), max: fc.integer({ min: 1, max: 50 }) }),
                    { minLength: 2, maxLength: 5 }
                ),
                fc.integer({ min: 1000, max: 60000 }),
                async (namedConfigs, windowMs) => {
                    const uniqueConfigs = namedConfigs.filter((config, index, self) =>
                        index === self.findIndex(c => c.name === config.name)
                    );

                    if (uniqueConfigs.length < 2) {
                        return true;
                    }

                    const iterationContainer = container.createChildContainer();

                    for (const { name, max } of uniqueConfigs) {
                        const config = new RateLimitConfig({ max, windowMs });
                        iterationContainer.register(name, { useValue: config });
                    }

                    let allCorrect = true;
                    for (const { name, max } of uniqueConfigs) {
                        try {
                            const resolvedConfig = iterationContainer.resolve<RateLimitConfig>(name);
                            if (resolvedConfig.max !== max || resolvedConfig.windowMs !== windowMs) {
                                allCorrect = false;
                                break;
                            }
                        } catch (error) {
                            allCorrect = false;
                            break;
                        }
                    }

                    iterationContainer.clearInstances();
                    return allCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe("RateLimitService Mock Compatibility Property Tests", () => {
    /**
     * Feature: rate-limiter-di-config, Property 5: Mock configuration compatibility
     * Validates: Requirements 4.1, 4.2
     */
    it("Property 5: Mock configuration compatibility", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1000, max: 60000 }),
                fc.string({ minLength: 10, maxLength: 50 }),
                async (max, windowMs, message) => {
                    const iterationContainer = container.createChildContainer();
                    let keyGeneratorCalled = false;
                    let skipCalled = false;

                    const mockConfig = new RateLimitConfig({
                        max,
                        windowMs,
                        message,
                        keyGenerator: (event: FlexibleEvent) => {
                            keyGeneratorCalled = true;
                            return (event as any).sourceIp || 'unknown';
                        },
                        skip: (event: FlexibleEvent) => {
                            skipCalled = true;
                            return false;
                        }
                    });

                    let incrementCalled = false;
                    const mockStore: RateLimitStore = {
                        async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
                            incrementCalled = true;
                            return { count: 1, windowStart: Date.now(), resetTime: Date.now() + windowMs };
                        },
                        async get(key: string): Promise<RateLimitInfo | null> { return null; },
                        async reset(key: string): Promise<void> { },
                        async cleanup(): Promise<void> { }
                    };

                    iterationContainer.register(RATE_LIMIT_TYPES.CONFIG, { useValue: mockConfig });
                    iterationContainer.register(RATE_LIMIT_TYPES.STORE, { useValue: mockStore });
                    const middleware = iterationContainer.resolve(RateLimitService);
                    const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;
                    await middleware.check(mockEvent);

                    const allMocksUsed = keyGeneratorCalled && skipCalled && incrementCalled;
                    iterationContainer.clearInstances();
                    return allMocksUsed;
                }
            ),
            { numRuns: 100 }
        );
    });
});
