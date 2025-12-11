import { FlexibleFilter, FlexibleEvent } from "../../../event";
import { FlexibleRouter } from "../../../router/flexible-router";
import { FilterCascadeBuilder } from "../filter-cascade/filter-cascade-builder";
import { DecisionTreeNode } from "./decision-tree-node";
import { RouteDataIterator } from "./route-data-iterator";
import { injectable, inject } from "tsyringe";
import { TREE_ROUTER_TYPES } from "./tree-router-types";
import { FilterCascadeNode } from "../filter-cascade/filter-cascade-node";
import { RouteDataHelper } from "../route-data-helper";
import { FlexibleLogger } from "../../../logging/flexible-logger";
import { FLEXIBLE_APP_TYPES } from "../../flexible-app-types";

/**
 * A high-performance router implementation using a decision tree data structure.
 *
 * This router efficiently matches incoming events to resources (pipelines or extractors)
 * by building a decision tree based on route data properties. The tree structure allows
 * for O(log n) lookup time in most cases, making it suitable for applications with many routes.
 *
 * The router supports:
 * - Static routing (exact matches on route properties)
 * - Dynamic routing (custom filter functions)
 * - Complex filter combinations (AND/OR logic through filter cascades)
 * - Nested route data structures
 *
 * @example
 * ```typescript
 * const router = new FlexibleTreeRouter(filterCascadeBuilder, routeDataHelper);
 *
 * // Add a resource with filters
 * router.addResource([
 *   { staticRouting: { method: 'GET', path: '/users' } }
 * ], usersPipeline);
 *
 * // Match an event to resources
 * const event = { routeData: { method: 'GET', path: '/users' }, ... };
 * const pipelines = await router.getEventResources(event, {});
 * ```
 */
@injectable()
export class FlexibleTreeRouter<Resource> implements FlexibleRouter<Resource> {

    private baseNode: DecisionTreeNode<FilterCascadeNode<Resource>>;
    private routeCount: number = 0;

    constructor(
        @inject(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER)
        private filterCascadeBuilder: FilterCascadeBuilder<Resource>,
        @inject(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)
        private routeDataHelper: RouteDataHelper,
        @inject(FLEXIBLE_APP_TYPES.LOGGER)
        private logger?: FlexibleLogger) {

        this.baseNode = new DecisionTreeNode();
    }

    /**
     * Finds all resources that match the given event.
     *
     * The matching process:
     * 1. Converts event route data to a flat structure
     * 2. Traverses the decision tree to find matching filter cascades
     * 3. Evaluates each filter cascade (static + dynamic filters)
     * 4. Returns resources from matching cascades
     *
     * @param event - The event to match against registered resources
     * @param filterBinnacle - Object for storing filter state/context during matching
     * @returns Array of matching resources
     */
    public async getEventResources(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Promise<Resource[]> {
        var plainRouteData = this.routeDataHelper.turnIntoPlainRouteData(event.routeData);

        this.logger?.debug("Tree router: Finding matching routes", {
            eventType: event.eventType,
            routeDataKeys: Object.keys(plainRouteData),
            totalRoutes: this.routeCount
        });

        var filters = this.baseNode.getRouteLeaves(plainRouteData);

        this.logger?.debug("Tree router: Found candidate filters", {
            candidateCount: filters.length
        });

        const results = await Promise.all(filters.map(filter => filter.getEventResources(event, filterBinnacle, true)));
        const matchedResources = results.filter((resource): resource is Awaited<Resource> => resource !== null) as Resource[];

        this.logger?.debug("Tree router: Matched resources", {
            matchedCount: matchedResources.length
        });

        return matchedResources;
    }

    /**
     * Registers a resource with its associated filters in the routing tree.
     *
     * The registration process:
     * 1. Builds filter cascades from the provided filters
     * 2. Validates that filter combinations are compatible
     * 3. Converts route data to a flat structure for tree insertion
     * 4. Inserts the filter cascade into the decision tree
     *
     * @param filters - Array of filter arrays. Each inner array represents filters that must all match (AND logic).
     *                  Multiple inner arrays represent alternatives (OR logic).
     * @param resource - The resource (pipeline or extractor) to associate with these filters
     */
    public addResource(filters: (FlexibleFilter | FlexibleFilter[])[], resource: Resource): void {
        this.logger?.debug("Tree router: Adding resource", {
            filterCount: filters.length,
            resourceType: (resource as any).constructor?.name || 'Unknown'
        });

        this.filterCascadeBuilder.reset()
            .withResource(resource);

        filters.forEach(filter => {
            this.filterCascadeBuilder.addFlexibleFilters(filter);
        });

        const cascades = this.filterCascadeBuilder.build();

        this.logger?.debug("Tree router: Built filter cascades", {
            cascadeCount: cascades.length
        });

        cascades.forEach(filterCascade => {
            const routeData = filterCascade.routeData;
            if (routeData !== null) {
                var plainRouteData = this.routeDataHelper.turnIntoPlainRouteData(routeData);

                this.logger?.debug("Tree router: Inserting route into tree", {
                    routeProperties: Object.keys(plainRouteData),
                    routeData: plainRouteData
                });

                this.baseNode.addRouteData(
                    new RouteDataIterator(this.routeDataHelper, plainRouteData),
                    filterCascade);

                this.routeCount++;
            }
        });

        this.logger?.debug("Tree router: Resource added", {
            totalRoutes: this.routeCount
        });
    }


}