import { RouteData, RouteValue } from "../../../router/route-data";
import { FlexibleFilter, FlexibleEvent } from "../../../event";
import { intersection, mergeWith, union } from "lodash";
import { RouteDataHelper } from "../route-data-helper";

export class FilterCascadeNode<Resource> {

    private _resource?: Resource;

    constructor(
        private routeDataHelper: RouteDataHelper,
        private filter: FlexibleFilter,
        private parentNode: FilterCascadeNode<Resource> | null = null) {

    }

    public set resource(resource: Resource) {
        if (this.parentNode) {
            this.parentNode.resource = resource;
        }
        else {
            this._resource = resource;
        }
    }

    public get isValid(): boolean {
        const data = this.routeData;
        return data !== null && this.routeDataHelper.isRouteData(data);
    }

    public get routeData(): RouteData<string> | null {

        var routeData: RouteData<string> = {};

        if (this.parentNode) {
            const parentData = this.parentNode.routeData;
            if (parentData === null) {
                return null;
            }
            routeData = parentData;

            if (!this.routeDataHelper.isRouteData(routeData)) {
                return null;
            }
        }

        var isValid = this.validateMerge(routeData, this.filter.staticRouting)

        if (!isValid) {
            return null;
        }

        return mergeWith({}, routeData, this.filter.staticRouting, (objValue, srcValue) => {
            if (this.routeDataHelper.isRouteDataArray(objValue) && this.routeDataHelper.isRouteDataArray(srcValue) ||
                this.isArrayAndSameType(objValue, srcValue) || this.isArrayAndSameType(srcValue, objValue)) {

                if (!this.routeDataHelper.isRouteDataArray(objValue)) {
                    objValue = [objValue];
                }

                if (!this.routeDataHelper.isRouteDataArray(srcValue)) {
                    srcValue = [srcValue];
                }

                return union(objValue, srcValue);
            }
        });
    }

    public async getEventResources(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string },
        ignoreStaticRouting: boolean = false): Promise<Resource | null> {

        var pipeline: Resource | undefined = this._resource;

        if (!this.parentNode && !this._resource) {
            throw "Parent Node without Pipeline";
        }

        if (this.parentNode) {
            const parentResult = await this.parentNode.getEventResources(event, filterBinnacle, ignoreStaticRouting);

            if (parentResult === null) {
                return null;
            }
            pipeline = parentResult;
        }

        var isMatch = ignoreStaticRouting || this.isRouteMatch(this.filter.staticRouting, event.routeData);

        if (this.filter.filterEvent) {
            isMatch = await this.filter.filterEvent(event, filterBinnacle);
        }

        if (!isMatch) {
            return null;
        }

        return pipeline!;
    }

    private isRouteMatch(ownRoute: RouteData<string>, routeData: RouteData<string>): boolean {

        return Object.keys(ownRoute).every(innerProperty => {
            var ownRouteValue = ownRoute[innerProperty];
            var routeValue = routeData[innerProperty];

            if (typeof ownRouteValue === typeof routeValue) {
                if (this.routeDataHelper.isRouteData(ownRouteValue) &&
                    this.routeDataHelper.isRouteData(routeValue) &&
                    this.isRouteMatch(ownRouteValue, routeValue)) {
                    return true;
                }

                if (this.routeDataHelper.isRouteDataArray(ownRouteValue) &&
                    this.routeDataHelper.isRouteDataArray(routeValue) &&
                    intersection<RouteValue<string>>(ownRouteValue, routeValue).length === ownRouteValue.length) {
                    return true;
                }

                if (ownRouteValue === routeValue) {
                    return true;
                }
            }
            else if (this.isArrayAndSameType(ownRouteValue, routeValue)) {
                (<any[]>ownRouteValue).indexOf(ownRouteValue) != -1
            }
            else if (this.isArrayAndSameType(routeValue, ownRouteValue)) {
                return (<any[]>routeValue).indexOf(ownRouteValue) != -1
            }

            return false;

        });
    }

    private validateMerge(rootData: RouteData<string>, ownRouteData: RouteData<string>): boolean {
        return Object.keys(ownRouteData).every(innerProperty => {
            return this.validateProperty(
                rootData[innerProperty],
                ownRouteData[innerProperty]);
        });
    }

    private validateProperty(rootDataProperty: RouteValue<string>, ownDataProperty: RouteValue<string>): boolean {

        if (rootDataProperty === undefined) {
            return true;
        }

        if (typeof rootDataProperty === typeof ownDataProperty &&
            (
                this.routeDataHelper.isRouteData(rootDataProperty) && this.validateMerge(rootDataProperty, ownDataProperty as RouteData<string>) ||
                this.routeDataHelper.isRouteDataArray(rootDataProperty) && this.isArrayAndSameType(ownDataProperty, rootDataProperty[0]) ||
                rootDataProperty === ownDataProperty
            )) {

            return true;
        }

        if (this.isArrayAndSameType(ownDataProperty, rootDataProperty) ||
            this.isArrayAndSameType(rootDataProperty, ownDataProperty)) {
            return true;
        }

        return false;
    }

    private isArrayAndSameType(value1: RouteValue<string>, value2: RouteValue<string>): boolean {
        return this.routeDataHelper.isRouteDataArray(value1) && (typeof value1[0] === typeof value2);
    }
}