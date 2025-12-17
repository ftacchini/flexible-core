import { Type } from "../../types";

export interface FlexibleRecipe<RecipeType> {
    readonly configuration: Partial<RecipeType>;
    readonly type: Type<RecipeType>;
}
