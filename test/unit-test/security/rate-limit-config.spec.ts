import "jasmine";
import { RateLimitConfig, RATE_LIMIT_TYPES } from "../../../src";
import { FlexibleEvent } from "../../../src/event";

describe("RateLimitConfig", () => {
    describe("constructor", () => {
        it("should create config with required properties", () => {
            const config = new RateLimitConfig({
                max: 50,
                windowMs: 30000
            });

            expect(config.max).toBe(50);
            expect(config.windowMs).toBe(30000);
        });

        it("should use default message when not provided", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            expect(config.message).toBe('Too many requests, please try again later');
        });

        it("should use custom message when provided", () => {
            const customMessage = 'Rate limit exceeded';
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000,
                message: customMessage
            });

            expect(config.message).toBe(customMessage);
        });

        it("should use default keyGenerator when not provided", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            const mockEvent = { sourceIp: '192.168.1.1' } as any as FlexibleEvent;
            const key = config.keyGenerator(mockEvent);

            expect(key).toBe('192.168.1.1');
        });

        it("should use custom keyGenerator when provided", () => {
            const customKeyGen = (event: FlexibleEvent) => 'custom-key';
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000,
                keyGenerator: customKeyGen
            });

            const mockEvent = {} as FlexibleEvent;
            const key = config.keyGenerator(mockEvent);

            expect(key).toBe('custom-key');
        });

        it("should use default skip function when not provided", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            const mockEvent = {} as FlexibleEvent;
            const shouldSkip = config.skip(mockEvent);

            expect(shouldSkip).toBe(false);
        });

        it("should use custom skip function when provided", () => {
            const customSkip = (event: FlexibleEvent) => true;
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000,
                skip: customSkip
            });

            const mockEvent = {} as FlexibleEvent;
            const shouldSkip = config.skip(mockEvent);

            expect(shouldSkip).toBe(true);
        });

        it("should handle missing sourceIp in default keyGenerator", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            const mockEvent = {} as FlexibleEvent;
            const key = config.keyGenerator(mockEvent);

            expect(key).toBe('unknown');
        });
    });

    describe("createDefault()", () => {
        it("should create config with default max value", () => {
            const config = RateLimitConfig.createDefault();

            expect(config.max).toBe(100);
        });

        it("should create config with default windowMs value", () => {
            const config = RateLimitConfig.createDefault();

            expect(config.windowMs).toBe(60000);
        });

        it("should create config with default message", () => {
            const config = RateLimitConfig.createDefault();

            expect(config.message).toBe('Too many requests, please try again later');
        });

        it("should create config with default keyGenerator", () => {
            const config = RateLimitConfig.createDefault();

            const mockEvent = { sourceIp: '10.0.0.1' } as any as FlexibleEvent;
            const key = config.keyGenerator(mockEvent);

            expect(key).toBe('10.0.0.1');
        });

        it("should create config with default skip function", () => {
            const config = RateLimitConfig.createDefault();

            const mockEvent = {} as FlexibleEvent;
            const shouldSkip = config.skip(mockEvent);

            expect(shouldSkip).toBe(false);
        });
    });

    describe("readonly properties", () => {
        it("should have readonly max property", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            // TypeScript will catch this at compile time, but we can verify the property descriptor
            const descriptor = Object.getOwnPropertyDescriptor(config, 'max');
            expect(descriptor?.writable).toBe(false);
        });

        it("should have readonly windowMs property", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            const descriptor = Object.getOwnPropertyDescriptor(config, 'windowMs');
            expect(descriptor?.writable).toBe(false);
        });

        it("should have readonly message property", () => {
            const config = new RateLimitConfig({
                max: 100,
                windowMs: 60000
            });

            const descriptor = Object.getOwnPropertyDescriptor(config, 'message');
            expect(descriptor?.writable).toBe(false);
        });
    });
});

describe("RATE_LIMIT_TYPES", () => {
    it("should export CONFIG symbol", () => {
        expect(RATE_LIMIT_TYPES.CONFIG).toBeDefined();
        expect(typeof RATE_LIMIT_TYPES.CONFIG).toBe('symbol');
    });

    it("should export STORE symbol", () => {
        expect(RATE_LIMIT_TYPES.STORE).toBeDefined();
        expect(typeof RATE_LIMIT_TYPES.STORE).toBe('symbol');
    });

    it("should have unique symbols", () => {
        expect(RATE_LIMIT_TYPES.CONFIG).not.toBe(RATE_LIMIT_TYPES.STORE);
    });

    it("should have descriptive symbol descriptions", () => {
        expect(RATE_LIMIT_TYPES.CONFIG.toString()).toContain('RateLimitConfig');
        expect(RATE_LIMIT_TYPES.STORE.toString()).toContain('RateLimitStore');
    });
});
