import { FlexibleFilter } from "../routing/filter.interface";
import { FlexibleFilterRecipe } from "../routing/filter-recipe";
import { FlexibleMiddlewareDocument } from "./middleware-document";

export interface FlexiblePipelineDocument {
    readonly filterStack: (FlexibleFilterRecipe<FlexibleFilter> | FlexibleFilterRecipe<FlexibleFilter>[])[];
    readonly middlewareStack: FlexibleMiddlewareDocument[];
}
