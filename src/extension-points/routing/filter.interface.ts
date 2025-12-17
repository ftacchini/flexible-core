import { FlexibleEvent } from "../event-source/event";
import { RouteData } from "./route-data";

export interface FlexibleFilter {
    isLastFilter?: boolean;
    contextName?: string;
    contextType?: any;
    readonly staticRouting: RouteData<string>;
    filterEvent?(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string }): Promise<boolean>;
}
