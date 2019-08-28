import { FlexibleEvent } from "./flexible-event";
import { RouteData } from "../router/route-data";

export interface FlexibleFilter {
    isLastFilter?: boolean;
    contextName?: string;
    contextType?: any; 
    readonly staticRouting: RouteData<string>;
    filterEvent?(
        event: FlexibleEvent, 
        filterBinnacle: { [key: string]: string }): Promise<boolean>;
}