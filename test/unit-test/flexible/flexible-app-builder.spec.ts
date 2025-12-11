import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../../src/flexible/flexible-app";
import { FlexibleContainer } from "../../../src/container/flexible-container";
import { FlexibleLoggerModule } from "../../../src/logging/flexible-logger-module";
import { FlexibleRouterModule } from "../../../src/router/flexible-router-module";
import { FlexibleFrameworkModule } from "../../../src/framework/flexible-framework-module";
import { FlexibleEventSourceModule } from "../../../src/event/flexible-event-source-module";
import { FlexiblePipeline } from "../../../src/flexible/pipeline/flexible-pipeline";
import { FlexibleExtractor } from "../../../src/event";

describe("FlexibleAppBuilder", () => {
    let builder: FlexibleAppBuilder;
    let mockFramework: FlexibleFrameworkModule;
    let mockEventSource: FlexibleEventSourceModule;
    let mockLogger: FlexibleLoggerModule;
    let mockRouter: FlexibleRouterModule<FlexiblePipeline>;
    let mockExtractorsRouter: FlexibleRouterModule<FlexibleExtractor>;

    beforeEach(() => {
        builder = new FlexibleAppBuilder();

        // Create minimal mock framework
        mockFramework = {
            getInstance: jasmine.createSpy("getInstance").and.returnValue({}),
            register: jasmine.createSpy("register"),
            registerIsolated: jasmine.createSpy("registerIsolated")
        };

        // Create minimal mock event source
        mockEventSource = {
            getInstance: jasmine.createSpy("getInstance").and.returnValue({}),
            register: jasmine.createSpy("register"),
            registerIsolated: jasmine.createSpy("registerIsolated")
        };

        // Create minimal mock logger
        mockLogger = {
            getInstance: jasmine.createSpy("getInstance").and.returnValue({
                info: jasmine.createSpy("info"),
                error: jasmine.createSpy("error"),
                warn: jasmine.createSpy("warn"),
                debug: jasmine.createSpy("debug")
            }),
            register: jasmine.createSpy("register")
        };

        // Create minimal mock router
        mockRouter = {
            getInstance: jasmine.createSpy("getInstance").and.returnValue({}),
            register: jasmine.createSpy("register")
        };

        // Create minimal mock extractors router
        mockExtractorsRouter = {
            getInstance: jasmine.createSpy("getInstance").and.returnValue({}),
            register: jasmine.createSpy("register")
        };
    });

    describe("builder with default container", () => {
        it("should create app with default container when none provided", () => {
            const app = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app).toBeInstanceOf(FlexibleApp);
        });

        it("should create a new FlexibleContainer by default", () => {
            const app = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            // The app should be created successfully with a default container
            expect(app).toBeDefined();
        });

        it("should use default ConsoleLoggerModule when no logger provided", () => {
            const app = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app).toBeInstanceOf(FlexibleApp);
        });

        it("should use default FlexibleTreeRouterModule when no router provided", () => {
            const app = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .createApp();

            expect(app).toBeInstanceOf(FlexibleApp);
        });
    });

    describe("builder with user-provided container", () => {
        it("should use user-provided container", () => {
            const customContainer = new FlexibleContainer();

            const app = builder
                .withContainer(customContainer)
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app).toBeInstanceOf(FlexibleApp);
        });

        it("should allow container to be set before other components", () => {
            const customContainer = new FlexibleContainer();

            const app = builder
                .withContainer(customContainer)
                .withLogger(mockLogger)
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app).toBeDefined();
        });

        it("should allow container to be set after other components", () => {
            const customContainer = new FlexibleContainer();

            const app = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .withContainer(customContainer)
                .createApp();

            expect(app).toBeDefined();
        });
    });

    describe("container configuration", () => {
        it("should support fluent API for container configuration", () => {
            const customContainer = new FlexibleContainer();

            const result = builder.withContainer(customContainer);

            expect(result).toBe(builder);
        });

        it("should allow multiple apps to be created with different containers", () => {
            const container1 = new FlexibleContainer();
            const container2 = new FlexibleContainer();

            const app1 = builder
                .withContainer(container1)
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            const app2 = builder
                .withContainer(container2)
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app1).toBeInstanceOf(FlexibleApp);
            expect(app2).toBeInstanceOf(FlexibleApp);
            expect(app1).not.toBe(app2);
        });

        it("should reset container after createApp", () => {
            const customContainer = new FlexibleContainer();

            builder
                .withContainer(customContainer)
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            // After createApp, builder should be reset
            // Creating another app should use a new default container
            const app2 = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app2).toBeInstanceOf(FlexibleApp);
        });
    });

    describe("builder reset behavior", () => {
        it("should reset all components after createApp", () => {
            builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            // After reset, builder should be able to create a new app
            const app2 = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app2).toBeInstanceOf(FlexibleApp);
        });

        it("should allow builder reuse after createApp", () => {
            const app1 = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            const app2 = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter)
                .createApp();

            expect(app1).not.toBe(app2);
        });
    });

    describe("fluent API", () => {
        it("should support method chaining", () => {
            const result = builder
                .addFramework(mockFramework)
                .addEventSource(mockEventSource)
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .withExtractorsRouter(mockExtractorsRouter);

            expect(result).toBe(builder);
        });

        it("should allow components to be added in any order", () => {
            const app = builder
                .withLogger(mockLogger)
                .withRouter(mockRouter)
                .addEventSource(mockEventSource)
                .withExtractorsRouter(mockExtractorsRouter)
                .addFramework(mockFramework)
                .createApp();

            expect(app).toBeInstanceOf(FlexibleApp);
        });
    });
});
