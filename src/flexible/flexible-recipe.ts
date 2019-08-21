import { Type } from "./type";

export interface FlexibleRecipe<RecipeType> {
    readonly configuration: any;
    readonly type: Type<RecipeType>;
}