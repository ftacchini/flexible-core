import { FlexiblePipeline } from "./pipeline";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { FlexibleResponse } from "../../extension-points/event-source/response";

/**
 * A wrapper that combines a pipeline with its routing context (filterBinnacle).
 * 
 * This ensures each pipeline has its own isolated filter state, preventing
 * state pollution when multiple pipelines match the same event.
 * 
 * The filterBinnacle contains routing information populated during filter evaluation,
 * such as the matched route path pattern (e.g., "/users/:id") which is needed by
 * extractors like FromPath to extract URL parameters.
 */
export class RoutablePipeline {
    constructor(
        private pipeline: FlexiblePipeline,
        private filterBinnacle: { [key: string]: string }
    ) {}

    /**
     * Processes an event through the pipeline with its associated filter context.
     * 
     * Creates a fresh contextBinnacle for this pipeline execution to ensure
     * complete isolation between pipeline executions.
     * 
     * @param event - The event to process
     * @returns Response object containing middleware results and any errors
     */
    public async processEvent(event: FlexibleEvent): Promise<FlexibleResponse> {
        // Create a fresh contextBinnacle for this pipeline execution
        const contextBinnacle: { [key: string]: string } = {};
        
        return this.pipeline.processEvent(event, this.filterBinnacle, contextBinnacle);
    }

    /**
     * Gets the underlying pipeline (useful for testing or inspection)
     */
    public getPipeline(): FlexiblePipeline {
        return this.pipeline;
    }

    /**
     * Gets the filter context for this routable pipeline (useful for testing or inspection)
     */
    public getFilterBinnacle(): { [key: string]: string } {
        return this.filterBinnacle;
    }
}
