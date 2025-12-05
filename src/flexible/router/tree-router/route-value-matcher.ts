import { PlainRouteData } from "./plain-route-data";
import { RouteDataHelper } from "../route-data-helper";

/**
 * Matches a specific route property value against incoming route data.
 *
 * Used by decision tree nodes to determine which branch to follow.
 * Supports matching against:
 * - Primitive values (string, number, boolean)
 * - Arrays (checks if value exists in array)
 *
 * @example
 * ```typescript
 * const matcher = new RouteValueMatcher(helper, 'method', 'GET');
 * matcher.isMatch({ method: 'GET', path: '/users' }); // true
 * matcher.isMatch({ method: 'POST', path: '/users' }); // false
 * ```
 */
export class RouteValueMatcher {

    constructor(
        private routeDataHelper: RouteDataHelper,
        private propertyKey: string,
        private value: string | number | boolean) {

        }

    /**
     * Checks if the route data matches this matcher's property and value.
     *
     * @param routeData - The route data to check
     * @returns True if the property value matches, false otherwise
     */
    isMatch(routeData: PlainRouteData): boolean {

        var value = routeData[this.propertyKey];

        if(this.routeDataHelper.isRouteDataArray(value)) {
            return !!(value as (string | number)[]).find(x => x === this.value);
        }

        return value === this.value;
    }
}

