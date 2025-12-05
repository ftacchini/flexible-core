import { PlainRouteData, PlainRouteValue } from "./plain-route-data";
import { isNullOrUndefined } from "util";
import { RouteValueMatcher } from "./route-value-matcher";
import { RouteDataHelper } from "../route-data-helper";

/**
 * Iterator for traversing route data properties in a consistent order.
 *
 * Ensures that routes are inserted into the decision tree in a deterministic
 * way by:
 * - Sorting properties alphabetically
 * - Handling array values by iterating through each element
 * - Creating RouteValueMatcher instances for each property-value pair
 *
 * @example
 * ```typescript
 * const routeData = { method: 'GET', tags: ['api', 'v1'], path: '/users' };
 * const iterator = new RouteDataIterator(helper, routeData);
 *
 * // Iterates in order: method:GET, path:/users, tags:api, tags:v1
 * let matcher = iterator.next(); // method:GET
 * matcher = iterator.next();     // path:/users
 * matcher = iterator.next();     // tags:api
 * matcher = iterator.next();     // tags:v1
 * ```
 */
export class RouteDataIterator {

    private readonly sortedProperties: string[];
    private currentPropertyIndex: number = 0;
    private currentValueIndex: number = 0;

    constructor(
        private routeDataHelper: RouteDataHelper,
        private _routeData: PlainRouteData = {}) {
        this.sortedProperties = this.getSortedProperties(this.routeData);
    }

    /**
     * Gets the route data being iterated.
     */
    public get routeData(): PlainRouteData {
        return this._routeData;
    }

    /**
     * Returns the next RouteValueMatcher for the current property-value pair.
     *
     * Handles array values by iterating through each element before moving
     * to the next property. Returns null when all properties have been iterated.
     *
     * @returns RouteValueMatcher for the current property-value, or null if done
     */
    public next(): RouteValueMatcher {
        var current = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(current)) {
            current = current[this.currentValueIndex];
        }

        if(isNullOrUndefined(current)) {
            return current;
        }

        var routeMatcher = new RouteValueMatcher(
            this.routeDataHelper,
            this.sortedProperties[this.currentPropertyIndex],
            current
        );

        this.setNextIndexes();

        return routeMatcher;
    }

    private getSortedProperties(routeData: PlainRouteData): string[] {
        return Object.keys(routeData).sort();
    }

    private setNextIndexes(): void {
        var currentPropertyValue = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(currentPropertyValue) &&
            !isNullOrUndefined(currentPropertyValue[this.currentValueIndex + 1])) {
            this.currentValueIndex++;
        }
        else {
            this.currentPropertyIndex++;
            this.currentValueIndex = 0;
        }
    }

    private getValueFromPropertyIndex(index: number): PlainRouteValue {
        return this.routeData[this.sortedProperties[index]];
    }
}