import { RouteData } from "../router/route-data";

export interface FlexibleEvent {
    readonly data: any;
    readonly routeData: RouteData;
    readonly eventType: string;
}