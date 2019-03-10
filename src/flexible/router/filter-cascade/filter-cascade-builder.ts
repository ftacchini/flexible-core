import { FilterCascadeNode } from "./filter-cascade-node";
import { FlexibleFilter } from "../../../event";
import { FlexiblePipeline } from "../../flexible-pipeline";
import { isArray } from "util";
import { RouteDataHelper } from "../../../router";

export class FilterCascadeBuilder {

    private filterNodes: FilterCascadeNode[];
    private pipeline: FlexiblePipeline;

    constructor(private routeDataHelper: RouteDataHelper) {
    }

    public withPipeline(flexiblePipeline: FlexiblePipeline): this {
        this.pipeline = flexiblePipeline;
        return this;
    }

    public addFlexibleFilters(flexibleFilters: FlexibleFilter | FlexibleFilter[]): this {

        var filterNodes: FilterCascadeNode[] = [];
        var filters = isArray(flexibleFilters) ? flexibleFilters : [flexibleFilters];  

        filters.forEach((flexibleFilter)=> {
            this.filterNodes.forEach((filterNode) => {
                filterNodes.push(new FilterCascadeNode(this.routeDataHelper, flexibleFilter, filterNode));
            })
        })

        this.filterNodes = filterNodes;
        
        return this;
    }

    public build(): FilterCascadeNode[] {

        if(!this.pipeline) {
            throw "";
        }

        this.filterNodes.forEach(filterNode => {
            filterNode.pipeline = this.pipeline;
        });

        var nodes = this.filterNodes;
        this.reset();

        return nodes.filter(filterStack => filterStack.isValid);
    }

    public reset(): this {
        this.filterNodes = [];
        this.pipeline = null;
        return this;
    }
}