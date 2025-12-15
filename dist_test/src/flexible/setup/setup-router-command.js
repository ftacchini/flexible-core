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
exports.SetupRouterCommand = void 0;
var util_1 = require("util");
var lodash_1 = require("lodash");
var tsyringe_1 = require("tsyringe");
var PIPELINE_SETUP_ERROR = "One of your pipelines could not be setup, there might be a problem with one of your filters/extractors/middleware";
var SetupRouterCommand = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SetupRouterCommand = _classThis = /** @class */ (function () {
        function SetupRouterCommand_1(logger, routerFactory, middlewareFactory, recipeFactory, pipelineFactory, frameworksProvider) {
            this.logger = logger;
            this.routerFactory = routerFactory;
            this.middlewareFactory = middlewareFactory;
            this.recipeFactory = recipeFactory;
            this.pipelineFactory = pipelineFactory;
            this.frameworksProvider = frameworksProvider;
        }
        SetupRouterCommand_1.prototype.execute = function (flexibleAppState) {
            return __awaiter(this, void 0, void 0, function () {
                var frameworks, pipelineDefinitions, _a, pipelines;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.debug("Setting up router...");
                            flexibleAppState.router = this.routerFactory.createRouter();
                            frameworks = this.frameworksProvider();
                            this.logger.debug("Collecting pipeline definitions from ".concat(frameworks.length || 0, " frameworks..."));
                            _a = lodash_1.flatten;
                            return [4 /*yield*/, Promise.all(frameworks.map(function (framework) { return framework.createPipelineDefinitions(); }))];
                        case 1:
                            pipelineDefinitions = _a.apply(void 0, [_b.sent()]);
                            this.logger.debug("Generating pipelines from ".concat(pipelineDefinitions.length || 0, " pipeline definitions..."));
                            pipelines = pipelineDefinitions.map(function (definition) {
                                try {
                                    var filters = definition.filterStack.map(function (filterRecipes, index, array) {
                                        if (!(0, util_1.isArray)(filterRecipes)) {
                                            filterRecipes = [filterRecipes];
                                        }
                                        var filters = filterRecipes
                                            .map(function (filterRecipe) { return _this.recipeFactory.craftRecipe(filterRecipe); });
                                        filters.forEach(function (filter) { return filter.isLastFilter = (array.length - 1 == index); });
                                        return filters;
                                    });
                                    var middlewareStack = _this.middlewareFactory.createMiddlewareStack(definition.middlewareStack);
                                    var pipeline = _this.pipelineFactory.createPipeline(middlewareStack);
                                    flexibleAppState.router.addResource(filters, pipeline);
                                    return pipeline;
                                }
                                catch (ex) {
                                    _this.logger.alert("".concat(PIPELINE_SETUP_ERROR, ", exception is: ").concat(JSON.stringify(ex)));
                                }
                            }).filter(function (x) { return x; });
                            this.logger.debug("".concat(pipelines.length || 0, " pipelines successfully generated and added to router\n"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return SetupRouterCommand_1;
    }());
    __setFunctionName(_classThis, "SetupRouterCommand");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SetupRouterCommand = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SetupRouterCommand = _classThis;
}();
exports.SetupRouterCommand = SetupRouterCommand;
