import { FlexibleFramework } from "../framework/flexible-framework";
import { FlexiblePipelineDocument } from "../framework/flexible-pipeline-document";
import { ContainerModule } from "inversify";

/**
 * A simple test framework implementation for testing purposes.
 * Allows manual addition of pipeline definitions without decorator scanning.
 */
export class DummyFramework implements FlexibleFramework {
    public readonly container: ContainerModule;
    private definitions: FlexiblePipelineDocument[] = [];

    constructor() {
        this.container = new ContainerModule(() => {
            return;
        });
    }

    public async createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]> {
        return this.definitions;
    }

    public addPipelineDefinition(definition: FlexiblePipelineDocument) {
        this.definitions.push(definition);
    }
}
