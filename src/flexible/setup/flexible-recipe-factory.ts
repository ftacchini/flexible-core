import { FlexibleRecipe } from "../flexible-recipe";
import { DependencyContainer, injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

const RECIPE_HAS_NO_TYPE_ERROR = "A recipe has no specified tpye and cannot be crafted";

@injectable()
export class FlexibleRecipeFactory {

    constructor(@inject(FLEXIBLE_APP_TYPES.CONTAINER) private container: DependencyContainer) {
    }

    public craftRecipe<recipeType extends object>(recipe: FlexibleRecipe<recipeType>): recipeType {

        if(!recipe || !recipe.type) {
            throw RECIPE_HAS_NO_TYPE_ERROR;
        }

        if(!this.container.isRegistered(recipe.type.name)) {
            this.container.register(recipe.type.name, { useClass: recipe.type });
        }

        var instance = this.container.resolve<recipeType>(recipe.type.name);

        return Object.assign(instance, recipe.configuration || {});
    }
}