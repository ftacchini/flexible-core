import { RouteData } from "../routing/route-data";

export interface FlexibleEvent {
    readonly data: any;
    readonly routeData: RouteData<string>;
    readonly eventType: string;
    readonly requestId?: string;
    readonly cancellationToken?: AbortSignal;
}
