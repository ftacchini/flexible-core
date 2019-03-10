import { FlexibleApp } from "./flexible-app";
import { FlexibleFramework } from "../framework/flexible-framework";
import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexibleLogger } from "../logging/flexible-logger";
import { FlexibleConsoleLogger } from "../logging/flexible-console-logger";
import { Container } from "inversify";


export class FlexibleAppBuilder {

    private frameworks: FlexibleFramework[];
    private eventSources: FlexibleEventSource[];
    protected logger: FlexibleLogger;
    protected container: Container;

    private static _instance: FlexibleAppBuilder;
    public static get instance() {
        return this._instance || (this._instance = new FlexibleAppBuilder());
    }

    private constructor() {
        this.reset();
    }

    createApp(): FlexibleApp {

        this.container || (this.container = new Container());
        this.logger || (this.logger = new FlexibleConsoleLogger());

        var app =  new FlexibleApp(
            this.frameworks,
            this.eventSources,
            this.container,
            this.logger
        );

        this.reset();

        return app;
    }

    addFramework(framework: FlexibleFramework): this {
        this.frameworks.push(framework);
        return this;
    }

    addEventSource(eventSource: FlexibleEventSource): this {
        this.eventSources.push(eventSource);
        return this;
    }

    withContainer(container: Container): this {
        this.container = container;
        return this;
    }

    withLogger(logger: FlexibleLogger): this {
        this.logger = logger;
        return this;
    }

    reset(): this {
        this.frameworks = [];
        this.eventSources = [];
        this.container = null;
        this.logger = null;
        return this;
    }
}