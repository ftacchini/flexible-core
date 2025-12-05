import { ContainerModule, Container } from "inversify";
import { FilterCascadeBuilder } from "../filter-cascade/filter-cascade-builder";
import { FlexibleTreeRouter } from "./flexible-tree-router";
import { FlexibleRouterModule } from "../../../router/flexible-router-module";
import { TREE_ROUTER_TYPES } from "./tree-router-types";
import { RouteDataHelper } from "../route-data-helper";
import { FlexibleRouter } from "../../../router";

export class FlexibleTreeRouterModule<Resource> implements FlexibleRouterModule<Resource> {

    private _container: ContainerModule;

    public constructor() {
        this._container = new ContainerModule(({ bind, unbind, isBound, rebind }) => {
            isBound(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER) ||
            bind(TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)
                .to(RouteDataHelper)
                .inSingletonScope();

            isBound(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER) ||
                bind(TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER)
                    .to(FilterCascadeBuilder)
                    .inSingletonScope();

            isBound(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER) ||
                bind(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER)
                    .to(FlexibleTreeRouter);
        });
    }

    public get container(): ContainerModule {
        return this._container;
    }

    public getInstance(container: Container): FlexibleRouter<Resource> {
        return container.get(TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER)
    }
}