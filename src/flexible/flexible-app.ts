import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexibleFramework } from "../framework/flexible-framework";
import { FlexibleLogger } from "../logging/flexible-logger";
import { Container } from "inversify";
import { FlexiblePipeline } from "./flexible-pipeline";
import { FlexibleRouter } from "../router/flexible-router";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleFilter, FlexibleExtractor } from "../event";
import { FlexibleAppBuilder } from "./flexible-app-builder";
import { FlexibleRecipeCrafter } from "./flexible-recipe-crafter";
import { FLEXIBLE_APP_TYPES } from "./flexible-app-types";

import { flatten, filter, includes } from "lodash";

const NO_FRAMEWORK_DEFINED = "Cannot build a flexible app without any framework";
const NO_SERVER_DEFINED = "Cannot build a flexible app without any server";
const NO_CONTAINER_DEFINED = "Cannot build a flexible app without a container";
const NO_LOGGER_DEFINED = "Cannot build a flexible app without a logger";
const DUPLICATE_EVENT_TYPES = (types: String[]) => `There is more than one eventSource that emits events with the same type: ${types}`;

export class FlexibleApp {

    private initialization: Promise<FlexibleRouter> = null;
    private recipeCrafter: FlexibleRecipeCrafter;

    public constructor(
        private frameworks: FlexibleFramework[],
        private eventSources: FlexibleEventSource[],
        private container: Container,
        private logger: FlexibleLogger) {

        if (!logger) {
            throw NO_LOGGER_DEFINED;
        }

        if (!frameworks || !frameworks.length) {
            logger.emergency(NO_FRAMEWORK_DEFINED);
            throw NO_FRAMEWORK_DEFINED;
        }

        if (!eventSources || !eventSources.length) {
            logger.emergency(NO_SERVER_DEFINED);
            throw NO_SERVER_DEFINED;
        }

        if (!container) {
            logger.emergency(NO_CONTAINER_DEFINED);
            throw NO_CONTAINER_DEFINED;
        }

        this.recipeCrafter = new FlexibleRecipeCrafter(container);
    }

    public async initialize(): Promise<FlexibleRouter> {
        if (!this.initialization) {
            this.duplicateEventTypesWarning(this.eventSources);
            this.initialization = new Promise<FlexibleRouter>(async (resolve, reject) => {
                try {
                    await this.setupContainer();
                    var router = await this.setupRouting();
                    
                    resolve(router);
                }
                catch (err) {
                    this.logger.emergency(JSON.stringify(err));
                    reject(err);
                }
            })
        }

        return this.initialization;
    }

    public async run(): Promise<any[]> {
        var router = await this.initialize();

        var promises = this.eventSources.map(e => {
            //e.onEvent(router.processEvent);
            return e.run();
        })

        return Promise.all(promises);
    }

    private duplicateEventTypesWarning(eventSources: FlexibleEventSource[]): void {
        var eventTypes = flatten(eventSources.map(es => es.availableEventTypes));
        var duplicates = filter(eventTypes, (val, i, iteratee) => includes(iteratee, val, i + 1));

        if(duplicates.length) {
            this.logger.warning(DUPLICATE_EVENT_TYPES(duplicates));
        }
    }

    private async setupContainer(): Promise<void> {
        
        //Bind flexible app utils
        this.container.bind(FLEXIBLE_APP_TYPES.CONTAINER).toConstantValue(this.container);
        this.container.bind(FLEXIBLE_APP_TYPES.RECIPE_CRAFTER).toConstantValue(this.recipeCrafter);
        this.container.bind(FLEXIBLE_APP_TYPES.LOGGER).toConstantValue(this.logger);
        
        //Bind framework and event source dependencies
        var eventSourcesContainerPromises = this.eventSources.map(s => s.containerModule);
        var frameworkContainerPromises = this.frameworks.map(f => f.containerModule);

        var containerPromises = eventSourcesContainerPromises.concat(frameworkContainerPromises);
        var containers = await Promise.all(containerPromises);

        await Promise.all(containers.filter(c => c).map(c => this.container.load(c)));
    }

    private async setupRouting(): Promise<FlexibleRouter> {
        /*var router = new FlexibleAppRouter();
        var routerSetup = this.frameworks.map(async framework => this.setupFramework(router, framework));

        await Promise.all(routerSetup);
        
        return router;*/
        //TODO
        return null
    }

    private async setupFramework(router: FlexibleRouter, framework: FlexibleFramework): Promise<void> {
        var definitions = await framework.createPipelineDefinitions();

        definitions.forEach(definition => {
            var filters = definition.filterStack.map(filterRecipe => {
                return this.recipeCrafter.craftRecipe<FlexibleFilter>(filterRecipe);
            })

            var middlewareStack = definition.middlewareStack.map(m => {

                var extractors = m.extractorRecipes.map(extractorRecipe => {
                    return this.recipeCrafter.craftRecipe<FlexibleExtractor>(extractorRecipe);
                })

                return new FlexibleMiddleware(m.activationContext, extractors)
            });

            var pipeline = new FlexiblePipeline(middlewareStack)
            router.addPipeline(filters, pipeline);
        });
    }

    public stop(): Promise<any[]> {
        var promises = this.eventSources.map(s => { 
            return s.stop() 
        })

        return Promise.all(promises);
    }
}