import { FlexibleRecipe } from "./flexible-recipe";
import { Container } from "inversify";

const RECIPE_HAS_NO_TYPE_ERROR = "A recipe has no specified tpye and cannot be crafted";

export class FlexibleRecipeCrafter {

    constructor(private container: Container) {
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