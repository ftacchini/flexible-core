import { FlexibleEvent } from "./flexible-event";

export interface FlexibleExtractor {
    extractValue(event: FlexibleEvent): any;
}