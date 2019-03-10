import { FlexibleRecipe } from "../flexible/flexible-recipe";
import { Omit, Type } from "../flexible/omit-type";
import { FlexibleExtractor } from "../event/flexible-extractor";

export type ExtractorConfiguration<Extractor extends FlexibleExtractor> = Partial<Omit<Extractor, "extractValue">>;

export interface FlexibleExtractorRecipe<Extractor extends FlexibleExtractor> extends FlexibleRecipe<FlexibleExtractor>{
    readonly configuration: any //TODO ExtractorConfiguration<Extractor>;
    readonly type: Type<Extractor>;
}
