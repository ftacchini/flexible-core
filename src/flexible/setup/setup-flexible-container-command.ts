import { Container } from "inversify";
import { FlexibleRouterModule } from "../../router/flexible-router-module";
import { FlexibleExtractor, FlexibleEventSourceModule } from "../../event";
import { FlexiblePipeline } from "../pipeline/flexible-pipeline";
import { FlexibleFrameworkModule } from "../../framework/flexible-framework-module";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";
import { FlexibleRecipeFactory } from "./flexible-recipe-factory";
import { FlexibleRouterFactory } from "./flexible-router-factory";
import { FlexiblePipelineFactory } from "./flexible-pipeline-factory";
import { FlexibleMiddlewareFactory } from "./flexible-middleware-factory";

export class SetupFlexibleContainerCommand {

    public constructor(
        private routerModule: FlexibleRouterModule<FlexiblePipeline>,
        private extractorsRouterModule: FlexibleRouterModule<FlexibleExtractor>,
        private container: Container
    ) {
    }

    public async execute(): Promise<void> {
        this.container.unbindAll();

        var dependencies = [
            this.routerModule.container,
            this.extractorsRouterModule.container];

        this.container.loadSync(...dependencies);

        this.container.bind(FLEXIBLE_APP_TYPES.ROUTER_FACTORY).toConstantValue(new FlexibleRouterFactory(
            this.container,
            this.routerModule))

        this.container.bind(FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY).toConstantValue(new FlexibleRouterFactory(
            this.container,
            this.extractorsRouterModule))

        this.container.bind(FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY).to(FlexibleMiddlewareFactory).inSingletonScope();
        this.container.bind(FLEXIBLE_APP_TYPES.RECIPE_FACTORY).to(FlexibleRecipeFactory).inSingletonScope();
        this.container.bind(FLEXIBLE_APP_TYPES.PIPELINE_FACTORY).to(FlexiblePipelineFactory).inSingletonScope();
    }

}