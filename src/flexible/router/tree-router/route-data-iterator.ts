import { PlainRouteData, PlainRouteValue } from "./plain-route-data";
import { isNullOrUndefined } from "util";
import { RouteValueMatcher } from "./route-value-matcher";
import { RouteDataHelper } from "../../../router";


export class RouteDataIterator {

    private readonly sortedProperties: string[];
    private currentPropertyIndex: number = 0;
    private currentValueIndex: number = 0;

    constructor(
        private routeDataHelper: RouteDataHelper,
        private _routeData: PlainRouteData = {}) {
        this.sortedProperties = this.getSortedProperties(this.routeData);
    }

    public get routeData(): PlainRouteData {
        return this._routeData;
    }

    public next(): RouteValueMatcher {
        var current = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(current)) {
            current = current[this.currentValueIndex];
        }

        if(isNullOrUndefined(current)) {
            return current;
        }
        
        var routeMatcher = new RouteValueMatcher(
            this.routeDataHelper,
            this.sortedProperties[this.currentPropertyIndex],
            current
        );
        
        this.setNextIndexes();

        return routeMatcher; 
    }

    private getSortedProperties(routeData: PlainRouteData): string[] {
        return Object.keys(routeData).sort();
    }

    private setNextIndexes(): void {
        var currentPropertyValue = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(currentPropertyValue) &&
            !isNullOrUndefined(currentPropertyValue[this.currentValueIndex + 1])) {
            this.currentValueIndex++;
        }
        else {
            this.currentPropertyIndex++;
            this.currentValueIndex = 0;
        }
    }

    private getValueFromPropertyIndex(index: number): PlainRouteValue {
        return this.routeData[this.sortedProperties[index]];
    }
}