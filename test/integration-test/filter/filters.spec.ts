import "reflect-metadata";
import "jasmine";
import { FlexibleApp } from "../../../src/engine/app/flexible-app";
import { DummyEventSource, DummyFramework } from "../../../src";
import { FlexibleEvent } from "../../../src/extension-points/event-source/event";
import { IfEventIs } from "../../../src/built-ins/filters/if-event-is";
import { Everything } from "../../../src/built-ins/filters/everything";

describe("Filter Integration Tests", () => {
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

    describe("IfEventIs Filter", () => {
        it("should match events with correct eventType", async () => {
            let handlerCalled = false;

            framework.addPipelineDefinition({
                filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "matchMe" } }],
                middlewareStack: [{
                    activationContext: {
                        activate: async () => {
                            handlerCalled = true;
                            return { matched: true };
                        }
                    },
                    extractorRecipes: {}
                }]
            });

            await app.run();

            const event: FlexibleEvent = {
                eventType: "matchMe",
                data: {},
                routeData: {}
            };

            const result = await eventSource.generateEvent(event);

            expect(handlerCalled).toBe(true);
            expect(result[0].responseStack[0].matched).toBe(true);
        });

        it("should not match events with different eventType", async () => {
            let handlerCalled = false;

            framework.addPipelineDefinition({
                filterStack: [{ type: IfEventIs, configuration: <any>{ eventType: "matchMe" } }],
                middlewareStack: [{
                    activationContext: {
                        activate: async () => {
                            handlerCalled = true;
                            return { matched: true };
                        }
                    },
                    extractorRecipes: {}
                }]
            });

            await app.run();

            const event: FlexibleEvent = {
                eventType: "different",
                data: {},
                routeData: {}
            };

            const result = await eventSource.generateEvent(event);

            expect(handlerCalled).toBe(false);
            expect(result.length).toBe(0);
        });
    });

    describe("Everything Filter", () => {
        it("should match all events", async () => {
            let matchCount = 0;

            framework.addPipelineDefinition({
                filterStack: [{ type: Everything, configuration: {} }],
                middlewareStack: [{
                    activationContext: {
                        activate: async () => {
                            matchCount++;
                            return { matched: true };
                        }
                    },
                    extractorRecipes: {}
                }]
            });

            await app.run();

            const events: FlexibleEvent[] = [
                { eventType: "type1", data: {}, routeData: {} },
                { eventType: "type2", data: {}, routeData: {} },
                { eventType: "type3", data: {}, routeData: {} }
            ];

            for (const event of events) {
                await eventSource.generateEvent(event);
            }

            expect(matchCount).toBe(3);
        });
    });
});
