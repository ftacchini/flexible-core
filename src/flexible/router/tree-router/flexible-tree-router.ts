import { FlexiblePipeline } from "../../flexible-pipeline";
import { FlexibleFilter, FlexibleEvent } from "../../../event";
import { FlexibleRouter } from "../../../router/flexible-router";
import { FilterCascadeBuilder } from "../filter-cascade/filter-cascade-builder";
import { DecisionTreeNode } from "./decision-tree-node";
import { RouteData, RouteDataHelper } from "../../../router";
import { PlainRouteData } from "./plain-route-data";
import { RouteDataIterator } from "./route-data-iterator";
import { join } from "lodash";

const SEPARATOR = "@";

export class FlexibleTreeRouter implements FlexibleRouter {

    private baseNode: DecisionTreeNode;

    constructor(
        private filterCascadeBuilder: FilterCascadeBuilder,
        private routeDataHelper: RouteDataHelper) {
        this.baseNode = new DecisionTreeNode();
    }

    public getEventPipelines(event: FlexibleEvent): FlexiblePipeline[] {
        var plainRouteData = this.turnIntoPlainRouteData(event.routeData);
        var fitlers = this.baseNode.getRouteFilters(plainRouteData);

        return fitlers.map(filter => filter.getEventPipeline(event));
    }

    public addPipeline(filters: (FlexibleFilter | FlexibleFilter[])[], pipeline: FlexiblePipeline): void {
        this.filterCascadeBuilder.reset()
            .withPipeline(pipeline);

        filters.forEach(filter => {
            this.filterCascadeBuilder.addFlexibleFilters(filter);
        });

        this.filterCascadeBuilder
            .build()
            .forEach(filterCascade =>  {
                var plainRouteData = this.turnIntoPlainRouteData(filterCascade.routeData);

                this.baseNode.addRouteData(
                    new RouteDataIterator(this.routeDataHelper, plainRouteData),
                    filterCascade);
            });
    }

    private turnIntoPlainRouteData(routeData: RouteData, propertyChain: string[] = []): PlainRouteData {
        var plainRouteData: PlainRouteData = {};

        Object.keys(routeData).forEach(property => {

            var value = routeData[property];

            if (this.routeDataHelper.isRouteData(value)) {
                plainRouteData = {
                    ...plainRouteData,
                    ...this.turnIntoPlainRouteData(value, [property, ...propertyChain])
                };
            }
            else {
                plainRouteData[this.getPropertyString(propertyChain, property)] = value;
            }
        });

        return plainRouteData;
    }

    private getPropertyString(propertyChain: string[], property: string): string {
        return join([property, ...propertyChain], SEPARATOR);
    }
}