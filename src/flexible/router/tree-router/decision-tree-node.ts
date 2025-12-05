import { RouteDataIterator } from "./route-data-iterator";
import { RouteValueMatcher } from "./route-value-matcher";
import { PlainRouteData } from "./plain-route-data";

/**
 * A node in the decision tree used for efficient route matching.
 *
 * The tree structure enables O(log n) route lookups by organizing routes
 * based on their properties. Each node represents a decision point based
 * on a route property value.
 *
 * Tree Structure:
 * ```
 *                    Root
 *                     |
 *              [method: GET]
 *                /        \
 *           match         all
 *             |            |
 *      [path: /users]  [path: /posts]
 *           /   \          /    \
 *        match  all     match   all
 *         |      |        |      |
 *      [leaf]  [leaf]  [leaf]  [leaf]
 * ```
 *
 * - `matchLink`: Follows when route property matches this node's matcher
 * - `allLink`: Follows for routes that don't match (alternative paths)
 * - `leaves`: Filter cascades that end at this node (complete routes)
 */
export class DecisionTreeNode<LeafType> {

    private valueMatcher!: RouteValueMatcher;
    private allLink!: DecisionTreeNode<LeafType>;
    private matchLink!: DecisionTreeNode<LeafType>;

    private leaves: LeafType[] = [];

    /**
     * Adds a route to the decision tree.
     *
     * The route is inserted by iterating through its properties and creating
     * or traversing nodes based on property values. Routes with matching
     * prefixes share tree paths, enabling efficient lookups.
     *
     * @param iterator - Iterator over the route's properties
     * @param filter - The filter cascade to associate with this route
     */
    public addRouteData(
        iterator: RouteDataIterator,
        filter: LeafType): void {

        if (this.valueMatcher) {
            this.propagateRouteData(iterator, filter);
        }
        else {
            this.valueMatcher = iterator.next();

            if (this.valueMatcher) {
                this.propagateRouteData(iterator, filter);
            }
            else {
                this.leaves.push(filter);
            }
        }
    }

    /**
     * Retrieves all filter cascades that match the given route data.
     *
     * Traverses the tree by:
     * 1. Collecting leaves at this node (routes that end here)
     * 2. Following matchLink if route property matches
     * 3. Following allLink for alternative routes
     *
     * @param routeData - The route data to match against
     * @returns Array of matching filter cascades
     */
    public getRouteLeaves(routeData: PlainRouteData): LeafType[] {
        var filters: LeafType[] = this.leaves;

        if (this.valueMatcher &&
            this.valueMatcher.isMatch(routeData) &&
            this.matchLink) {
            filters = [...filters, ...this.matchLink.getRouteLeaves(routeData)];
        }

        if(this.allLink) {
            filters = [...filters, ...this.allLink.getRouteLeaves(routeData)];
        }

        return filters;
    }

    /**
     * Propagates route data to child nodes based on match result.
     *
     * Creates child nodes lazily (only when needed) and routes the filter
     * to the appropriate branch based on whether the current property matches.
     *
     * @param iterator - Iterator over the route's properties
     * @param filter - The filter cascade to propagate
     */
    private propagateRouteData(
        iterator: RouteDataIterator,
        filter: LeafType): void {

        if (this.valueMatcher.isMatch(iterator.routeData)) {
            this.matchLink || (this.matchLink = new DecisionTreeNode());
            this.matchLink.addRouteData(iterator, filter);
        }
        else {
            this.allLink || (this.allLink = new DecisionTreeNode());
            this.allLink.addRouteData(iterator, filter);
        }
    }
}