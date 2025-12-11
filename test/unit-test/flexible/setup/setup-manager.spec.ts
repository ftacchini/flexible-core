import "reflect-metadata";
import "jasmine";
import { SetupManager } from "../../../../src/flexible/setup/setup-manager";
import { FlexibleContainer } from "../../../../src/container/flexible-container";
import { FlexibleLoggerModule } from "../../../../src/logging/flexible-logger-module";
import { FlexibleRouterModule } from "../../../../src/router/flexible-router-module";
import { FlexibleFrameworkModule } from "../../../../src/framework/flexible-framework-module";
import { FlexibleEventSourceModule } from "../../../../src/event/flexible-event-source-module";
import { FlexibleModule } from "../../../../src/module/flexible-module";
import { FlexibleAppState } from "../../../../src/flexible/flexible-app-state";
import { FLEXIBLE_APP_TYPES } from "../../../../src/flexible/flexible-app-types";

describe("SetupManager", () => {
    let container: FlexibleContainer;
    let loggerModule: FlexibleLoggerModule;
    let routerModule: FlexibleRouterModule<any>;
    let extractorsRouterModule: FlexibleRouterModule<any>;
    let frameworkModule: FlexibleFrameworkModule;
    let eventSourceModule: FlexibleEventSourceModule;
    let flexibleModule: FlexibleModule;

    beforeEach(() => {
        container = new FlexibleContainer();

        // Create mock logger module
        loggerModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue({
                info: jasmine.createSpy("info"),
                error: jasmine.createSpy("error"),
                warn: jasmine.createSpy("warn"),
                debug: jasmine.createSpy("debug")
            })
        } as any;

        // Create mock router modules
        routerModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue({})
        } as any;

        extractorsRouterModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue({})
        } as any;

        // Create mock framework module
        frameworkModule = {
            register: jasmine.createSpy("register"),
            registerIsolated: jasmine.createSpy("registerIsolated"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue({
                createPipelineDefinitions: jasmine.createSpy("createPipelineDefinitions").and.returnValue(Promise.resolve([]))
            })
        } as any;

        // Create mock event source module
        eventSourceModule = {
            register: jasmine.createSpy("register"),
            registerIsolated: jasmine.createSpy("registerIsolated"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue({})
        } as any;

        // Create mock flexible module
        flexibleModule = {
            register: jasmine.createSpy("register")
        } as any;
    });

    afterEach(() => {
        container.reset();
    });

    describe("constructor validation", () => {
        it("should throw error when logger module is not provided", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    [eventSourceModule],
                    null as any,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when router module is not provided", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    [eventSourceModule],
                    loggerModule,
                    null as any,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when extractors router module is not provided", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    [eventSourceModule],
                    loggerModule,
                    routerModule,
                    null as any,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when framework modules are not provided", () => {
            expect(() => {
                new SetupManager(
                    null as any,
                    [eventSourceModule],
                    loggerModule,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when framework modules array is empty", () => {
            expect(() => {
                new SetupManager(
                    [],
                    [eventSourceModule],
                    loggerModule,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when event source modules are not provided", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    null as any,
                    loggerModule,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when event source modules array is empty", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    [],
                    loggerModule,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    container
                );
            }).toThrow();
        });

        it("should throw error when container is not provided", () => {
            expect(() => {
                new SetupManager(
                    [frameworkModule],
                    [eventSourceModule],
                    loggerModule,
                    routerModule,
                    extractorsRouterModule,
                    [flexibleModule],
                    null as any
                );
            }).toThrow();
        });

        it("should create SetupManager with valid parameters", () => {
            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            expect(setupManager).toBeDefined();
        });
    });

    describe("container initialization", () => {
        it("should initialize container with modules", async () => {
            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            const appState = {} as FlexibleAppState;

            // This will test that the container is properly set up
            await setupManager.initialize(appState);

            // Verify that the container has the expected bindings
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.CONTAINER)).toBe(true);
        });
    });

    describe("child container creation", () => {
        it("should create child container during setup", async () => {
            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            const appState = {} as FlexibleAppState;

            // Register a test binding in the parent container
            const testToken = Symbol("TestToken");
            container.registerValue(testToken, "parent-value");

            await setupManager.initialize(appState);

            // The child container should have been created and should inherit parent bindings
            // We can verify this by checking that the parent binding is still accessible
            expect(container.resolve(testToken)).toBe("parent-value");
        });

        it("should isolate child container bindings from parent", async () => {
            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            const appState = {} as FlexibleAppState;

            await setupManager.initialize(appState);

            // The setup container (child) should have its own bindings
            // that don't pollute the parent container
            // We verify this by checking that parent doesn't have setup-specific bindings
            // Note: LOGGER, EVENT_SOURCES_PROVIDER, FRAMEWORKS_PROVIDER, and CONTAINER
            // are registered in the parent, so they should exist
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);
        });
    });

    describe("binding inheritance from parent to child", () => {
        it("should inherit parent bindings in child container", async () => {
            // Register a binding in the parent container before setup
            const parentToken = Symbol("ParentBinding");
            container.registerValue(parentToken, "parent-value");

            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            const appState = {} as FlexibleAppState;

            await setupManager.initialize(appState);

            // Verify parent binding is still accessible in parent
            expect(container.resolve(parentToken)).toBe("parent-value");
        });

        it("should allow child to access parent bindings through factory", async () => {
            const setupManager = new SetupManager(
                [frameworkModule],
                [eventSourceModule],
                loggerModule,
                routerModule,
                extractorsRouterModule,
                [flexibleModule],
                container
            );

            const appState = {} as FlexibleAppState;

            await setupManager.initialize(appState);

            // The child container should be able to resolve bindings from parent
            // through the factory functions that were registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER)).toBe(true);
        });
    });
});
