import "reflect-metadata";
import "jasmine";
import { DelegateEventSource } from "../../src/event/delegate-event-source";
import { FlexibleEvent } from "../../src/event/flexible-event";
import { FlexibleResponse } from "../../src/flexible/flexible-response";

describe("Composable Applications with DelegateEventSource", () => {
    describe("DelegateEventSource", () => {
        it("should start and stop successfully", async () => {
            const source = new DelegateEventSource();

            const started = await source.run();
            expect(started).toBe(true);

            const stopped = await source.stop();
            expect(stopped).toBe(true);
        });

        it("should throw error when generating event before running", async () => {
            const source = new DelegateEventSource();
            const event: FlexibleEvent = {
                eventType: "test",
                data: {},
                routeData: {}
            };

            try {
                await source.generateEvent(event);
                fail("Should have thrown error");
            } catch (error: any) {
                expect(error.message).toContain("not running");
            }
        });

        it("should throw error when no handler registered", async () => {
            const source = new DelegateEventSource();
            await source.run();

            const event: FlexibleEvent = {
                eventType: "test",
                data: {},
                routeData: {}
            };

            try {
                await source.generateEvent(event);
                fail("Should have thrown error");
            } catch (error: any) {
                expect(error.message).toContain("No event handler");
            }
        });

        it("should forward events to registered handler", async () => {
            const source = new DelegateEventSource();

            // Register handler
            const mockHandler = jasmine.createSpy('handler').and.returnValue(
                Promise.resolve([{
                    responseStack: [{ message: "handled" }],
                    errorStack: []
                }])
            );

            source.onEvent(mockHandler);
            await source.run();

            // Generate event
            const event: FlexibleEvent = {
                eventType: "test",
                data: { value: 123 },
                routeData: {}
            };

            const responses = await source.generateEvent(event);

            expect(mockHandler).toHaveBeenCalledWith(event);
            expect(responses.length).toBe(1);
            expect(responses[0].responseStack[0].message).toBe("handled");
        });
    });

    describe("Two-Layer Composable Architecture", () => {
        let businessLayer: DelegateEventSource;
        let securityLayer: DelegateEventSource;

        beforeEach(async () => {
            // Business layer
            businessLayer = new DelegateEventSource();
            businessLayer.onEvent(async (event: FlexibleEvent) => {
                return [{
                    responseStack: [{
                        message: "Business logic executed",
                        eventType: event.eventType
                    }],
                    errorStack: []
                }];
            });
            await businessLayer.run();

            // Security layer that forwards to business
            securityLayer = new DelegateEventSource();
            securityLayer.onEvent(async (event: FlexibleEvent) => {
                // Security check
                if ((event as any).blocked) {
                    return [{
                        responseStack: [{
                            error: "Access denied",
                            statusCode: 403
                        }],
                        errorStack: []
                    }];
                }

                // Forward to business layer
                return await businessLayer.generateEvent(event);
            });
            await securityLayer.run();
        });

        it("should forward events from security to business layer", async () => {
            const event: FlexibleEvent = {
                eventType: "test-event",
                data: {},
                routeData: {}
            };

            const responses = await securityLayer.generateEvent(event);

            expect(responses.length).toBe(1);
            expect(responses[0].responseStack[0].message).toBe("Business logic executed");
            expect(responses[0].responseStack[0].eventType).toBe("test-event");
        });

        it("should block events at security layer when needed", async () => {
            const event: FlexibleEvent = {
                eventType: "blocked-event",
                data: {},
                routeData: {},
                blocked: true
            } as any;

            const responses = await securityLayer.generateEvent(event);

            expect(responses.length).toBe(1);
            expect(responses[0].responseStack[0].error).toBe("Access denied");
            expect(responses[0].responseStack[0].statusCode).toBe(403);
        });

        it("should allow business layer to work independently", async () => {
            const event: FlexibleEvent = {
                eventType: "direct-event",
                data: {},
                routeData: {}
            };

            const responses = await businessLayer.generateEvent(event);

            expect(responses[0].responseStack[0].message).toBe("Business logic executed");
            expect(responses[0].responseStack[0].eventType).toBe("direct-event");
        });
    });

    describe("Three-Layer Composable Architecture", () => {
        let businessLayer: DelegateEventSource;
        let securityLayer: DelegateEventSource;
        let rateLimitLayer: DelegateEventSource;
        let requestCount: number;
        const MAX_REQUESTS = 3;

        beforeEach(async () => {
            requestCount = 0;

            // Business layer
            businessLayer = new DelegateEventSource();
            businessLayer.onEvent(async (event: FlexibleEvent) => {
                return [{
                    responseStack: [{
                        message: "Business logic executed",
                        eventType: event.eventType
                    }],
                    errorStack: []
                }];
            });
            await businessLayer.run();

            // Security layer
            securityLayer = new DelegateEventSource();
            securityLayer.onEvent(async (event: FlexibleEvent) => {
                if ((event as any).blocked) {
                    return [{
                        responseStack: [{
                            error: "Access denied",
                            statusCode: 403
                        }],
                        errorStack: []
                    }];
                }
                return await businessLayer.generateEvent(event);
            });
            await securityLayer.run();

            // Rate limit layer
            rateLimitLayer = new DelegateEventSource();
            rateLimitLayer.onEvent(async (event: FlexibleEvent) => {
                requestCount++;

                if (requestCount > MAX_REQUESTS) {
                    return [{
                        responseStack: [{
                            error: "Too many requests",
                            statusCode: 429
                        }],
                        errorStack: []
                    }];
                }

                return await securityLayer.generateEvent(event);
            });
            await rateLimitLayer.run();
        });

        it("should process events through all three layers", async () => {
            const event: FlexibleEvent = {
                eventType: "three-layer-test",
                data: {},
                routeData: {}
            };

            const responses = await rateLimitLayer.generateEvent(event);

            expect(responses[0].responseStack[0].message).toBe("Business logic executed");
            expect(responses[0].responseStack[0].eventType).toBe("three-layer-test");
        });

        it("should enforce rate limiting before reaching business layer", async () => {
            const event: FlexibleEvent = {
                eventType: "rate-limit-test",
                data: {},
                routeData: {}
            };

            // First 3 requests should succeed
            for (let i = 0; i < 3; i++) {
                const responses = await rateLimitLayer.generateEvent(event);
                expect(responses[0].responseStack[0].message).toBe("Business logic executed");
            }

            // 4th request should be rate limited
            const blockedResponse = await rateLimitLayer.generateEvent(event);
            expect(blockedResponse[0].responseStack[0].error).toBe("Too many requests");
            expect(blockedResponse[0].responseStack[0].statusCode).toBe(429);
        });

        it("should block at security layer even if rate limit passes", async () => {
            const event: FlexibleEvent = {
                eventType: "blocked-at-security",
                data: {},
                routeData: {},
                blocked: true
            } as any;

            const responses = await rateLimitLayer.generateEvent(event);

            expect(responses[0].responseStack[0].error).toBe("Access denied");
            expect(responses[0].responseStack[0].statusCode).toBe(403);
        });

        it("should maintain independent request counts per layer", async () => {
            const event1: FlexibleEvent = {
                eventType: "event-1",
                data: {},
                routeData: {}
            };
            const event2: FlexibleEvent = {
                eventType: "event-2",
                data: {},
                routeData: {}
            };

            const responses1 = await rateLimitLayer.generateEvent(event1);
            const responses2 = await rateLimitLayer.generateEvent(event2);

            expect(responses1[0].responseStack[0].eventType).toBe("event-1");
            expect(responses2[0].responseStack[0].eventType).toBe("event-2");
        });
    });
});
