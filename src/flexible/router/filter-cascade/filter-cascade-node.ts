import { RouteData, RouteValue } from "../../../router/route-data";
import { FlexibleFilter, FlexibleEvent } from "../../../event";
import { intersection, merge } from "lodash";
import { FlexiblePipeline } from "../../flexible-pipeline";
import { RouteDataHelper } from "../../../router/route-data-helper";

export class FilterCascadeNode {

    private _pipeline?: FlexiblePipeline;

    constructor(
        private routeDataHelper: RouteDataHelper,
        private filter: FlexibleFilter,
        private parentNode: FilterCascadeNode) {

    }

    public set pipeline(pipeline: FlexiblePipeline) {
        if (this.parentNode) {
            this.parentNode.pipeline = pipeline;
        }
        else {
            this._pipeline = pipeline;
        }
    }

    public get isValid(): boolean {
        return this.routeDataHelper.isRouteData(this.routeData);
    }

    public get routeData(): RouteData {

        var routeData: RouteData = {};

        if (this.parentNode) {
            routeData = this.parentNode.routeData;

            if (!this.routeDataHelper.isRouteData(routeData)) {
                return null;
            }
        }

        var isValid = this.validateMerge(routeData, this.filter.staticRouting)

        if (!isValid) {
            return null;
        }

        return merge({}, routeData, this.filter.staticRouting);
    }

    public getEventPipeline(
        event: FlexibleEvent, 
        ignoreStaticRouting: boolean = false): FlexiblePipeline {

        var pipeline = this._pipeline;

        if (!this.parentNode && !this._pipeline) {
            throw "Parent Node without Pipeline";
        }

        if (this.parentNode) {
            pipeline = this.parentNode.getEventPipeline(event, ignoreStaticRouting);

            if (pipeline === null) {
                return null;
            }
        }

        var isMatch = ignoreStaticRouting || this.isRouteMatch(this.filter.staticRouting, event.routeData);

        if (this.filter) {
            isMatch = this.filter.filterEvent(event);
        }

        if (!isMatch) {
            return null;
        }

        return pipeline;
    }

    private isRouteMatch(ownRoute: RouteData, routeData: RouteData): boolean {

        return Object.keys(ownRoute).every(innerProperty => {
            var ownRouteValue = ownRoute[innerProperty];
            var routeValue = routeData[innerProperty];

            return typeof ownRouteValue === typeof routeValue && (
                this.routeDataHelper.isRouteData(ownRouteValue) && this.routeDataHelper.isRouteData(routeValue) &&
                this.isRouteMatch(ownRouteValue, routeValue) ||
                this.routeDataHelper.isRouteDataArray(ownRouteValue) && this.routeDataHelper.isRouteDataArray(routeValue) &&
                intersection<RouteValue>(ownRouteValue, routeValue).length === ownRouteValue.length ||
                ownRouteValue === routeValue
            );
        });
    }

    private validateMerge(rootData: RouteData, ownRouteData: RouteData): boolean {
        return Object.keys(ownRouteData).every(innerProperty => {
            return this.validateProperty(
                rootData[innerProperty],
                ownRouteData[innerProperty]);
        });
    }

    private validateProperty(rootDataProperty: RouteValue, ownDataProperty: RouteValue): boolean {
        return rootDataProperty === undefined ||
            (
                typeof rootDataProperty === typeof ownDataProperty &&
                (
                    this.routeDataHelper.isRouteData(rootDataProperty) && this.validateMerge(rootDataProperty, ownDataProperty as RouteData) ||
                    this.routeDataHelper.isRouteDataArray(rootDataProperty) ||
                    rootDataProperty === ownDataProperty
                )
            );
    }
}