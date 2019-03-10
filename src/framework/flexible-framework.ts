import { AsyncContainerModule } from "inversify";
import { FlexiblePipelineDocument } from "./flexible-pipeline-document";

export interface FlexibleFramework {
    readonly containerModule: AsyncContainerModule;
    createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]>;
}