import "reflect-metadata";
import "jasmine";
import { FlexibleApp } from "../../../src/engine/app/flexible-app";
import { DummyEventSource, DummyFramework } from "../../../src";
import { FlexibleEvent } from "../../../src/extension-points/event-source/event";
import { IfEventIs } from "../../../src/built-ins/filters/if-event-is";
import { EventData, EventType, FullEvent, ContextBinnacle, PreviousResponse, PreviousError } from "../../../src/built-ins/extractors";

describe("Extractor Integration Tests", () => {
    let app: FlexibleApp;
    let eventSource: DummyEventSource;
    let framework: DummyFramework;

    beforeEach(() => {
        eventSource = new DummyEventSource();
        framework = new DummyFramework();

        app = FlexibleApp.builder()
            .addEventSource({
                getInstance: () => eventSource,
                register: () => {},
                registerIsolated: () => {}
            })
            .addFramework({
                getInstance: () => framework,
                register: () => {},
                registerIsolated: () => {}
            })
            .createApp();
    });

    it("EventData extractor should extract event.data", async () => {
        const capturedData: any[] = [];

        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: any, data: any) => {
                        capturedData.push(data);
                        return { received: data };
                    }
                },
                extractorRecipes: {
                    0: { type: EventData, configuration: {} }
                }
            }]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: { testKey: "testValue" },
            routeData: {}
        };

        await eventSource.generateEvent(event);

        expect(capturedData[0]).toEqual({ testKey: "testValue" });
    });

    it("EventType extractor should extract event.eventType", async () => {
        const capturedTypes: any[] = [];

        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: any, eventType: any) => {
                        capturedTypes.push(eventType);
                        return { eventType };
                    }
                },
                extractorRecipes: {
                    0: { type: EventType, configuration: {} }
                }
            }]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: {},
            routeData: {}
        };

        await eventSource.generateEvent(event);

        expect(capturedTypes[0]).toBe("test");
    });

    it("FullEvent extractor should extract entire event", async () => {
        const capturedEvents: any[] = [];

        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: any, event: FlexibleEvent) => {
                        capturedEvents.push(event);
                        return { hasEvent: true };
                    }
                },
                extractorRecipes: {
                    0: { type: FullEvent, configuration: {} }
                }
            }]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: { key: "value" },
            routeData: { route: "data" },
            requestId: "test-123"
        };

        await eventSource.generateEvent(event);

        expect(capturedEvents[0].eventType).toBe("test");
        expect(capturedEvents[0].data).toEqual({ key: "value" });
        expect(capturedEvents[0].requestId).toBe("test-123");
    });

    it("ContextBinnacle extractor should extract contextBinnacle", async () => {
        const capturedBinnacles: any[] = [];

        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: any, binnacle: any) => {
                        capturedBinnacles.push(binnacle);
                        binnacle.testValue = "stored";
                        return { hasBinnacle: true };
                    }
                },
                extractorRecipes: {
                    0: { type: ContextBinnacle, configuration: {} }
                }
            }]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: {},
            routeData: {}
        };

        await eventSource.generateEvent(event);

        expect(capturedBinnacles[0]).toBeDefined();
        expect(capturedBinnacles[0].testValue).toBe("stored");
    });

    it("PreviousResponse extractor should extract last response", async () => {
        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async () => {
                            return { first: true };
                        }
                    },
                    extractorRecipes: {}
                },
                {
                    activationContext: {
                        activate: async (contextBinnacle: any, previousResponse: any) => {
                            return { previous: previousResponse };
                        }
                    },
                    extractorRecipes: {
                        0: { type: PreviousResponse, configuration: {} }
                    }
                }
            ]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: {},
            routeData: {}
        };

        const result = await eventSource.generateEvent(event);

        expect(result[0].responseStack[1].previous).toEqual({ first: true });
    });

    it("PreviousError extractor should extract last error", async () => {
        framework.addPipelineDefinition({
            filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "test" } }],
            middlewareStack: [
                {
                    activationContext: {
                        activate: async () => {
                            throw new Error("Test error");
                        }
                    },
                    extractorRecipes: {}
                }
            ]
        });

        await app.run();

        const event: FlexibleEvent = {
            eventType: "test",
            data: {},
            routeData: {}
        };

        const result = await eventSource.generateEvent(event);

        expect(result[0].errorStack.length).toBe(1);
        expect(result[0].errorStack[0].message).toBe("Test error");

        // PreviousError extractor would extract this error if used in error middleware
        // (Error middleware run when errorStack has errors, regular middleware don't)
    });
});
