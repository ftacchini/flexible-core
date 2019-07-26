import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexibleFramework } from "../framework/flexible-framework";
import { Container } from "inversify";
import { FlexiblePipeline } from "./flexible-pipeline";
import { FlexibleRouter } from "../router/flexible-router";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleFilter, FlexibleExtractor, FlexibleEventSourceModule } from "../event";
import { FlexibleRecipeCrafter } from "./flexible-recipe-crafter";

import { flatten, filter, includes } from "lodash";
import { FlexibleFrameworkModule } from "../framework/flexible-framework-module";
import { FlexibleLoggerModule } from "../logging/flexible-logger-module";
import { FlexibleModule } from "../module/flexible-module";
import { FlexibleLogger } from "../logging/flexible-logger";
import { FlexibleRouterModule } from "../router/flexible-router-module";
import { FlexibleProvider } from "../module/flexible-provider";
import { isArray } from "util";

const NO_FRAMEWORK_DEFINED = "Cannot build a flexible app without any framework";
const NO_SERVER_DEFINED = "Cannot build a flexible app without any server";
const NO_CONTAINER_DEFINED = "Cannot build a flexible app without a container";
const NO_LOGGER_DEFINED = "Cannot build a flexible app without a logger";
const NO_ROUTER_DEFINED = "Cannot build a flexible app without a router";
const NO_EXTRACTORS_ROUTER_DEFINED = "Cannot build a flexible app without an extrators router";
const DUPLICATE_EVENT_TYPES = (types: String[]) => `There is more than one eventSource that emits events with the same type: ${types}`;

export class FlexibleApp {

    private recipeCrafter: FlexibleRecipeCrafter;
    private logger: FlexibleLogger;
    private eventSources: FlexibleEventSource[];
    private frameworks: FlexibleFramework[];
    private router: FlexibleRouter<FlexiblePipeline>;
    private initialized: boolean;

    public constructor(
        private frameworkModules: FlexibleFrameworkModule[],
        private eventSourceModules: FlexibleEventSourceModule[],
        private loggerModule: FlexibleLoggerModule,
        private routerModule: FlexibleRouterModule<FlexiblePipeline>,
        private extractorsRouterModule: FlexibleRouterModule<FlexibleExtractor>,
        private modules: FlexibleModule[],
        private container: Container) {

        if (!loggerModule) {
            throw NO_LOGGER_DEFINED;
        }

        if (!routerModule) {
            throw NO_ROUTER_DEFINED;
        }

        if (!extractorsRouterModule) {
            throw NO_EXTRACTORS_ROUTER_DEFINED;
        }

        if (!frameworkModules || !frameworkModules.length) {
            throw NO_FRAMEWORK_DEFINED;
        }

        if (!eventSourceModules || !eventSourceModules.length) {
            throw NO_SERVER_DEFINED;
        }

        if (!container) {
            throw NO_CONTAINER_DEFINED;
        }

        this.recipeCrafter = new FlexibleRecipeCrafter(container);
    }

    public async setUp(): Promise<FlexibleRouter<FlexiblePipeline>> {

        if (!this.initialized) {

            try {
                this.container.unbindAll();

                var dependencies = [
                    this.loggerModule.container,
                    this.routerModule.container,
                    this.extractorsRouterModule.container,
                    ...this.eventSourceModules.map(x => x.container),
                    ...this.frameworkModules.map(x => x.container),
                    ...this.modules.map(x => x.container)];

                await Promise.all(dependencies.map(x => this.container.loadAsync(x)));

                this.logger = this.loggerModule.getInstance(this.container);
                this.eventSources = this.eventSourceModules.map(x => x.getInstance(this.container));
                this.duplicateEventTypesWarning(this.logger, this.eventSources);

                this.frameworks = this.frameworkModules.map(x => x.getInstance(this.container));
                this.router = this.routerModule.getInstance(this.container);
                await this.setupRouting(this.router, this.frameworks, this.extractorsRouterModule);

                this.initialized = true;

            }
            catch (err) {
                this.logger.emergency(JSON.stringify(err));
                this.initialized = false;
                throw err;
            }
        }

        return this.router;
    }

    public async run(): Promise<any[]> {
        var router = await this.setUp();
        var promises = this.eventSources.map(source => this.runEventSource(router, source))
        var results = await Promise.all(promises);

        return results;
    }

    private async runEventSource(router: FlexibleRouter<FlexiblePipeline>, eventSource: FlexibleEventSource): Promise<boolean> {
        eventSource.onEvent(async event => {
            //Events should be routable by event type.
            event.routeData.eventType = event.eventType;
            var pipelines = router.getEventResources(event);
            var responses = await Promise.all(pipelines.map(pipeline => pipeline.processEvent(event)));
            return responses;
        })

        return eventSource.run();
    }

    private duplicateEventTypesWarning(logger: FlexibleLogger, eventSources: FlexibleEventSource[]): void {
        var eventTypes = flatten(eventSources.map(es => es.availableEventTypes));
        var duplicates = filter(eventTypes, (val, i, iteratee) => includes(iteratee, val, i + 1));

        if (duplicates.length) {
            logger.warning(DUPLICATE_EVENT_TYPES(duplicates));
        }
    }

    private async setupRouting(
        router: FlexibleRouter<FlexiblePipeline>, 
        frameworks: FlexibleFramework[], 
        extractorsRouterProvider: FlexibleProvider<FlexibleRouter<FlexibleExtractor>>): Promise<void> {
        
        var pipelineDefinitions = flatten(await Promise.all(
            frameworks.map(framework => framework.createPipelineDefinitions())));
        
        pipelineDefinitions.forEach(definition => {
            var filters = definition.filterStack.map(filterRecipes => {
                if(!isArray(filterRecipes)) {
                    filterRecipes = [filterRecipes]
                }

                return filterRecipes.map(filterRecipe => this.recipeCrafter.craftRecipe<FlexibleFilter>(filterRecipe)) 
            })

            var middlewareStack = definition.middlewareStack.map(m => {


                m.extractorRecipes.forEach(extractorRecipes => {
                    
                    var extractorsRouter = extractorsRouterProvider.getInstance(this.container);

                    if(!isArray(extractorRecipes)) {
                        extractorRecipes = [extractorRecipes];
                    }

                    var extractors = this.recipeCrafter.craftRecipe<FlexibleExtractor>(extractorRecipes);
                    extractorsRouter.addResource(extractors, extractor);
                })

                return new FlexibleMiddleware(m.activationContext, extractorsRouter)
            });

            var pipeline = new FlexiblePipeline(middlewareStack)
            router.addResource(filters, pipeline);
        });
    }

    public async stop(): Promise<any[]> {
        var promises = this.eventSources.map(s => {
            return s.stop()
        })

        return Promise.all(promises);
    }
}