import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { DummyEventSource, DummyFramework } from "../../src";
import { ContainerModule } from "inversify";
import { FlexibleEvent } from "../../src/event";
import { IfEventIs } from "../../src/flexible/filter/if-event-is";
import { EventData } from "../../src/flexible/extractor/event-data";
import { SilentLoggerModule } from "../../src/flexible/logging/silent-logger-module";
import { RateLimitMiddleware, MemoryRateLimitStore, SecurityError } from "../../src/security";

describe("RateLimitMiddleware Integration Tests", () => {

    let app: FlexibleApp;
    let eventSource: DummyEventSource;
    let framework: DummyFramework;
    let rateLimitStore: MemoryRateLimitStore;

    beforeEach(() => {
        eventSource = new DummyEventSource();
        framework = new DummyFramework();
        rateLimitStore = new MemoryRateLimitStore();

        app = FlexibleAppBuilder.instance
            .withLogger(new SilentLoggerModule())
            .addEventSource({
                getInstance: () => eventSource,
                container: new ContainerModule(() => { }),
                isolatedContainer: new ContainerModule(() => { })
            })
            .addFramework({
                getInstance: () => framework,
                container: new ContainerModule(() => { }),
                isolatedContainer: new ContainerModule(() => { })
            })
            .createApp();
    });

    afterEach(() => {
        rateLimitStore.destroy();
    });

    it("should allow requests within rate limit", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 5;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;

        const event: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.1",
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: event.eventType }
            }],
            middlewareStack: [
                // Rate limit middleware
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                // Main handler
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Make 3 requests (within limit of 5)
        const result1 = await eventSource.generateEvent(event);
        const result2 = await eventSource.generateEvent(event);
        const result3 = await eventSource.generateEvent(event);

        // Assert - Requests should succeed (no errors thrown)
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result3).toBeDefined();
    });

    it("should block requests exceeding rate limit", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 3;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;

        const event: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.2",
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: event.eventType }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Make 4 requests (exceeds limit of 3)
        await eventSource.generateEvent(event);
        await eventSource.generateEvent(event);
        await eventSource.generateEvent(event);

        // The 4th request should have an error in the errorStack
        const result4 = await eventSource.generateEvent(event);

        // Assert - Error should be in the errorStack
        expect(result4[0].errorStack.length).toBe(1);
        expect(result4[0].errorStack[0]).toBeInstanceOf(SecurityError);
        expect((result4[0].errorStack[0] as SecurityError).statusCode).toBe(429);
        expect((result4[0].errorStack[0] as SecurityError).message).toContain("Too many requests");
    });

    it("should track different clients separately", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 2;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;

        const event1: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.10",
            data: { test: "data" },
            routeData: {}
        };

        const event2: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.20",
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: "testEvent" }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Each client makes 2 requests (at their limit)
        const result1a = await eventSource.generateEvent(event1);
        const result1b = await eventSource.generateEvent(event1);
        const result2a = await eventSource.generateEvent(event2);
        const result2b = await eventSource.generateEvent(event2);

        // Assert - Both clients should succeed (no errors thrown)
        expect(result1a).toBeDefined();
        expect(result1b).toBeDefined();
        expect(result2a).toBeDefined();
        expect(result2b).toBeDefined();

        // Act - Each client tries one more request (exceeds limit)
        const result1c = await eventSource.generateEvent(event1);
        const result2c = await eventSource.generateEvent(event2);

        // Assert - Both clients should be blocked (errors in errorStack)
        expect(result1c[0].errorStack.length).toBe(1);
        expect(result1c[0].errorStack[0]).toBeInstanceOf(SecurityError);
        expect(result2c[0].errorStack.length).toBe(1);
        expect(result2c[0].errorStack[0]).toBeInstanceOf(SecurityError);
    });

    it("should use custom key generator", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 2;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;
        rateLimitMiddleware.keyGenerator = (event: FlexibleEvent) => {
            return (event as any).userId || 'anonymous';
        };

        const event1: any = {
            eventType: "testEvent",
            userId: "user-123",
            sourceIp: "192.168.1.1", // Same IP
            data: { test: "data" },
            routeData: {}
        };

        const event2: any = {
            eventType: "testEvent",
            userId: "user-456",
            sourceIp: "192.168.1.1", // Same IP, different user
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: "testEvent" }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Each user makes 2 requests (at their limit)
        const result1a = await eventSource.generateEvent(event1);
        const result1b = await eventSource.generateEvent(event1);
        const result2a = await eventSource.generateEvent(event2);
        const result2b = await eventSource.generateEvent(event2);

        // Assert - Both users should succeed (tracked separately by userId, no errors thrown)
        expect(result1a).toBeDefined();
        expect(result1b).toBeDefined();
        expect(result2a).toBeDefined();
        expect(result2b).toBeDefined();
    });

    it("should skip rate limiting when skip function returns true", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 1;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;
        rateLimitMiddleware.skip = (event: FlexibleEvent) => {
            return (event as any).skipRateLimit === true;
        };

        const normalEvent: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.1",
            data: { test: "data" },
            routeData: {}
        };

        const skippedEvent: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.1",
            skipRateLimit: true,
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: "testEvent" }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Make 1 normal request (at limit)
        const result1 = await eventSource.generateEvent(normalEvent);
        expect(result1).toBeDefined();

        // Act - Make multiple skipped requests (should all succeed, no errors thrown)
        const result2 = await eventSource.generateEvent(skippedEvent);
        const result3 = await eventSource.generateEvent(skippedEvent);
        const result4 = await eventSource.generateEvent(skippedEvent);

        // Assert - Skipped requests should all succeed
        expect(result2).toBeDefined();
        expect(result3).toBeDefined();
        expect(result4).toBeDefined();
    });

    it("should use custom error message", async () => {
        // Arrange
        const customMessage = "Custom rate limit message";
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 1;
        rateLimitMiddleware.windowMs = 60000;
        rateLimitMiddleware.store = rateLimitStore;
        rateLimitMiddleware.message = customMessage;

        const event: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.1",
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: "testEvent" }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Exceed rate limit
        await eventSource.generateEvent(event);
        const result2 = await eventSource.generateEvent(event);

        // Assert - Error should be in errorStack with custom message
        expect(result2[0].errorStack.length).toBe(1);
        expect(result2[0].errorStack[0]).toBeInstanceOf(SecurityError);
        expect((result2[0].errorStack[0] as SecurityError).message).toBe(customMessage);
    });

    it("should reset rate limit after window expires", async () => {
        // Arrange
        const rateLimitMiddleware = new RateLimitMiddleware();
        rateLimitMiddleware.max = 2;
        rateLimitMiddleware.windowMs = 100; // 100ms window for fast test
        rateLimitMiddleware.store = rateLimitStore;

        const event: any = {
            eventType: "testEvent",
            sourceIp: "192.168.1.1",
            data: { test: "data" },
            routeData: {}
        };

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{ eventType: "testEvent" }
            }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                            await rateLimitMiddleware.check(eventData);
                            return null;
                        }
                    },
                    extractorRecipes: {
                        0: {
                            configuration: {},
                            type: EventData
                        }
                    }
                },
                {
                    activationContext: {
                        activate: async () => {
                            return { success: true };
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        // Act - Make 2 requests (at limit)
        await eventSource.generateEvent(event);
        await eventSource.generateEvent(event);

        // Try 3rd request (should fail - error in errorStack)
        const result3 = await eventSource.generateEvent(event);
        expect(result3[0].errorStack.length).toBe(1);
        expect(result3[0].errorStack[0]).toBeInstanceOf(SecurityError);

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 150));

        // Act - Make 2 more requests (should succeed in new window, no errors thrown)
        const result1 = await eventSource.generateEvent(event);
        const result2 = await eventSource.generateEvent(event);

        // Assert
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
    });
});
