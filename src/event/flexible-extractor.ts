import { FlexibleEvent } from "./flexible-event";
import { FlexibleFilter } from "./flexible-filter";

export interface FlexibleExtractor extends FlexibleFilter {
    extractValue(event: FlexibleEvent): any;
}