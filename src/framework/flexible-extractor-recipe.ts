import { FlexibleRecipe } from "../flexible/flexible-recipe";
import { FlexibleExtractor } from "../event/flexible-extractor";
import { Type } from "../flexible";
import { FilterConfiguration } from "./flexible-filter-recipe";

export type ExtractorConfiguration<Extractor extends FlexibleExtractor> = Partial<Omit<FilterConfiguration<Extractor>, "extractValue">>;

export interface FlexibleExtractorRecipe<Extractor extends FlexibleExtractor> extends FlexibleRecipe<FlexibleExtractor>{
    readonly configuration: ExtractorConfiguration<Extractor>;
    readonly type: Type<Extractor>;
}
