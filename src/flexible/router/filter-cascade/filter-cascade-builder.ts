import { FilterCascadeNode } from "./filter-cascade-node";
import { FlexibleFilter } from "../../../event";
import { isArray } from "util";
import { RouteDataHelper } from "../../../router";
import { injectable, inject } from "inversify";
import { TREE_ROUTER_TYPES } from "../tree-router/tree-router-types";

@injectable()
export class FilterCascadeBuilder<Resource> {

    private filterNodes: FilterCascadeNode<Resource>[];
    private resource: Resource;

    constructor(
        @inject(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER) 
        private routeDataHelper: RouteDataHelper) {
        this.reset();
    }

    public withResource(resource: Resource): this {
        this.resource = resource;
        return this;
    }

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

    public build(): FilterCascadeNode<Resource>[] {

        if(!this.resource) {
            throw "";
        }

        this.filterNodes.forEach(filterNode => {
            filterNode.resource = this.resource;
        });

        var nodes = this.filterNodes;
        this.reset();

        return nodes.filter(filterStack => filterStack.isValid);
    }

    public reset(): this {
        this.filterNodes = [];
        this.resource = null;
        return this;
    }
}