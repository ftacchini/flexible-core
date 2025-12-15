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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleTreeRouter = void 0;
var decision_tree_node_1 = require("./decision-tree-node");
var route_data_iterator_1 = require("./route-data-iterator");
var tsyringe_1 = require("tsyringe");
/**
 * A high-performance router implementation using a decision tree data structure.
 *
 * This router efficiently matches incoming events to resources (pipelines or extractors)
 * by building a decision tree based on route data properties. The tree structure allows
 * for O(log n) lookup time in most cases, making it suitable for applications with many routes.
 *
 * The router supports:
 * - Static routing (exact matches on route properties)
 * - Dynamic routing (custom filter functions)
 * - Complex filter combinations (AND/OR logic through filter cascades)
 * - Nested route data structures
 *
 * @example
 * ```typescript
 * const router = new FlexibleTreeRouter(filterCascadeBuilder, routeDataHelper);
 *
 * // Add a resource with filters
 * router.addResource([
 *   { staticRouting: { method: 'GET', path: '/users' } }
 * ], usersPipeline);
 *
 * // Match an event to resources
 * const event = { routeData: { method: 'GET', path: '/users' }, ... };
 * const pipelines = await router.getEventResources(event, {});
 * ```
 */
var FlexibleTreeRouter = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FlexibleTreeRouter = _classThis = /** @class */ (function () {
        function FlexibleTreeRouter_1(filterCascadeBuilder, routeDataHelper, logger) {
            this.filterCascadeBuilder = filterCascadeBuilder;
            this.routeDataHelper = routeDataHelper;
            this.logger = logger;
            this.routeCount = 0;
            this.baseNode = new decision_tree_node_1.DecisionTreeNode();
        }
        /**
         * Finds all resources that match the given event.
         *
         * The matching process:
         * 1. Converts event route data to a flat structure
         * 2. Traverses the decision tree to find matching filter cascades
         * 3. Evaluates each filter cascade (static + dynamic filters)
         * 4. Returns resources from matching cascades
         *
         * @param event - The event to match against registered resources
         * @param filterBinnacle - Object for storing filter state/context during matching
         * @returns Array of matching resources
         */
        FlexibleTreeRouter_1.prototype.getEventResources = function (event, filterBinnacle) {
            return __awaiter(this, void 0, void 0, function () {
                var plainRouteData, filters, results, matchedResources;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            plainRouteData = this.routeDataHelper.turnIntoPlainRouteData(event.routeData);
                            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Tree router: Finding matching routes", {
                                eventType: event.eventType,
                                routeDataKeys: Object.keys(plainRouteData),
                                totalRoutes: this.routeCount
                            });
                            filters = this.baseNode.getRouteLeaves(plainRouteData);
                            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Tree router: Found candidate filters", {
                                candidateCount: filters.length
                            });
                            return [4 /*yield*/, Promise.all(filters.map(function (filter) { return filter.getEventResources(event, filterBinnacle, true); }))];
                        case 1:
                            results = _d.sent();
                            matchedResources = results.filter(function (resource) { return resource !== null; });
                            (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Tree router: Matched resources", {
                                matchedCount: matchedResources.length
                            });
                            return [2 /*return*/, matchedResources];
                    }
                });
            });
        };
        /**
         * Registers a resource with its associated filters in the routing tree.
         *
         * The registration process:
         * 1. Builds filter cascades from the provided filters
         * 2. Validates that filter combinations are compatible
         * 3. Converts route data to a flat structure for tree insertion
         * 4. Inserts the filter cascade into the decision tree
         *
         * @param filters - Array of filter arrays. Each inner array represents filters that must all match (AND logic).
         *                  Multiple inner arrays represent alternatives (OR logic).
         * @param resource - The resource (pipeline or extractor) to associate with these filters
         */
        FlexibleTreeRouter_1.prototype.addResource = function (filters, resource) {
            var _this = this;
            var _a, _b, _c, _d;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Tree router: Adding resource", {
                filterCount: filters.length,
                resourceType: ((_b = resource.constructor) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown'
            });
            this.filterCascadeBuilder.reset()
                .withResource(resource);
            filters.forEach(function (filter) {
                _this.filterCascadeBuilder.addFlexibleFilters(filter);
            });
            var cascades = this.filterCascadeBuilder.build();
            (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Tree router: Built filter cascades", {
                cascadeCount: cascades.length
            });
            cascades.forEach(function (filterCascade) {
                var _a;
                var routeData = filterCascade.routeData;
                if (routeData !== null) {
                    var plainRouteData = _this.routeDataHelper.turnIntoPlainRouteData(routeData);
                    (_a = _this.logger) === null || _a === void 0 ? void 0 : _a.debug("Tree router: Inserting route into tree", {
                        routeProperties: Object.keys(plainRouteData),
                        routeData: plainRouteData
                    });
                    _this.baseNode.addRouteData(new route_data_iterator_1.RouteDataIterator(_this.routeDataHelper, plainRouteData), filterCascade);
                    _this.routeCount++;
                }
            });
            (_d = this.logger) === null || _d === void 0 ? void 0 : _d.debug("Tree router: Resource added", {
                totalRoutes: this.routeCount
            });
        };
        return FlexibleTreeRouter_1;
    }());
    __setFunctionName(_classThis, "FlexibleTreeRouter");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlexibleTreeRouter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlexibleTreeRouter = _classThis;
}();
exports.FlexibleTreeRouter = FlexibleTreeRouter;
