import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { DummyEventSource } from "./dummy-event-source";
import { DummyFramework } from "./dummy-framework";
import { Container } from "inversify";

describe("FlexibleApp", () => {

    let app: FlexibleApp;
    let eventSource: DummyEventSource;
    let framework: DummyFramework;
    let container: Container;

    beforeAll(() => {

        container = new Container();
        eventSource = new DummyEventSource();
        framework = new DummyFramework();

        app = FlexibleAppBuilder.instance
            .withContainer(container)
            .addEventSource(eventSource)
            .addFramework(framework)
            .createApp();
    })

    it("Should run correctly", async (done) => {
        //Arrange

        //Act
        await app.run();

        //Assert
        expect(eventSource.running).toBeTruthy();
        done();
    });

    it("Should stop correctly", async (done) => {
        //Arrange
        await app.run();

        //Act
        await app.stop()

        //Assert
        expect(eventSource.running).toBeFalsy();
        done();

    });

    it("Should route events correctly through flexible router", async (done) => {

    });

    it("Should route events correctly through server router", async (done) => {

    });

    it("Should extract values from event correctly", async (done) => {

    });

    it("Should process an event through a middleware stack", async (done) => {

    });
})