import { FlexibleEvent } from "./flexible-event";
import { RouteData } from "../router/route-data";

export interface FlexibleFilter {
    contextName?: string;
    contextType?: string; 
    readonly staticRouting: RouteData<string>;
    filterEvent?(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): boolean;
}