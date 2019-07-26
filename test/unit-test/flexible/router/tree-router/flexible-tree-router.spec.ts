import "reflect-metadata";
import "jasmine";
import { flexibleRouterTests } from "../flexible-router-tests";
import { FilterCascadeBuilder } from "../../../../../src/flexible/router/filter-cascade/filter-cascade-builder";
import { RouteDataHelper } from "../../../../../src/router";
import { FlexibleTreeRouter } from "../../../../../src/flexible/router/tree-router";

function initialize() {
    var routeDataHelper = new RouteDataHelper();
    var filterCascadeBuilder = new FilterCascadeBuilder(routeDataHelper);

    return new FlexibleTreeRouter(
        filterCascadeBuilder,
        routeDataHelper
    );
}

describe("TreeRouter", flexibleRouterTests(initialize))