import { FlexiblePipeline } from "../flexible/flexible-pipeline";
import { FlexibleFilter, FlexibleEvent } from "../event";

export interface FlexibleRouter {
    addPipeline(filters: FlexibleFilter[], pipelines: FlexiblePipeline): void;
    getEventPipelines(event: FlexibleEvent): FlexiblePipeline[];
}