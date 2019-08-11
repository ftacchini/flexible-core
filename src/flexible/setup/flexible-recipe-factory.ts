import { FlexibleRecipe } from "../flexible-recipe";
import { Container, injectable, inject } from "inversify";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

const RECIPE_HAS_NO_TYPE_ERROR = "A recipe has no specified tpye and cannot be crafted";

@injectable()
export class FlexibleRecipeFactory {

    constructor(@inject(FLEXIBLE_APP_TYPES.CONTAINER) private container: Container) {
    }

    public craftRecipe<recipeType extends object>(recipe: FlexibleRecipe<recipeType>): recipeType {
        
        if(!recipe || !recipe.type) {
            throw RECIPE_HAS_NO_TYPE_ERROR;
        }

        if(!this.container.isBound(recipe.type.name)) {
            this.container.bind(recipe.type.name).to(recipe.type).inSingletonScope();
        }

        var instance = this.container.get<recipeType>(recipe.type.name);
    
        return Object.assign(instance, recipe.configuration || {});
    }
}