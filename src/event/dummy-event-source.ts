import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexibleExtractor } from "../event/flexible-extractor";
import { FlexibleFilter } from "../event/flexible-filter";
import { FlexibleEvent } from "../event/flexible-event";
import { Type } from "../flexible/type";
import { ContainerModule } from "inversify";

/**
 * A simple test framework implementation for testing purposes.
 * Allows manual triggering of events without external dependencies.
 */
export class DummyEventSource implements FlexibleEventSource {
    readonly container!: ContainerModule;
    readonly availableExtractors: Type<FlexibleExtractor>[] = [];
    readonly availableFilters: Type<FlexibleFilter>[] = [];

    private eventHandler!: (event: FlexibleEvent) => any;
    public running!: boolean;

    public constructor() {

    }

    public async run(): Promise<boolean> {
        return this.running = true
    }

    public async stop(): Promise<boolean> {
        return this.running = false;
    }

    public onEvent(handler: (event: FlexibleEvent) => Promise<any>): void {
        this.eventHandler = handler;
    }

    public generateEvent(event: FlexibleEvent): Promise<any>{
        if(this.running){
            return this.eventHandler(event);
        }
        else{
            throw "Server not running";
        }
    }
}
