import { FilterCascadeNode } from "./filter-cascade-node";
import { FlexibleFilter } from "../../../event";
import { injectable, inject } from "inversify";
import { TREE_ROUTER_TYPES } from "../tree-router/tree-router-types";
import { RouteDataHelper } from "../route-data-helper";

const isArray = Array.isArray;

/**
 * Builder for creating filter cascade chains.
 *
 * A filter cascade is a chain of filters that must all match for a resource to be selected.
 * This builder supports creating multiple cascades from combinations of filters (AND/OR logic).
 *
 * @example
 * ```typescript
 * builder
 *   .withResource(myPipeline)
 *   .addFlexibleFilters([filterA, filterB])  // Both must match (AND)
 *   .addFlexibleFilters(filterC)             // Creates alternative path (OR)
 *   .build();
 * ```
 */
@injectable()
export class FilterCascadeBuilder<Resource> {

    private filterNodes!: FilterCascadeNode<Resource>[];
    private resource!: Resource;

    constructor(
        @inject(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)
        private routeDataHelper: RouteDataHelper) {
        this.reset();
    }

    /**
     * Sets the resource (pipeline or extractor) for the filter cascade.
     *
     * @param resource - The resource to associate with the filters
     * @returns This builder for chaining
     */
    public withResource(resource: Resource): this {
        this.resource = resource;
        return this;
    }

    /**
     * Adds filters to the cascade, creating combinations for AND/OR logic.
     *
     * - Single filter: Creates one cascade path
     * - Array of filters: All must match (AND logic)
     * - Multiple calls: Creates alternative paths (OR logic)
     *
     * @param flexibleFilters - Single filter or array of filters to add
     * @returns This builder for chaining
     */
    public addFlexibleFilters(flexibleFilters: FlexibleFilter | FlexibleFilter[]): this {

        var filterNodes: FilterCascadeNode<Resource>[] = [];
        var filters = isArray(flexibleFilters) ? flexibleFilters : [flexibleFilters];

        filters.forEach((flexibleFilter)=> {
            if(this.filterNodes.length) {
                this.filterNodes.forEach((filterNode) => {
                    filterNodes.push(new FilterCascadeNode<Resource>(this.routeDataHelper, flexibleFilter, filterNode));
                })
            }
            else {
                filterNodes.push(new FilterCascadeNode<Resource>(this.routeDataHelper, flexibleFilter));
            }

        })

        this.filterNodes = filterNodes;

        return this;
    }

    /**
     * Builds and returns all valid filter cascade chains.
     *
     * Validates that:
     * - A resource has been set
     * - All filter cascades have valid route data
     *
     * After building, the builder is automatically reset for reuse.
     *
     * @returns Array of valid filter cascade nodes
     * @throws Error if resource is not set
     */
    public build(): FilterCascadeNode<Resource>[] {

        if(!this.resource) {
            throw new Error("Resource must be set before building filter cascade");
        }

        this.filterNodes.forEach(filterNode => {
            filterNode.resource = this.resource;
        });

        var nodes = this.filterNodes;
        this.reset();

        return nodes.filter(filterStack => filterStack.isValid);
    }

    /**
     * Resets the builder to initial state for reuse.
     *
     * @returns This builder for chaining
     */
    public reset(): this {
        this.filterNodes = [];
        this.resource = null!;
        return this;
    }
}