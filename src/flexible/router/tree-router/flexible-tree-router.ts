import { FlexibleFilter, FlexibleEvent } from "../../../event";
import { FlexibleRouter } from "../../../router/flexible-router";
import { FilterCascadeBuilder } from "../filter-cascade/filter-cascade-builder";
import { DecisionTreeNode } from "./decision-tree-node";
import { RouteDataIterator } from "./route-data-iterator";
import { injectable, inject } from "inversify";
import { TREE_ROUTER_TYPES } from "./tree-router-types";
import { FilterCascadeNode } from "../filter-cascade/filter-cascade-node";
import { RouteDataHelper } from "../route-data-helper";


@injectable()
export class FlexibleTreeRouter<Resource> implements FlexibleRouter<Resource> {

    private baseNode: DecisionTreeNode<FilterCascadeNode<Resource>>;

    constructor(
        @inject(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER)
        private filterCascadeBuilder: FilterCascadeBuilder<Resource>,
        @inject(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)
        private routeDataHelper: RouteDataHelper) {

        this.baseNode = new DecisionTreeNode();
    }

    public async getEventResources(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Promise<Resource[]> {
        var plainRouteData = this.routeDataHelper.turnIntoPlainRouteData(event.routeData);
        var filters = this.baseNode.getRouteLeaves(plainRouteData);

        return (await Promise.all(filters.map(filter => filter.getEventResources(event, filterBinnacle, true))))
            .filter(resource => resource);
    }

    public addResource(filters: (FlexibleFilter | FlexibleFilter[])[], resource: Resource): void {
        this.filterCascadeBuilder.reset()
            .withResource(resource);

        filters.forEach(filter => {
            this.filterCascadeBuilder.addFlexibleFilters(filter);
        });

        this.filterCascadeBuilder
            .build()
            .forEach(filterCascade => {
                var plainRouteData = this.routeDataHelper.turnIntoPlainRouteData(filterCascade.routeData);

                this.baseNode.addRouteData(
                    new RouteDataIterator(this.routeDataHelper, plainRouteData),
                    filterCascade);
            });
    }

    
}