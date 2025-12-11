import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../../container/flexible-container";
import { FilterCascadeBuilder } from "../filter-cascade/filter-cascade-builder";
import { FlexibleTreeRouter } from "./flexible-tree-router";
import { FlexibleRouterModule } from "../../../router/flexible-router-module";
import { TREE_ROUTER_TYPES } from "./tree-router-types";
import { RouteDataHelper } from "../route-data-helper";
import { FlexibleRouter } from "../../../router";

export class FlexibleTreeRouterModule<Resource> implements FlexibleRouterModule<Resource> {

    public constructor() {
    }

    public register(container: DependencyContainer): void {
        if (!container.isRegistered(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)) {
            container.register(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER, { useClass: RouteDataHelper });
        }

        if (!container.isRegistered(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER)) {
            container.register(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER, { useClass: FilterCascadeBuilder });
        }

        if (!container.isRegistered(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER)) {
            container.register(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER, { useClass: FlexibleTreeRouter });
        }
    }

    public getInstance(container: FlexibleContainer): FlexibleRouter<Resource> {
        return container.resolve(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER);
    }
}