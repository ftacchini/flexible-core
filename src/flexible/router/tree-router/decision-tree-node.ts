import { FilterCascadeNode } from "../filter-cascade/filter-cascade-node";
import { RouteDataIterator } from "./route-data-iterator";
import { RouteValueMatcher } from "./route-value-matcher";
import { PlainRouteData } from "./plain-route-data";

export class DecisionTreeNode {

    private valueMatcher: RouteValueMatcher;
    private allLink: DecisionTreeNode;
    private matchLink: DecisionTreeNode;

    private filters: FilterCascadeNode[] = [];

    public addRouteData(
        iterator: RouteDataIterator,
        filter: FilterCascadeNode): void {

        if (this.valueMatcher) {
            this.propagateRouteData(iterator, filter);
        }
        else {
            this.valueMatcher = iterator.next();

            if (this.valueMatcher) {
                this.propagateRouteData(iterator, filter);
            }
            else {
                this.filters.push(filter);
            }
        }
    }

    public getRouteFilters(routeData: PlainRouteData): FilterCascadeNode[] {
        var filters: FilterCascadeNode[] = this.filters;

        if (this.valueMatcher && 
            this.valueMatcher.isMatch(routeData) && 
            this.matchLink) {
            filters = [...filters, ...this.matchLink.getRouteFilters(routeData)];
        }

        if(this.allLink) {
            filters = [...filters, ...this.allLink.getRouteFilters(routeData)];
        }

        return filters;
    }

    private propagateRouteData(
        iterator: RouteDataIterator,
        filter: FilterCascadeNode): void {

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