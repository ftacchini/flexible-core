import { FlexibleEventSource } from "../../extension-points/event-source/event-source.interface";
import { FlexibleExtractor } from "../../extension-points/routing/extractor.interface";
import { FlexibleFilter } from "../../extension-points/routing/filter.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { Type } from "../../types";
import { DependencyContainer } from "tsyringe";

/**
 * A simple test framework implementation for testing purposes.
 * Allows manual triggering of events without external dependencies.
 */
export class DummyEventSource implements FlexibleEventSource {
    readonly container!: DependencyContainer;
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
