import { RouteValue, RouteData } from "../../../router";

/**
 * A flattened route value that excludes nested RouteData objects.
 *
 * Can be:
 * - Primitive: string, number, boolean
 * - Array: (string | number | boolean)[]
 */
export type PlainRouteValue = Exclude<RouteValue<string>, RouteData<string>>;

/**
 * A flattened representation of route data used for tree insertion and matching.
 *
 * Nested route structures are flattened into a single-level object with
 * dot-notation keys (e.g., `user.id` instead of `{ user: { id: 123 } }`).
 *
 * @example
 * ```typescript
 * const plainRoute: PlainRouteData = {
 *   method: 'GET',
 *   path: '/users',
 *   tags: ['api', 'v1']
 * };
 * ```
 */
export type PlainRouteData = { [paramKey: string]: PlainRouteValue }
