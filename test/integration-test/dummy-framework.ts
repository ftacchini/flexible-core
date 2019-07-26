import { FlexibleFramework, FlexiblePipelineDocument } from "../../src/framework";
import { AsyncContainerModule } from "inversify";

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