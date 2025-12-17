import { FlexibleEventSource } from "../../extension-points/event-source/event-source.interface";
import { FlexibleLogger } from "../../extension-points/logging/logger.interface";
import { FlexibleRouter } from "../../extension-points/routing/router.interface";
import { FlexiblePipeline } from "../pipeline/pipeline";

export interface FlexibleAppState {
    logger: FlexibleLogger;
    eventSources: FlexibleEventSource[];
    router: FlexibleRouter<FlexiblePipeline>;
}
