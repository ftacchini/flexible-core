import { FlexibleEventSource } from "../event";
import { FlexibleLogger } from "../logging/flexible-logger";
import { FlexibleRouter } from "../router";
import { FlexiblePipeline } from "./pipeline/flexible-pipeline";

export interface FlexibleAppState {
    logger: FlexibleLogger;
    eventSources: FlexibleEventSource[];
    router: FlexibleRouter<FlexiblePipeline>;
}