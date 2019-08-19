import "reflect-metadata";
import "jasmine";
import { flexibleRouterTests } from "../flexible-router-tests";
import { FilterCascadeBuilder } from "../../../../../src/flexible/router/filter-cascade/filter-cascade-builder";
import { FlexibleTreeRouter } from "../../../../../src/flexible/router/tree-router";
import { RouteDataHelper } from "../../../../../src/flexible/router/route-data-helper";

function initialize() {
    var routeDataHelper = new RouteDataHelper();
    var filterCascadeBuilder = new FilterCascadeBuilder(routeDataHelper);

    return new FlexibleTreeRouter(
        filterCascadeBuilder,
        routeDataHelper
    );
}

describe("TreeRouter", flexibleRouterTests(initialize))