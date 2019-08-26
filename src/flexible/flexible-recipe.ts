import { Type } from "./type";

export interface FlexibleRecipe<RecipeType> {
    readonly configuration: Partial<RecipeType>;
    readonly type: Type<RecipeType>;
}