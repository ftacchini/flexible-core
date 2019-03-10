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

        var hasNext = this.setNextIndexes();

        if(!hasNext) {
            return null;
        }

        var nextValue = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(nextValue)) {
            nextValue = nextValue[this.currentValueIndex];
        }

        return new RouteValueMatcher(
            this.routeDataHelper,
            this.sortedProperties[this.currentPropertyIndex],
            nextValue
        );
    }

    private getSortedProperties(routeData: PlainRouteData): string[] {
        return Object.keys(routeData).sort();
    }

    private setNextIndexes(): boolean {
        var currentPropertyValue = this.getValueFromPropertyIndex(this.currentPropertyIndex);

        if (this.routeDataHelper.isRouteDataArray(currentPropertyValue) &&
            !isNullOrUndefined(currentPropertyValue[this.currentValueIndex + 1])) {
            this.currentValueIndex++;
        }
        else if (!isNullOrUndefined(this.getValueFromPropertyIndex(this.currentPropertyIndex + 1))) {
            this.currentPropertyIndex++;
            this.currentValueIndex = 0;
        }
        else {
            return false;
        }
        
        return true
    }

    private getValueFromPropertyIndex(index: number): PlainRouteValue {
        return this.routeData[this.sortedProperties[index]];
    }
}