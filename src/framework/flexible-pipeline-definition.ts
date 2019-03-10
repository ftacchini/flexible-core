import { FlexibleFilter } from "../event";
import { FlexibleFilterRecipe } from "./flexible-filter-recipe";
import { FlexibleMiddlewareDocument } from "./flexible-middleware-document";

export interface FlexiblePipelineDefinition {
    readonly filterStack: FlexibleFilterRecipe<FlexibleFilter>[];
    readonly middlewareStack: FlexibleMiddlewareDocument[];
}