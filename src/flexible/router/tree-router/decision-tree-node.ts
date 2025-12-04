import { RouteDataIterator } from "./route-data-iterator";
import { RouteValueMatcher } from "./route-value-matcher";
import { PlainRouteData } from "./plain-route-data";

export class DecisionTreeNode<LeafType> {

    private valueMatcher!: RouteValueMatcher;
    private allLink!: DecisionTreeNode<LeafType>;
    private matchLink!: DecisionTreeNode<LeafType>;

    private leaves: LeafType[] = [];

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