import { FlexibleEvent } from "../event-source/event";
import { FlexibleFilter } from "./filter.interface";
import { FlexibleResponse } from "../event-source/response";

export interface FlexibleExtractor extends FlexibleFilter {
    extractValue(
        event: FlexibleEvent,
        response: FlexibleResponse,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any>;
}
