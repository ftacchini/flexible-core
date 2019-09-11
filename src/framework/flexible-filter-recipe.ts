import { FlexibleRecipe } from "../flexible/flexible-recipe";
import { FlexibleFilter } from "../event/flexible-filter";
import { Type } from "../flexible";

export type FilterConfiguration<Filter extends FlexibleFilter> = Partial<Omit<Filter, "filterEvent" | "staticRouting" | "isLastFilter">>;

export interface FlexibleFilterRecipe<Filter extends FlexibleFilter> extends FlexibleRecipe<FlexibleFilter>{
    readonly configuration: FilterConfiguration<Filter>;
    readonly type: Type<Filter>;
}

