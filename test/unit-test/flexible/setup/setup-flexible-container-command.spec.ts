import "reflect-metadata";
import "jasmine";
import { SetupFlexibleContainerCommand } from "../../../../src/flexible/setup/setup-flexible-container-command";
import { FlexibleContainer } from "../../../../src/container/flexible-container";
import { FlexibleRouterModule } from "../../../../src/router/flexible-router-module";
import { FlexiblePipeline } from "../../../../src/flexible/pipeline/flexible-pipeline";
import { FlexibleExtractor } from "../../../../src/event/flexible-extractor";
import { FLEXIBLE_APP_TYPES } from "../../../../src/flexible/flexible-app-types";
import { FlexibleRouterFactory } from "../../../../src/flexible/setup/flexible-router-factory";
import { FlexibleMiddlewareFactory } from "../../../../src/flexible/setup/flexible-middleware-factory";
import { FlexibleRecipeFactory } from "../../../../src/flexible/setup/flexible-recipe-factory";
import { FlexiblePipelineFactory } from "../../../../src/flexible/setup/flexible-pipeline-factory";
import { DependencyContainer } from "tsyringe";

describe("SetupFlexibleContainerCommand", () => {
    let container: FlexibleContainer;
    let routerModule: FlexibleRouterModule<FlexiblePipeline>;
    let extractorsRouterModule: FlexibleRouterModule<FlexibleExtractor>;
    let mockRouter: any;
    let mockExtractor: any;

    beforeEach(() => {
        container = new FlexibleContainer();

        // Create mock router
        mockRouter = {
            route: jasmine.createSpy("route")
        };

        // Create mock extractor
        mockExtractor = {
            extract: jasmine.createSpy("extract")
        };

        // Create mock router module
        routerModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue(mockRouter)
        } as any;

        // Create mock extractors router module
        extractorsRouterModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue(mockExtractor)
        } as any;
    });

    afterEach(() => {
        container.reset();
    });

    describe("router binding", () => {
        it("should register router module", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify register was called with the underlying TSyringe container
            expect(routerModule.register).toHaveBeenCalled();
            const callArg = (routerModule.register as jasmine.Spy).calls.argsFor(0)[0];
            expect(callArg).toBe(container.getContainer());
        });

        it("should register router factory as constant value", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify router factory is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.ROUTER_FACTORY)).toBe(true);

            const factory = container.resolve(FLEXIBLE_APP_TYPES.ROUTER_FACTORY);
            expect(factory).toBeInstanceOf(FlexibleRouterFactory);
        });

        it("should create router factory with correct dependencies", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            const factory = container.resolve(FLEXIBLE_APP_TYPES.ROUTER_FACTORY) as FlexibleRouterFactory<FlexiblePipeline>;
            const router = factory.createRouter();

            expect(routerModule.getInstance).toHaveBeenCalledWith(container);
            expect(router).toBe(mockRouter);
        });

        it("should return same router factory instance on multiple resolutions", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            const factory1 = container.resolve(FLEXIBLE_APP_TYPES.ROUTER_FACTORY);
            const factory2 = container.resolve(FLEXIBLE_APP_TYPES.ROUTER_FACTORY);

            expect(factory1).toBe(factory2);
        });
    });

    describe("extractor router binding", () => {
        it("should register extractors router module", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify register was called with the underlying TSyringe container
            expect(extractorsRouterModule.register).toHaveBeenCalled();
            const callArg = (extractorsRouterModule.register as jasmine.Spy).calls.argsFor(0)[0];
            expect(callArg).toBe(container.getContainer());
        });

        it("should register extractor router factory as constant value", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify extractor router factory is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY)).toBe(true);

            const factory = container.resolve(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY);
            expect(factory).toBeInstanceOf(FlexibleRouterFactory);
        });

        it("should create extractor router factory with correct dependencies", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            const factory = container.resolve(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY) as FlexibleRouterFactory<FlexibleExtractor>;
            const extractor = factory.createRouter();

            expect(extractorsRouterModule.getInstance).toHaveBeenCalledWith(container);
            expect(extractor).toBe(mockExtractor);
        });

        it("should return same extractor router factory instance on multiple resolutions", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            const factory1 = container.resolve(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY);
            const factory2 = container.resolve(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY);

            expect(factory1).toBe(factory2);
        });
    });

    describe("container configuration", () => {
        it("should register middleware factory as singleton", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify middleware factory is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY)).toBe(true);

            const factory1 = container.resolve(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY);
            const factory2 = container.resolve(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY);

            expect(factory1).toBeInstanceOf(FlexibleMiddlewareFactory);
            expect(factory1).toBe(factory2); // Should be same instance (singleton)
        });

        it("should register recipe factory as singleton", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify recipe factory is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.RECIPE_FACTORY)).toBe(true);

            const factory1 = container.resolve(FLEXIBLE_APP_TYPES.RECIPE_FACTORY);
            const factory2 = container.resolve(FLEXIBLE_APP_TYPES.RECIPE_FACTORY);

            expect(factory1).toBeInstanceOf(FlexibleRecipeFactory);
            expect(factory1).toBe(factory2); // Should be same instance (singleton)
        });

        it("should register pipeline factory as singleton", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Verify pipeline factory is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY)).toBe(true);

            const factory1 = container.resolve(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY);
            const factory2 = container.resolve(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY);

            expect(factory1).toBeInstanceOf(FlexiblePipelineFactory);
            expect(factory1).toBe(factory2); // Should be same instance (singleton)
        });

        it("should preserve user bindings when registering modules", async () => {
            // Register a test binding before command execution
            const testToken = Symbol("TestToken");
            container.registerValue(testToken, "test-value");

            expect(container.isRegistered(testToken)).toBe(true);

            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // User bindings should be preserved
            expect(container.isRegistered(testToken)).toBe(true);
            expect(container.resolve(testToken)).toBe("test-value");
        });

        it("should add framework bindings alongside user bindings", async () => {
            // Register multiple user bindings
            const token1 = Symbol("Token1");
            const token2 = Symbol("Token2");
            container.registerValue(token1, "value1");
            container.registerValue(token2, "value2");

            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // User bindings should still exist
            expect(container.isRegistered(token1)).toBe(true);
            expect(container.isRegistered(token2)).toBe(true);
            // Framework bindings should also exist
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.ROUTER_FACTORY)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY)).toBe(true);
        });
    });

    describe("integration", () => {
        it("should complete full setup successfully", async () => {
            const routerToken = Symbol("RouterToken");
            const extractorToken = Symbol("ExtractorToken");

            // Create router module that registers a binding
            const testRouterModule: FlexibleRouterModule<FlexiblePipeline> = {
                register: (tsContainer: DependencyContainer) => {
                    tsContainer.register(routerToken, { useValue: "router-value" });
                },
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockRouter)
            };

            // Create extractor router module that registers a binding
            const testExtractorModule: FlexibleRouterModule<FlexibleExtractor> = {
                register: (tsContainer: DependencyContainer) => {
                    tsContainer.register(extractorToken, { useValue: "extractor-value" });
                },
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockExtractor)
            };

            const command = new SetupFlexibleContainerCommand(
                testRouterModule,
                testExtractorModule,
                container
            );

            await command.execute();

            // Verify all expected bindings are present
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.ROUTER_FACTORY)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.RECIPE_FACTORY)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY)).toBe(true);

            // Verify module bindings were registered
            expect(container.isRegistered(routerToken)).toBe(true);
            expect(container.isRegistered(extractorToken)).toBe(true);
            expect(container.resolve(routerToken)).toBe("router-value");
            expect(container.resolve(extractorToken)).toBe("extractor-value");
        });

        it("should allow router factories to create routers", async () => {
            const command = new SetupFlexibleContainerCommand(
                routerModule,
                extractorsRouterModule,
                container
            );

            await command.execute();

            // Test router factory
            const routerFactory = container.resolve(FLEXIBLE_APP_TYPES.ROUTER_FACTORY) as FlexibleRouterFactory<FlexiblePipeline>;
            const router = routerFactory.createRouter();
            expect(router).toBe(mockRouter);

            // Test extractor router factory
            const extractorFactory = container.resolve(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY) as FlexibleRouterFactory<FlexibleExtractor>;
            const extractor = extractorFactory.createRouter();
            expect(extractor).toBe(mockExtractor);
        });
    });
});
