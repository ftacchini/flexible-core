"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterCascadeBuilder = void 0;
var filter_cascade_node_1 = require("./filter-cascade-node");
var tsyringe_1 = require("tsyringe");
var isArray = Array.isArray;
/**
 * Builder for creating filter cascade chains.
 *
 * A filter cascade is a chain of filters that must all match for a resource to be selected.
 * This builder supports creating multiple cascades from combinations of filters (AND/OR logic).
 *
 * @example
 * ```typescript
 * builder
 *   .withResource(myPipeline)
 *   .addFlexibleFilters([filterA, filterB])  // Both must match (AND)
 *   .addFlexibleFilters(filterC)             // Creates alternative path (OR)
 *   .build();
 * ```
 */
var FilterCascadeBuilder = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FilterCascadeBuilder = _classThis = /** @class */ (function () {
        function FilterCascadeBuilder_1(routeDataHelper) {
            this.routeDataHelper = routeDataHelper;
            this.reset();
        }
        /**
         * Sets the resource (pipeline or extractor) for the filter cascade.
         *
         * @param resource - The resource to associate with the filters
         * @returns This builder for chaining
         */
        FilterCascadeBuilder_1.prototype.withResource = function (resource) {
            this.resource = resource;
            return this;
        };
        /**
         * Adds filters to the cascade, creating combinations for AND/OR logic.
         *
         * - Single filter: Creates one cascade path
         * - Array of filters: All must match (AND logic)
         * - Multiple calls: Creates alternative paths (OR logic)
         *
         * @param flexibleFilters - Single filter or array of filters to add
         * @returns This builder for chaining
         */
        FilterCascadeBuilder_1.prototype.addFlexibleFilters = function (flexibleFilters) {
            var _this = this;
            var filterNodes = [];
            var filters = isArray(flexibleFilters) ? flexibleFilters : [flexibleFilters];
            filters.forEach(function (flexibleFilter) {
                if (_this.filterNodes.length) {
                    _this.filterNodes.forEach(function (filterNode) {
                        filterNodes.push(new filter_cascade_node_1.FilterCascadeNode(_this.routeDataHelper, flexibleFilter, filterNode));
                    });
                }
                else {
                    filterNodes.push(new filter_cascade_node_1.FilterCascadeNode(_this.routeDataHelper, flexibleFilter));
                }
            });
            this.filterNodes = filterNodes;
            return this;
        };
        /**
         * Builds and returns all valid filter cascade chains.
         *
         * Validates that:
         * - A resource has been set
         * - All filter cascades have valid route data
         *
         * After building, the builder is automatically reset for reuse.
         *
         * @returns Array of valid filter cascade nodes
         * @throws Error if resource is not set
         */
        FilterCascadeBuilder_1.prototype.build = function () {
            var _this = this;
            if (!this.resource) {
                throw new Error("Resource must be set before building filter cascade");
            }
            this.filterNodes.forEach(function (filterNode) {
                filterNode.resource = _this.resource;
            });
            var nodes = this.filterNodes;
            this.reset();
            return nodes.filter(function (filterStack) { return filterStack.isValid; });
        };
        /**
         * Resets the builder to initial state for reuse.
         *
         * @returns This builder for chaining
         */
        FilterCascadeBuilder_1.prototype.reset = function () {
            this.filterNodes = [];
            this.resource = null;
            return this;
        };
        return FilterCascadeBuilder_1;
    }());
    __setFunctionName(_classThis, "FilterCascadeBuilder");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FilterCascadeBuilder = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FilterCascadeBuilder = _classThis;
}();
exports.FilterCascadeBuilder = FilterCascadeBuilder;
