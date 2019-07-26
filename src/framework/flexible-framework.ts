import { FlexiblePipelineDocument } from "./flexible-pipeline-document";

export interface FlexibleFramework {
    createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]>;
}