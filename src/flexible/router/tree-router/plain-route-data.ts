import { RouteValue, RouteData } from "../../../router";

export type PlainRouteValue = Exclude<RouteValue, RouteData>;
export type PlainRouteData = { [paramKey: string]: PlainRouteValue }
