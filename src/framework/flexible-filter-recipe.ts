import { FlexibleRecipe } from "../flexible/flexible-recipe";
import { Omit } from "../flexible/omit-type";
import { FlexibleFilter } from "../event/flexible-filter";
import { Type } from "../flexible";

export type FilterConfiguration<Filter extends FlexibleFilter> = Partial<Omit<Filter, "filterEvent">>;

export interface FlexibleFilterRecipe<Filter extends FlexibleFilter> extends FlexibleRecipe<FlexibleFilter>{
    readonly configuration: any //TODO FilterConfiguration<Filter>;
    readonly type: Type<Filter>;
}

