import { FlexibleRecipe } from "./recipe";
import { FlexibleFilter } from "./filter.interface";
import { Type } from "../../types";

export type FilterConfiguration<Filter extends FlexibleFilter> = Partial<Omit<Filter, "filterEvent" | "staticRouting" | "isLastFilter">>;

export interface FlexibleFilterRecipe<Filter extends FlexibleFilter> extends FlexibleRecipe<FlexibleFilter>{
    readonly configuration: FilterConfiguration<Filter>;
    readonly type: Type<Filter>;
}
