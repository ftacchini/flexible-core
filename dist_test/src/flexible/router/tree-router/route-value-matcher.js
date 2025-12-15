"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteValueMatcher = void 0;
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
var RouteValueMatcher = /** @class */ (function () {
    function RouteValueMatcher(routeDataHelper, propertyKey, value) {
        this.routeDataHelper = routeDataHelper;
        this.propertyKey = propertyKey;
        this.value = value;
    }
    /**
     * Checks if the route data matches this matcher's property and value.
     *
     * @param routeData - The route data to check
     * @returns True if the property value matches, false otherwise
     */
    RouteValueMatcher.prototype.isMatch = function (routeData) {
        var _this = this;
        var value = routeData[this.propertyKey];
        if (this.routeDataHelper.isRouteDataArray(value)) {
            return !!value.find(function (x) { return x === _this.value; });
        }
        return value === this.value;
    };
    return RouteValueMatcher;
}());
exports.RouteValueMatcher = RouteValueMatcher;
