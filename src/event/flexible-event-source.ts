import { FlexibleEvent } from "./flexible-event";
import { FlexibleFilter } from "./flexible-filter";
import { FlexibleExtractor } from "./flexible-extractor";
import { Type } from "../flexible/omit-type";
import { FlexibleResponse } from "../flexible/flexible-response";

export interface FlexibleEventSource {
    readonly availableEventTypes?: String[];
    readonly extractors?: Type<FlexibleExtractor>[];
    readonly filters?: Type<FlexibleFilter>[];
    readonly defaultExtractor?: Type<FlexibleExtractor>;

    run(): Promise<any>;
    stop(): Promise<any>;
    onEvent(handler: (event: FlexibleEvent) => Promise<FlexibleResponse[]>): void;
}