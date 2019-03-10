import { FlexibleEvent } from "./flexible-event";
import { RouteData } from "../router/route-data";

export interface FlexibleFilter {
    readonly staticRouting: RouteData;
    filterEvent?(event: FlexibleEvent): boolean;
}