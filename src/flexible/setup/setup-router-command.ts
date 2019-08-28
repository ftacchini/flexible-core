import { FlexibleMiddlewareFactory } from "./flexible-middleware-factory";
import { FlexiblePipeline } from "../pipeline/flexible-pipeline";
import { FlexibleAppState } from "../flexible-app-state";
import { isArray } from "util";
import { flatten } from "lodash";
import { FlexibleFramework } from "../../framework";
import { FlexibleRecipeFactory } from "./flexible-recipe-factory";
import { FlexibleFilter } from "../../event";
import { FlexiblePipelineFactory } from "./flexible-pipeline-factory";
import { FlexibleRouterFactory } from "./flexible-router-factory";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";
import { inject, injectable } from "inversify";

@injectable()
export class SetupRouterCommand {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.ROUTER_FACTORY) private routerFactory: FlexibleRouterFactory<FlexiblePipeline>,
        @inject(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY) private middlewareFactory: FlexibleMiddlewareFactory,
        @inject(FLEXIBLE_APP_TYPES.RECIPE_FACTORY) private recipeFactory: FlexibleRecipeFactory,
        @inject(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY) private pipelineFactory: FlexiblePipelineFactory,
        @inject(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER) private frameworksProvider: () => FlexibleFramework[]
    ) {
    }

    public async execute(flexibleAppState: FlexibleAppState): Promise<void> {

        flexibleAppState.router = this.routerFactory.createRouter();

        var frameworks = this.frameworksProvider()

        var pipelineDefinitions = flatten(await Promise.all(
            frameworks.map(
                framework => framework.createPipelineDefinitions()
                )));
        
        pipelineDefinitions.forEach(definition => {
            var filters = definition.filterStack.map(filterRecipes => {
                if(!isArray(filterRecipes)) {
                    filterRecipes = [filterRecipes]
                }

                var filters = filterRecipes
                    .map(filterRecipe => this.recipeFactory.craftRecipe<FlexibleFilter>(filterRecipe))
                
                filters.forEach((filter, index, array) => filter.isLastFilter = (array.length - 1 == index)) 

                return filters;
            })

            var middlewareStack = this.middlewareFactory.createMiddlewareStack(
                definition.middlewareStack);

            var pipeline = this.pipelineFactory.createPipeline(middlewareStack)
            flexibleAppState.router.addResource(filters, pipeline);
        });

    }

}