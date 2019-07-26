import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { FlexibleFrameworkModule } from "../../src/framework/flexible-framework-module";
import { DummyEventSource } from "./dummy-event-source";
import { DummyFramework } from "./dummy-framework";
import { AsyncContainerModule } from "inversify";
import { FlexibleEventSourceModule, FlexibleEvent } from "../../src/event";
import { IfEventIs } from "../../src/flexible/filter/if-event-is";
import { EventType } from "../../src/flexible/extractor/event-type";
import { EventData } from "../../src/flexible/extractor/event-data";

describe("FlexibleApp", () => {

    let app: FlexibleApp;
    let eventSource: DummyEventSource;
    let framework: DummyFramework;

    beforeEach(() => {
        eventSource = new DummyEventSource();
        framework = new DummyFramework();

        let frameworkModule: FlexibleFrameworkModule = {
            getInstance: () => framework,
            container: new AsyncContainerModule(async () => { })
        };
        let eventSourceModule: FlexibleEventSourceModule = {
            getInstance: () => eventSource,
            container: new AsyncContainerModule(async () => { })
        };

        app = FlexibleAppBuilder.instance
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
                configuration: {
                    eventType: event.eventType
                }
            }],
            middlewareStack: [{
                activationContext: { 
                    activate: async (eventType: string, eventData: any) => {
                        return { eventType: eventType, eventData: eventData };
                    }
                },
                extractorRecipes: [{
                    configuration: {},
                    type: EventType
                }, {
                    configuration: {},
                    type: EventData
                }]
            }]
        });

        //Act
        await app.run();
        var result = await eventSource.generateEvent(event);

        //Assert
        expect(result.responseStack).toEqual([{ eventType: event.eventType, eventData: event.data }])
        done();
    });

    it("Should process an event through a middleware stack", async (done) => {
        done();
    });
})