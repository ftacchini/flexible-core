import { FlexibleExtractor } from "../routing/extractor.interface";
import { FlexibleActivationContext } from "./activation-context";
import { FlexibleRecipe } from "../routing/recipe";

export interface FlexibleMiddlewareDocument {
    readonly extractorRecipes: {
        [paramIndex: number]: FlexibleRecipe<FlexibleExtractor> | FlexibleRecipe<FlexibleExtractor>[]
    };
    readonly activationContext: FlexibleActivationContext;
}
