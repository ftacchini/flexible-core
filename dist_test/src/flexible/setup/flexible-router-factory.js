"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleRouterFactory = void 0;
var FlexibleRouterFactory = /** @class */ (function () {
    function FlexibleRouterFactory(container, routerProvider) {
        this.container = container;
        this.routerProvider = routerProvider;
    }
    FlexibleRouterFactory.prototype.createRouter = function () {
        return this.routerProvider.getInstance(this.container);
    };
    return FlexibleRouterFactory;
}());
exports.FlexibleRouterFactory = FlexibleRouterFactory;
