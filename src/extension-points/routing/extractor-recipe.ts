import { FlexibleRecipe } from "./recipe";
import { FlexibleExtractor } from "./extractor.interface";
import { Type } from "../../types";
import { FilterConfiguration } from "./filter-recipe";

export type ExtractorConfiguration<Extractor extends FlexibleExtractor> = Partial<Omit<FilterConfiguration<Extractor>, "extractValue">>;

export interface FlexibleExtractorRecipe<Extractor extends FlexibleExtractor> extends FlexibleRecipe<FlexibleExtractor>{
    readonly configuration: ExtractorConfiguration<Extractor>;
    readonly type: Type<Extractor>;
}
