import { RouteValue, RouteData } from "../../../router";

export type PlainRouteValue = Exclude<RouteValue<string>, RouteData<string>>;
export type PlainRouteData = { [paramKey: string]: PlainRouteValue }
