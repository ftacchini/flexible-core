import { Type } from "./omit-type";


export interface FlexibleRecipe<RecipeType> {
    readonly configuration: any;
    readonly type: Type<RecipeType>;
}