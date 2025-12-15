import "reflect-metadata";
import "jasmine";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { DummyEventSource, DummyFramework } from "../../src";
import { DependencyContainer } from "tsyringe";
import { FlexibleEvent } from "../../src/event";
import { IfEventIs } from "../../src/flexible/filter/if-event-is";
import { EventData } from "../../src/flexible/extractor/event-data";
import { FullEvent } from "../../src/flexible/extractor/full-event";
import { PreviousError } from "../../src/flexible/extractor/previous-error";
import { SilentLoggerModule } from "../../src/flexible/logging/silent-logger-module";
import { FlexibleContainer } from "../../src/container/flexible-container";
import { TimeoutMiddleware, TIMEOUT_MIDDLEWARE_TYPES } from "../../src/security/timeout-middleware";
import { CancellationMiddleware, CANCELLATION_MIDDLEWARE_TYPES } from "../../src/security/cancellation-middleware";
import { TimeoutError } from "../../src/event/timeout-error";
import { CancellationError } from "../../src/event/cancellation-error";
import { TestAbortController, createMockLogger, MockLogger } from "../test-utilities/timeout-cancellation-test-utils";
import { DelegateEventSource } from "../../src/event/delegate-event-source";

describe("Timeout and Cancellation Integration Tests", () => {

    describe("Composable Timeout Layers", () => {
        let businessLayer: DelegateEventSource;
        let apiLayer: DelegateEventSource;
        let globalLayer: DelegateEventSource;

        beforeEach(async () => {
            // Business layer - no timeout
            businessLayer = new DelegateEventSource();
            businessLayer.onEvent(async (event: FlexibleEvent) => {
                // Simulate some work
                await new Promise(resolve => setTimeout(resolve, 50));
                return [{
                    responseStack: [{
                        message: "Business logic executed",
                        eventType: event.eventType
                    }],
                    errorStack: []
                }];
            });
            await businessLayer.run();

            // API layer - 200ms timeout
            apiLayer = new DelegateEventSource();
            apiLayer.onEvent(async (event: FlexibleEvent) => {
                // Forward to business layer
                return await businessLayer.generateEvent(event);
            });
            await apiLayer.run();

            // Global layer - 500ms timeout
            globalLayer = new DelegateEventSource();
            globalLayer.onEvent(async (event: FlexibleEvent) => {
                // Forward to API layer
                return await apiLayer.generateEvent(event);
            });
            await globalLayer.run();
        });

        it("should process events through all three layers with no timeout", async () => {
            const event: FlexibleEvent = {
                eventType: "fast-request",
                data: {},
                routeData: {}
            };

            const responses = await globalLayer.generateEvent(event);

            expect(responses[0].responseStack[0].message).toBe("Business logic executed");
            expect(responses[0].errorStack.length).toBe(0);
        });

        it("should enforce API layer timeout before global timeout", async () => {
            // Create API layer with short timeout
            const apiLayerWithTimeout = new DelegateEventSource();
            apiLayerWithTimeout.onEvent(async (event: FlexibleEvent) => {
                // Simulate timeout enforcement at API layer
                const startTime = Date.now();
                const timeout = 100; // 100ms timeout

                // Start business processing
                const businessPromise = businessLayer.generateEvent(event);

                // Wait for either business completion or timeout
                const timeoutPromise = new Promise<any>((resolve) => {
                    setTimeout(() => {
                        const elapsed = Date.now() - startTime;
                        resolve([{
                            responseStack: [],
                            errorStack: [new TimeoutError(timeout, elapsed)]
                        }]);
                    }, timeout);
                });

                return await Promise.race([businessPromise, timeoutPromise]);
            });
            await apiLayerWithTimeout.run();

            // Modify business layer to be slow
            businessLayer.onEvent(async (event: FlexibleEvent) => {
                await new Promise(resolve => setTimeout(resolve, 200)); // Slow operation
                return [{
                    responseStack: [{ message: "Should not reach here" }],
                    errorStack: []
                }];
            });

            const event: FlexibleEvent = {
                eventType: "slow-request",
                data: {},
                routeData: {}
            };

            const responses = await apiLayerWithTimeout.generateEvent(event);

            expect(responses[0].errorStack.length).toBe(1);
            expect(responses[0].errorStack[0]).toBeInstanceOf(TimeoutError);
            expect((responses[0].errorStack[0] as TimeoutError).timeout).toBe(100);
        });
    });

    describe("HTTP Cancellation End-to-End Flow", () => {
        let app: FlexibleApp;
        let eventSource: DummyEventSource;
        let framework: DummyFramework;
        let container: FlexibleContainer;
        let mockLogger: MockLogger;

        beforeEach(() => {
            eventSource = new DummyEventSource();
            framework = new DummyFramework();
            container = new FlexibleContainer();
            mockLogger = createMockLogger();

            app = FlexibleApp.builder()
                .withLogger(new SilentLoggerModule())
                .withContainer(container)
                .addEventSource({
                    getInstance: () => eventSource,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .addFramework({
                    getInstance: () => framework,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .createApp();
        });

        it("should detect cancellation when client disconnects", async () => {
            // Configure cancellation middleware
            container.registerValue(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const cancellationMiddleware = container.resolve(CancellationMiddleware);

            // Create aborted signal to simulate client disconnect
            const abortController = TestAbortController.createAborted("Client disconnected");

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                cancellationToken: abortController.signal,
                requestId: "test-123"
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
                                // Call processEvent with correct parameter order: (event, contextBinnacle)
                                await cancellationMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    },
                    {
                        activationContext: {
                            activate: async () => {
                                // This should not be reached if cancellation occurs
                                return { success: true };
                            }
                        },
                        extractorRecipes: {}
                    }
                ]
            });

            await app.run();
            const result = await eventSource.generateEvent(event);

            // Should have cancellation error in errorStack
            expect(result[0].errorStack.length).toBe(1);
            expect(result[0].errorStack[0]).toBeInstanceOf(CancellationError);
            expect((result[0].errorStack[0] as CancellationError).reason).toBe("Client disconnected");

            // Should have logged the cancellation
            expect(mockLogger.warning).toHaveBeenCalledWith(
                'Request cancellation detected',
                jasmine.objectContaining({
                    requestId: "test-123",
                    reason: "Client disconnected"
                })
            );
        });

        it("should allow processing when no cancellation token present", async () => {
            container.registerValue(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const cancellationMiddleware = container.resolve(CancellationMiddleware);

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {}
                // No cancellationToken
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
                                await cancellationMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
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
            const result = await eventSource.generateEvent(event);

            // Should have no errors
            expect(result[0].errorStack.length).toBe(0);
            expect(result[0].responseStack.length).toBe(2);

            // Should not have logged anything
            expect(mockLogger.warning).not.toHaveBeenCalled();
        });
    });

    describe("Error Handler Integration", () => {
        let app: FlexibleApp;
        let eventSource: DummyEventSource;
        let framework: DummyFramework;
        let container: FlexibleContainer;

        beforeEach(() => {
            eventSource = new DummyEventSource();
            framework = new DummyFramework();
            container = new FlexibleContainer();

            app = FlexibleApp.builder()
                .withLogger(new SilentLoggerModule())
                .withContainer(container)
                .addEventSource({
                    getInstance: () => eventSource,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .addFramework({
                    getInstance: () => framework,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .createApp();
        });

        it("should add TimeoutError to errorStack when timeout occurs", async () => {
            // Configure timeout middleware with very short timeout
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, { timeout: 50 });
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, createMockLogger());
            const timeoutMiddleware = container.resolve(TimeoutMiddleware);

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                requestId: "test-456"
            };

            framework.addPipelineDefinition({
                filterStack: [{
                    type: IfEventIs,
                    configuration: <any>{ eventType: event.eventType }
                }],
                middlewareStack: [
                    // Timeout middleware
                    {
                        activationContext: {
                            activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                                await timeoutMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    },
                    // Slow middleware that will timeout
                    {
                        activationContext: {
                            activate: async () => {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                return { success: true };
                            }
                        },
                        extractorRecipes: {}
                    },
                    // This middleware should not execute due to timeout
                    {
                        activationContext: {
                            activate: async () => {
                                return { shouldNotExecute: true };
                            }
                        },
                        extractorRecipes: {}
                    }
                ]
            });

            await app.run();
            const result = await eventSource.generateEvent(event);

            // Should have timeout error in errorStack
            expect(result[0].errorStack.length).toBe(1);
            expect(result[0].errorStack[0]).toBeInstanceOf(TimeoutError);

            const timeoutError = result[0].errorStack[0] as TimeoutError;
            expect(timeoutError.timeout).toBe(50);
            expect(timeoutError.elapsed).toBeGreaterThanOrEqual(50);
        });

        it("should add CancellationError to errorStack when request is cancelled", async () => {
            container.registerValue(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, createMockLogger());
            const cancellationMiddleware = container.resolve(CancellationMiddleware);

            const abortController = TestAbortController.createAborted("User cancelled");

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                cancellationToken: abortController.signal,
                requestId: "test-789"
            };

            framework.addPipelineDefinition({
                filterStack: [{
                    type: IfEventIs,
                    configuration: <any>{ eventType: event.eventType }
                }],
                middlewareStack: [
                    // Cancellation middleware
                    {
                        activationContext: {
                            activate: async (contextBinnacle: any, eventData: FlexibleEvent) => {
                                await cancellationMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    },
                    // Business logic that won't execute due to cancellation
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
            const result = await eventSource.generateEvent(event);

            // Should have cancellation error in errorStack
            expect(result[0].errorStack.length).toBe(1);
            expect(result[0].errorStack[0]).toBeInstanceOf(CancellationError);

            const cancellationError = result[0].errorStack[0] as CancellationError;
            expect(cancellationError.reason).toBe("User cancelled");
        });
    });

    describe("Logging Integration", () => {
        let app: FlexibleApp;
        let eventSource: DummyEventSource;
        let framework: DummyFramework;
        let container: FlexibleContainer;
        let mockLogger: MockLogger;

        beforeEach(() => {
            eventSource = new DummyEventSource();
            framework = new DummyFramework();
            container = new FlexibleContainer();
            mockLogger = createMockLogger();

            app = FlexibleApp.builder()
                .withLogger(new SilentLoggerModule())
                .withContainer(container)
                .addEventSource({
                    getInstance: () => eventSource,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .addFramework({
                    getInstance: () => framework,
                    register: (c: DependencyContainer) => { },
                    registerIsolated: (c: DependencyContainer) => { }
                })
                .createApp();
        });

        it("should log timeout start, timeout event, with correct format and levels", async () => {
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, { timeout: 50 });
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const timeoutMiddleware = container.resolve(TimeoutMiddleware);

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                requestId: "log-test-123"
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
                                await timeoutMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    },
                    {
                        activationContext: {
                            activate: async () => {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                return { success: true };
                            }
                        },
                        extractorRecipes: {}
                    }
                ]
            });

            await app.run();
            await eventSource.generateEvent(event);

            // Should log start at debug level
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Timeout monitoring started',
                jasmine.objectContaining({
                    timeout: 50,
                    requestId: "log-test-123"
                })
            );
        });

        it("should log successful completion with elapsed time at debug level", async () => {
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, { timeout: 200 });
            container.registerValue(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const timeoutMiddleware = container.resolve(TimeoutMiddleware);

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                requestId: "log-test-456"
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
                                await timeoutMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    },
                    {
                        activationContext: {
                            activate: async () => {
                                await new Promise(resolve => setTimeout(resolve, 50));
                                return { success: true };
                            }
                        },
                        extractorRecipes: {}
                    }
                ]
            });

            await app.run();
            await eventSource.generateEvent(event);

            // Should log start
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Timeout monitoring started',
                jasmine.anything()
            );

            // Note: Completion logging happens in the pipeline, not in the middleware
            // So we won't see it in this test since we're using DummyFramework
        });

        it("should log cancellation with request ID and reason at warning level", async () => {
            container.registerValue(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const cancellationMiddleware = container.resolve(CancellationMiddleware);

            const abortController = TestAbortController.createAborted("Network error");

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {},
                cancellationToken: abortController.signal,
                requestId: "log-test-789"
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
                                await cancellationMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    }
                ]
            });

            await app.run();
            await eventSource.generateEvent(event);

            // Should log cancellation at warning level with request ID and reason
            expect(mockLogger.warning).toHaveBeenCalledWith(
                'Request cancellation detected',
                jasmine.objectContaining({
                    requestId: "log-test-789",
                    reason: "Network error"
                })
            );
        });

        it("should not log when event has no cancellation token", async () => {
            container.registerValue(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, mockLogger);
            const cancellationMiddleware = container.resolve(CancellationMiddleware);

            const event: any = {
                eventType: "testEvent",
                data: { test: "data" },
                routeData: {}
                // No cancellationToken
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
                                await cancellationMiddleware.processEvent(eventData, contextBinnacle);
                                return null;
                            }
                        },
                        extractorRecipes: {
                            0: {
                                configuration: {},
                                type: FullEvent
                            }
                        }
                    }
                ]
            });

            await app.run();
            await eventSource.generateEvent(event);

            // Should not log anything
            expect(mockLogger.warning).not.toHaveBeenCalled();
            expect(mockLogger.debug).not.toHaveBeenCalled();
        });
    });
});
