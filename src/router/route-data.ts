export type RouteValue<keys extends string> = string | number | boolean | string[] | number[] | RouteData<keys>;
export type RouteData<keys extends string> = { [k in keys]: RouteValue<keys> }
