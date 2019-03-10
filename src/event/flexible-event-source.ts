import { FlexibleEvent } from "./flexible-event";
import { AsyncContainerModule } from "inversify";

import { FlexibleFilter } from "./flexible-filter";
import { FlexibleExtractor} from "./flexible-extractor";
import { Type } from "../flexible/omit-type";
import { FlexibleResponse } from "../flexible/flexible-response";

export interface FlexibleEventSource {
    readonly containerModule: AsyncContainerModule;

    readonly availableEventTypes?: String[];
    readonly defaultExtractor?: Type<FlexibleExtractor>;
    readonly extractors?: Type<FlexibleExtractor>[];
    readonly filters?: Type<FlexibleFilter>[];
    
    run(): Promise<boolean>;
    stop(): Promise<boolean>;
    onEvent(handler: (event: FlexibleEvent) => Promise<FlexibleResponse>): void;
}