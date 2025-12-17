import { FlexibleEvent } from "./event";
import { FlexibleFilter } from "../routing/filter.interface";
import { FlexibleExtractor } from "../routing/extractor.interface";
import { FlexibleResponse } from "./response";
import { Type } from "../../types";

export interface FlexibleEventSource {
    readonly availableEventTypes?: String[];
    readonly extractors?: Type<FlexibleExtractor>[];
    readonly filters?: Type<FlexibleFilter>[];
    readonly defaultExtractor?: Type<FlexibleExtractor>;

    run(): Promise<any>;
    stop(): Promise<any>;
    onEvent(handler: (event: FlexibleEvent) => Promise<FlexibleResponse[]>): void;
}
