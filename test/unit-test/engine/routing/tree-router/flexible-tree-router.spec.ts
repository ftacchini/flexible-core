import "reflect-metadata";
import "jasmine";
import { flexibleRouterTests } from "../flexible-router-tests";
import { FilterCascadeBuilder } from "../../../../../src/engine/routing/filter-cascade/filter-cascade-builder";
import { FlexibleTreeRouter } from "../../../../../src/engine/routing/tree-router";
import { RouteDataHelper } from "../../../../../src/engine/routing/route-data-helper";

function initialize() {
    var routeDataHelper = new RouteDataHelper();
    var filterCascadeBuilder = new FilterCascadeBuilder(routeDataHelper);

    return new FlexibleTreeRouter(
        filterCascadeBuilder,
        routeDataHelper
    );
}

describe("TreeRouter", flexibleRouterTests(initialize))