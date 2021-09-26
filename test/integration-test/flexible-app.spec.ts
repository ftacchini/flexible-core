import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { FlexibleFrameworkModule } from "../../src/framework/flexible-framework-module";
import { DummyEventSource } from "flexible-dummy-source";
import { DummyFramework } from "flexible-dummy-framework";
import { AsyncContainerModule } from "inversify";
import { FlexibleEventSourceModule, FlexibleEvent } from "../../src/event";
import { IfEventIs } from "../../src/flexible/filter/if-event-is";
import { EventType } from "../../src/flexible/extractor/event-type";
import { EventData } from "../../src/flexible/extractor/event-data";
import { SilentLoggerModule } from "../../src/flexible/logging/silent-logger-module";
import { FlexibleFilterRecipe } from "../../src";

describe("FlexibleApp", () => {

    let app: FlexibleApp;
    let eventSource: DummyEventSource;
    let framework: DummyFramework;

    beforeEach(() => {
        eventSource = new DummyEventSource();
        framework = new DummyFramework();

        let frameworkModule: FlexibleFrameworkModule = {
            getInstance: () => framework,
            container: new AsyncContainerModule(async () => { }),
            isolatedContainer: new AsyncContainerModule(async () => { })
        };
        let eventSourceModule: FlexibleEventSourceModule = {
            getInstance: () => eventSource,
            container: new AsyncContainerModule(async () => { }),
            isolatedContainer: new AsyncContainerModule(async () => { })
        };

        app = FlexibleAppBuilder.instance
            .withLogger(new SilentLoggerModule())
            .addEventSource(eventSourceModule)
            .addFramework(frameworkModule)
            .createApp();
    })

    it("Should run correctly", async (done) => {
        //Arrange

        //Act
        var result = await app.run();

        //Assert
        expect(eventSource.running).toBeTruthy();
        expect(result[0]).toBeTruthy();
        done();
    });

    it("Should stop correctly", async (done) => {
        //Arrange
        await app.run();

        //Act
        var result = await app.stop()

        //Assert
        expect(eventSource.running).toBeFalsy();
        expect(result[0]).toBeFalsy();
        done();

    });

    it("Should route events correctly through flexible router", async (done) => {
        //Arrange
        var event: FlexibleEvent = {
            eventType: "testEvent",
            data: {
                key: "value"
            },
            routeData: {}
        }
        
        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{
                    eventType: event.eventType
                }
            }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: { [key: string]: string }, eventType: string, eventData: any) => {
                        return { eventType: eventType, eventData: eventData };
                    }
                },
                extractorRecipes: {
                    0: {
                        configuration: {},
                        type: EventType
                    },
                    1: {
                        configuration: {},
                        type: EventData
                    }
                }
            }]
        });

        //Act
        await app.run();
        var result = await eventSource.generateEvent(event);

        //Assert
        expect(result[0].responseStack).toEqual([{ eventType: event.eventType, eventData: event.data }])
        done();
    });

    it("Should process an event through a middleware stack", async (done) => {
        //Arrange
        var event: FlexibleEvent = {
            eventType: "testEvent",
            data: {
                key: "value"
            },
            routeData: {}
        }

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{
                    eventType: event.eventType
                }
            }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: { [key: string]: string }, eventType: string) => {
                        return { eventType: eventType };
                    }
                },
                extractorRecipes: {
                    0: {
                        configuration: {},
                        type: EventType
                    }
                }
            }, {
                activationContext: {
                    activate: async (contextBinnacle: { [key: string]: string }, eventData: any) => {
                        return { eventData: eventData };
                    }
                },
                extractorRecipes: {
                    0: {
                        configuration: {},
                        type: EventData
                    }
                }
            }]
        });

        //Act
        await app.run();
        var result = await eventSource.generateEvent(event);

        //Assert
        expect(result[0].responseStack).toEqual([{ eventType: event.eventType }, { eventData: event.data }])
        done();
    });

    it("Should use the same object as context binnacle throughout the middleware stack", async (done) => {
        //Arrange
        var event: FlexibleEvent = {
            eventType: "testEvent",
            data: {
                key: "value"
            },
            routeData: {}
        }

        framework.addPipelineDefinition({
            filterStack: [{
                type: IfEventIs,
                configuration: <any>{
                    eventType: event.eventType
                }
            }],
            middlewareStack: [{
                activationContext: {
                    activate: async (contextBinnacle: { [key: string]: string }, eventType: string) => {
                        contextBinnacle.first = "first";
                        return {};
                    }
                },
                extractorRecipes: {
                    0: {
                        configuration: {},
                        type: EventType
                    }
                }
            }, {
                activationContext: {
                    activate: async (contextBinnacle: { [key: string]: string }, eventData: any) => {
                        contextBinnacle.second = "second";
                        return { contextBinnacle: contextBinnacle };
                    }
                },
                extractorRecipes: {
                    0: {
                        configuration: {},
                        type: EventData
                    }
                }
            }]
        });

        //Act
        await app.run();
        var result = await eventSource.generateEvent(event);

        //Assert
        expect(result[0].responseStack).toEqual([{}, { contextBinnacle: { first: "first", second: "second" } }])
        done();
    });
})