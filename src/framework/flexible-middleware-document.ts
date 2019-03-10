import { FlexibleExtractor } from "../event";
import { FlexibleActivationContext } from "./flexible-activation-context";
import { FlexibleRecipe } from "../flexible/flexible-recipe";

export interface FlexibleMiddlewareDocument {
    readonly extractorRecipes: FlexibleRecipe<FlexibleExtractor>[];
    readonly activationContext: FlexibleActivationContext;
}