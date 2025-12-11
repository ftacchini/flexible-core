import { FlexiblePipeline } from "../pipeline/flexible-pipeline";
import { FlexibleMiddleware } from "../pipeline/flexible-middleware";
import { injectable } from "tsyringe";

@injectable()
export class FlexiblePipelineFactory {

    public createPipeline(middlewareStack: FlexibleMiddleware[]) {
        return new FlexiblePipeline(middlewareStack)
    }
}