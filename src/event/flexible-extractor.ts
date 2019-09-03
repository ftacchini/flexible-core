import { FlexibleEvent } from "./flexible-event";
import { FlexibleFilter } from "./flexible-filter";
import { FlexibleResponse } from "../flexible/flexible-response";

export interface FlexibleExtractor extends FlexibleFilter {
    extractValue(event: FlexibleEvent, response: FlexibleResponse, filterBinnacle: { [key: string]: string }): Promise<any>;
}