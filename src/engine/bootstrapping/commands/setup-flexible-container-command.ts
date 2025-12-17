import { FlexibleRouterModule } from "../../../extension-points/routing/router-module";
import { FlexibleExtractor } from "../../../extension-points/routing/extractor.interface";
import { FlexiblePipeline } from "../../pipeline/pipeline";
import { FLEXIBLE_APP_TYPES } from "../../app/app-types";
import { FlexibleRecipeFactory } from "../recipe-factory";
import { FlexibleRouterFactory } from "../router-factory";
import { FlexiblePipelineFactory } from "../pipeline-factory";
import { FlexibleMiddlewareFactory } from "../middleware-factory";
import { FlexibleContainer } from "../../../platform/di/container";
import { Lifecycle } from "tsyringe";

export class SetupFlexibleContainerCommand {

    public constructor(
        private routerModule: FlexibleRouterModule<FlexiblePipeline>,
        private extractorsRouterModule: FlexibleRouterModule<FlexibleExtractor>,
        private container: FlexibleContainer
    ) {
    }

    public async execute(): Promise<void> {
        // Get the underlying TSyringe container
        const tsContainer = this.container.getContainer();

        // Register router module dependencies
        this.routerModule.register(tsContainer);

        // Register extractors router module dependencies
        this.extractorsRouterModule.register(tsContainer);

        // Register router factory as constant value
        this.container.registerValue(
            FLEXIBLE_APP_TYPES.ROUTER_FACTORY,
            new FlexibleRouterFactory(this.container, this.routerModule)
        );

        // Register extractor router factory as constant value
        this.container.registerValue(
            FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY,
            new FlexibleRouterFactory(this.container, this.extractorsRouterModule)
        );

        // Create and register factory instances as singletons
        // Recipe factory needs the container
        const recipeFactory = new FlexibleRecipeFactory(tsContainer);
        this.container.registerValue(FLEXIBLE_APP_TYPES.RECIPE_FACTORY, recipeFactory);

        // Middleware factory needs extractor router factory and recipe factory
        const extractorRouterFactory = this.container.resolve<FlexibleRouterFactory<FlexibleExtractor>>(
            FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY
        );
        const middlewareFactory = new FlexibleMiddlewareFactory(extractorRouterFactory, recipeFactory);
        this.container.registerValue(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY, middlewareFactory);

        // Register pipeline factory as a class so it can be resolved with DI
        this.container.registerClass(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY, FlexiblePipelineFactory);
    }

}
