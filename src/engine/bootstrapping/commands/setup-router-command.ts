import { FlexibleMiddlewareFactory } from "../middleware-factory";
import { FlexiblePipeline } from "../../pipeline/pipeline";
import { FlexibleAppState } from "../../app/app-state";
import { isArray, flatten } from "lodash";
import { FlexibleFramework } from "../../../extension-points/framework/framework.interface";
import { FlexibleRecipeFactory } from "../recipe-factory";
import { FlexibleFilter } from "../../../extension-points/routing/filter.interface";
import { FlexiblePipelineFactory } from "../pipeline-factory";
import { FlexibleRouterFactory } from "../router-factory";
import { FLEXIBLE_APP_TYPES } from "../../app/app-types";
import { inject, injectable } from "tsyringe";
import { FlexibleLogger } from "../../../extension-points/logging/logger.interface";

const PIPELINE_SETUP_ERROR = "One of your pipelines could not be setup, there might be a problem with one of your filters/extractors/middleware"

@injectable()
export class SetupRouterCommand {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(FLEXIBLE_APP_TYPES.ROUTER_FACTORY) private routerFactory: FlexibleRouterFactory<FlexiblePipeline>,
        @inject(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY) private middlewareFactory: FlexibleMiddlewareFactory,
        @inject(FLEXIBLE_APP_TYPES.RECIPE_FACTORY) private recipeFactory: FlexibleRecipeFactory,
        @inject(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY) private pipelineFactory: FlexiblePipelineFactory,
        @inject(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER) private frameworksProvider: () => FlexibleFramework[]
    ) {
    }

    public async execute(flexibleAppState: FlexibleAppState): Promise<void> {

        this.logger.debug("Setting up router...");
        flexibleAppState.router = this.routerFactory.createRouter();

        var frameworks = this.frameworksProvider()
        this.logger.debug(`Collecting pipeline definitions from ${frameworks.length || 0} frameworks...`);

        var pipelineDefinitions = flatten(await Promise.all(frameworks.map(framework => framework.createPipelineDefinitions())));
        this.logger.debug(`Generating pipelines from ${pipelineDefinitions.length || 0} pipeline definitions...`);

        var pipelines = pipelineDefinitions.map(definition => {
            try {
                var filters = definition.filterStack.map((filterRecipes, index, array) => {
                    if(!isArray(filterRecipes)) {
                        filterRecipes = [filterRecipes]
                    }

                    var filters = filterRecipes
                        .map(filterRecipe => this.recipeFactory.craftRecipe<FlexibleFilter>(filterRecipe))

                    filters.forEach((filter) => filter.isLastFilter = (array.length - 1 == index))

                    return filters;
                })

                var middlewareStack = this.middlewareFactory.createMiddlewareStack(
                    definition.middlewareStack);

                var pipeline = this.pipelineFactory.createPipeline(middlewareStack)
                flexibleAppState.router.addResource(filters, pipeline);

                return pipeline;

            } catch(ex) {
                this.logger.alert(`${PIPELINE_SETUP_ERROR}, exception is: ${JSON.stringify(ex)}`);
                this.logger.alert(`Exception message: ${(ex as any)?.message || 'no message'}`);
                this.logger.alert(`Exception stack: ${(ex as any)?.stack || 'no stack'}`);
            }
        }).filter(x => x);

        this.logger.debug(`${pipelines.length || 0} pipelines successfully generated and added to router\n`);
    }

}
