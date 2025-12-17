import { FlexiblePipelineDocument } from "./pipeline-document";

export interface FlexibleFramework {
    createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]>;
}
