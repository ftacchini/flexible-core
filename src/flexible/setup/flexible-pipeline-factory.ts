import { FlexiblePipeline } from "../pipeline/flexible-pipeline";
import { FlexibleMiddleware } from "../pipeline/flexible-middleware";
import { FlexibleLogger } from "../../logging/flexible-logger";
import { injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

@injectable()
export class FlexiblePipelineFactory {

    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}

    public createPipeline(middlewareStack: FlexibleMiddleware[]) {
        return new FlexiblePipeline(middlewareStack, this.logger)
    }
}