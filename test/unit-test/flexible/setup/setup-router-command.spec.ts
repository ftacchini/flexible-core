import "reflect-metadata";
import "jasmine";
import { SetupRouterCommand } from "../../../../src/flexible/setup/setup-router-command";
import { FlexibleAppState } from "../../../../src/flexible/flexible-app-state";
import { FlexibleLogger } from "../../../../src/logging/flexible-logger";
import { FlexibleRouterFactory } from "../../../../src/flexible/setup/flexible-router-factory";
import { FlexibleMiddlewareFactory } from "../../../../src/flexible/setup/flexible-middleware-factory";
import { FlexibleRecipeFactory } from "../../../../src/flexible/setup/flexible-recipe-factory";
import { FlexiblePipelineFactory } from "../../../../src/flexible/setup/flexible-pipeline-factory";
import { FlexibleFramework } from "../../../../src/framework/flexible-framework";
import { FlexibleRouter } from "../../../../src/router";
import { FlexiblePipeline } from "../../../../src/flexible/pipeline/flexible-pipeline";
import { FlexiblePipelineDocument } from "../../../../src/framework/flexible-pipeline-document";
import { FlexibleFilter } from "../../../../src/event/flexible-filter";

describe("SetupRouterCommand", () => {
    let mockLogger: FlexibleLogger;
    let mockRouterFactory: FlexibleRouterFactory<FlexiblePipeline>;
    let mockMiddlewareFactory: FlexibleMiddlewareFactory;
    let mockRecipeFactory: FlexibleRecipeFactory;
    let mockPipelineFactory: FlexiblePipelineFactory;
    let mockFrameworksProvider: jasmine.Spy;
    let mockRouter: FlexibleRouter<FlexiblePipeline>;
    let mockPipeline: FlexiblePipeline;
    let appState: FlexibleAppState;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            info: jasmine.createSpy("info"),
            error: jasmine.createSpy("error"),
            warning: jasmine.createSpy("warning"),
            debug: jasmine.createSpy("debug"),
            alert: jasmine.createSpy("alert")
        } as any;

        // Create mock router
        mockRouter = {
            addResource: jasmine.createSpy("addResource"),
            findResource: jasmine.createSpy("findResource")
        } as any;

        // Create mock router factory
        mockRouterFactory = {
            createRouter: jasmine.createSpy("createRouter").and.returnValue(mockRouter)
        } as any;

        // Create mock pipeline
        mockPipeline = {
            execute: jasmine.createSpy("execute")
        } as any;

        // Create mock middleware factory
        mockMiddlewareFactory = {
            createMiddlewareStack: jasmine.createSpy("createMiddlewareStack").and.returnValue([])
        } as any;

        // Create mock recipe factory
        mockRecipeFactory = {
            craftRecipe: jasmine.createSpy("craftRecipe").and.returnValue({
                isLastFilter: false
            } as FlexibleFilter)
        } as any;

        // Create mock pipeline factory
        mockPipelineFactory = {
            createPipeline: jasmine.createSpy("createPipeline").and.returnValue(mockPipeline)
        } as any;

        // Create mock frameworks provider
        mockFrameworksProvider = jasmine.createSpy("frameworksProvider").and.returnValue([]);

        // Create app state
        appState = {
            logger: mockLogger,
            eventSources: [],
            router: null as any
        };
    });

    describe("router resolution", () => {
        it("should create router using router factory", async () => {
            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockRouterFactory.createRouter).toHaveBeenCalled();
            expect(appState.router).toBe(mockRouter);
        });

        it("should set router on app state", async () => {
            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(appState.router).toBe(mockRouter);
        });

        it("should resolve frameworks from provider", async () => {
            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockFrameworksProvider).toHaveBeenCalled();
        });
    });

    describe("router configuration", () => {
        it("should log router setup start", async () => {
            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up router...");
        });

        it("should log framework count", async () => {
            const mockFrameworks: FlexibleFramework[] = [
                { createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([])) } as any,
                { createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([])) } as any
            ];
            mockFrameworksProvider.and.returnValue(mockFrameworks);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Collecting pipeline definitions from 2 frameworks...");
        });

        it("should handle empty frameworks array", async () => {
            mockFrameworksProvider.and.returnValue([]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Collecting pipeline definitions from 0 frameworks...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Generating pipelines from 0 pipeline definitions...");
            expect(mockLogger.debug).toHaveBeenCalledWith("0 pipelines successfully generated and added to router\n");
        });

        it("should process pipeline definitions from frameworks", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockFramework.createPipelineDefinitions).toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalledWith("Generating pipelines from 1 pipeline definitions...");
        });

        it("should create pipelines and add them to router", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockRecipeFactory.craftRecipe).toHaveBeenCalled();
            expect(mockMiddlewareFactory.createMiddlewareStack).toHaveBeenCalled();
            expect(mockPipelineFactory.createPipeline).toHaveBeenCalled();
            expect(mockRouter.addResource).toHaveBeenCalled();
        });

        it("should handle multiple pipeline definitions", async () => {
            const mockPipelineDefinition1: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockPipelineDefinition2: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(
                    Promise.resolve([mockPipelineDefinition1, mockPipelineDefinition2])
                )
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Generating pipelines from 2 pipeline definitions...");
            expect(mockPipelineFactory.createPipeline).toHaveBeenCalledTimes(2);
            expect(mockRouter.addResource).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledWith("2 pipelines successfully generated and added to router\n");
        });

        it("should handle filter stack with array of filter recipes", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    [
                        { configuration: {}, type: jasmine.createSpy() as any },
                        { configuration: {}, type: jasmine.createSpy() as any }
                    ]
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockRecipeFactory.craftRecipe).toHaveBeenCalledTimes(2);
        });

        it("should mark last filter in filter stack", async () => {
            const mockFilter1 = { isLastFilter: false } as FlexibleFilter;
            const mockFilter2 = { isLastFilter: false } as FlexibleFilter;

            (mockRecipeFactory.craftRecipe as jasmine.Spy).and.returnValues(mockFilter1, mockFilter2);

            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any },
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockFilter1.isLastFilter).toBe(false);
            expect(mockFilter2.isLastFilter).toBe(true);
        });

        it("should handle pipeline setup errors gracefully", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);
            (mockRecipeFactory.craftRecipe as jasmine.Spy).and.throwError("Recipe error");

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.alert).toHaveBeenCalled();
            const alertCall = (mockLogger.alert as jasmine.Spy).calls.mostRecent().args[0];
            expect(alertCall).toContain("One of your pipelines could not be setup");
            expect(mockLogger.debug).toHaveBeenCalledWith("0 pipelines successfully generated and added to router\n");
        });

        it("should log pipeline count after successful generation", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("1 pipelines successfully generated and added to router\n");
        });
    });

    describe("integration", () => {
        it("should complete full setup successfully", async () => {
            const mockPipelineDefinition: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            // Verify router was created and set
            expect(mockRouterFactory.createRouter).toHaveBeenCalled();
            expect(appState.router).toBe(mockRouter);

            // Verify frameworks were resolved
            expect(mockFrameworksProvider).toHaveBeenCalled();

            // Verify pipeline was created and added to router
            expect(mockPipelineFactory.createPipeline).toHaveBeenCalled();
            expect(mockRouter.addResource).toHaveBeenCalled();

            // Verify logging occurred
            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up router...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Collecting pipeline definitions from 1 frameworks...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Generating pipelines from 1 pipeline definitions...");
            expect(mockLogger.debug).toHaveBeenCalledWith("1 pipelines successfully generated and added to router\n");
        });

        it("should handle multiple frameworks with multiple pipelines", async () => {
            const mockPipelineDefinition1: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockPipelineDefinition2: FlexiblePipelineDocument = {
                filterStack: [
                    { configuration: {}, type: jasmine.createSpy() as any }
                ],
                middlewareStack: []
            };

            const mockFramework1: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition1]))
            };

            const mockFramework2: FlexibleFramework = {
                createPipelineDefinitions: jasmine.createSpy().and.returnValue(Promise.resolve([mockPipelineDefinition2]))
            };

            mockFrameworksProvider.and.returnValue([mockFramework1, mockFramework2]);

            const command = new SetupRouterCommand(
                mockLogger,
                mockRouterFactory,
                mockMiddlewareFactory,
                mockRecipeFactory,
                mockPipelineFactory,
                mockFrameworksProvider
            );

            await command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Collecting pipeline definitions from 2 frameworks...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Generating pipelines from 2 pipeline definitions...");
            expect(mockPipelineFactory.createPipeline).toHaveBeenCalledTimes(2);
            expect(mockRouter.addResource).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledWith("2 pipelines successfully generated and added to router\n");
        });
    });
});
