"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteDataIterator = void 0;
var util_1 = require("util");
var route_value_matcher_1 = require("./route-value-matcher");
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
var RouteDataIterator = /** @class */ (function () {
    function RouteDataIterator(routeDataHelper, _routeData) {
        if (_routeData === void 0) { _routeData = {}; }
        this.routeDataHelper = routeDataHelper;
        this._routeData = _routeData;
        this.currentPropertyIndex = 0;
        this.currentValueIndex = 0;
        this.sortedProperties = this.getSortedProperties(this.routeData);
    }
    Object.defineProperty(RouteDataIterator.prototype, "routeData", {
        /**
         * Gets the route data being iterated.
         */
        get: function () {
            return this._routeData;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the next RouteValueMatcher for the current property-value pair.
     *
     * Handles array values by iterating through each element before moving
     * to the next property. Returns null when all properties have been iterated.
     *
     * @returns RouteValueMatcher for the current property-value, or null if done
     */
    RouteDataIterator.prototype.next = function () {
        var current = this.getValueFromPropertyIndex(this.currentPropertyIndex);
        if (this.routeDataHelper.isRouteDataArray(current)) {
            current = current[this.currentValueIndex];
        }
        if ((0, util_1.isNullOrUndefined)(current)) {
            return current;
        }
        var routeMatcher = new route_value_matcher_1.RouteValueMatcher(this.routeDataHelper, this.sortedProperties[this.currentPropertyIndex], current);
        this.setNextIndexes();
        return routeMatcher;
    };
    RouteDataIterator.prototype.getSortedProperties = function (routeData) {
        return Object.keys(routeData).sort();
    };
    RouteDataIterator.prototype.setNextIndexes = function () {
        var currentPropertyValue = this.getValueFromPropertyIndex(this.currentPropertyIndex);
        if (this.routeDataHelper.isRouteDataArray(currentPropertyValue) &&
            !(0, util_1.isNullOrUndefined)(currentPropertyValue[this.currentValueIndex + 1])) {
            this.currentValueIndex++;
        }
        else {
            this.currentPropertyIndex++;
            this.currentValueIndex = 0;
        }
    };
    RouteDataIterator.prototype.getValueFromPropertyIndex = function (index) {
        return this.routeData[this.sortedProperties[index]];
    };
    return RouteDataIterator;
}());
exports.RouteDataIterator = RouteDataIterator;
