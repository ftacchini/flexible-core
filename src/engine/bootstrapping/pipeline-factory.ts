import { FlexiblePipeline } from "../pipeline/pipeline";
import { FlexibleMiddleware } from "../pipeline/middleware.interface";
import { FlexibleLogger } from "../../extension-points/logging/logger.interface";
import { injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../app/app-types";

@injectable()
export class FlexiblePipelineFactory {

    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}

    public createPipeline(middlewareStack: FlexibleMiddleware[]) {
        return new FlexiblePipeline(middlewareStack, this.logger)
    }
}
