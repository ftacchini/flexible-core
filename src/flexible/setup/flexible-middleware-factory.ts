import { FlexibleRecipeFactory } from "./flexible-recipe-factory";
import { FlexibleMiddlewareDocument } from "../../framework/flexible-middleware-document";
import { FlexibleMiddleware } from "../pipeline/flexible-middleware";
import { isArray } from "util";
import { FlexibleExtractor } from "../../event";
import { FlexibleParametersExtractor } from "../pipeline/flexible-parameters-extractor";
import { injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";
import { FlexibleRouterFactory } from "./flexible-router-factory";

@injectable()
export class FlexibleMiddlewareFactory {

    constructor(
        @inject(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY) private routerFactory: FlexibleRouterFactory<FlexibleExtractor>,
        @inject(FLEXIBLE_APP_TYPES.RECIPE_FACTORY) private recipeFactory: FlexibleRecipeFactory) {
    }

    public createMiddlewareStack(middlewareDocuments: FlexibleMiddlewareDocument[]): FlexibleMiddleware[] {
        let middlewareStack = middlewareDocuments.map(m => {

            let extractorRoutersMap: any = {};

            Object.keys(m.extractorRecipes).forEach(key => {
                let index = parseInt(key);
                let recipes = m.extractorRecipes[index];

                if(!isArray(recipes)) {
                    recipes = [recipes];
                }

                let extractors = recipes.map(recipe => this.recipeFactory.craftRecipe<FlexibleExtractor>(recipe));
                let router = this.routerFactory.createRouter();
                extractors.forEach(extractor => router.addResource([extractor], extractor));
                extractorRoutersMap[index] = router;

            })

            let paramsExtractor = new FlexibleParametersExtractor(extractorRoutersMap);
            return new FlexibleMiddleware(m.activationContext, paramsExtractor)
        });

        return middlewareStack;
    }
}