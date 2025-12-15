"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleTreeRouterModule = void 0;
var filter_cascade_builder_1 = require("../filter-cascade/filter-cascade-builder");
var flexible_tree_router_1 = require("./flexible-tree-router");
var tree_router_types_1 = require("./tree-router-types");
var route_data_helper_1 = require("../route-data-helper");
var FlexibleTreeRouterModule = /** @class */ (function () {
    function FlexibleTreeRouterModule() {
    }
    FlexibleTreeRouterModule.prototype.register = function (container) {
        if (!container.isRegistered(tree_router_types_1.TREE_ROUTER_TYPES.ROUTE_DATA_HELPER)) {
            container.register(tree_router_types_1.TREE_ROUTER_TYPES.ROUTE_DATA_HELPER, { useClass: route_data_helper_1.RouteDataHelper });
        }
        if (!container.isRegistered(tree_router_types_1.TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER)) {
            container.register(tree_router_types_1.TREE_ROUTER_TYPES.FILTER_CASCADE_BUILDER, { useClass: filter_cascade_builder_1.FilterCascadeBuilder });
        }
        if (!container.isRegistered(tree_router_types_1.TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER)) {
            container.register(tree_router_types_1.TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER, { useClass: flexible_tree_router_1.FlexibleTreeRouter });
        }
    };
    FlexibleTreeRouterModule.prototype.getInstance = function (container) {
        return container.resolve(tree_router_types_1.TREE_ROUTER_TYPES.FLEXIBLE_TREE_ROUTER);
    };
    return FlexibleTreeRouterModule;
}());
exports.FlexibleTreeRouterModule = FlexibleTreeRouterModule;
