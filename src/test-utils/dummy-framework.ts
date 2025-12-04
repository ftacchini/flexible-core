import { FlexibleFramework } from "../framework/flexible-framework";
import { FlexiblePipelineDocument } from "../framework/flexible-pipeline-document";
import { AsyncContainerModule } from "inversify";

/**
 * A simple test framework implementation for testing purposes.
 * Allows manual addition of pipeline definitions without decorator scanning.
 */
export class DummyFramework implements FlexibleFramework {
    public readonly container: AsyncContainerModule;
    private definitions: FlexiblePipelineDocument[] = [];

    constructor() {
        this.container = new AsyncContainerModule(async (module) => {
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
