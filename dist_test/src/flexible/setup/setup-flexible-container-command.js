"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupFlexibleContainerCommand = void 0;
var flexible_app_types_1 = require("../flexible-app-types");
var flexible_recipe_factory_1 = require("./flexible-recipe-factory");
var flexible_router_factory_1 = require("./flexible-router-factory");
var flexible_pipeline_factory_1 = require("./flexible-pipeline-factory");
var flexible_middleware_factory_1 = require("./flexible-middleware-factory");
var SetupFlexibleContainerCommand = /** @class */ (function () {
    function SetupFlexibleContainerCommand(routerModule, extractorsRouterModule, container) {
        this.routerModule = routerModule;
        this.extractorsRouterModule = extractorsRouterModule;
        this.container = container;
    }
    SetupFlexibleContainerCommand.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tsContainer, recipeFactory, extractorRouterFactory, middlewareFactory, pipelineFactory;
            return __generator(this, function (_a) {
                tsContainer = this.container.getContainer();
                // Register router module dependencies
                this.routerModule.register(tsContainer);
                // Register extractors router module dependencies
                this.extractorsRouterModule.register(tsContainer);
                // Register router factory as constant value
                this.container.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.ROUTER_FACTORY, new flexible_router_factory_1.FlexibleRouterFactory(this.container, this.routerModule));
                // Register extractor router factory as constant value
                this.container.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY, new flexible_router_factory_1.FlexibleRouterFactory(this.container, this.extractorsRouterModule));
                recipeFactory = new flexible_recipe_factory_1.FlexibleRecipeFactory(tsContainer);
                this.container.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.RECIPE_FACTORY, recipeFactory);
                extractorRouterFactory = this.container.resolve(flexible_app_types_1.FLEXIBLE_APP_TYPES.EXTRACTOR_ROUTER_FACTORY);
                middlewareFactory = new flexible_middleware_factory_1.FlexibleMiddlewareFactory(extractorRouterFactory, recipeFactory);
                this.container.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.MIDDLEWARE_FACTORY, middlewareFactory);
                pipelineFactory = new flexible_pipeline_factory_1.FlexiblePipelineFactory();
                this.container.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.PIPELINE_FACTORY, pipelineFactory);
                return [2 /*return*/];
            });
        });
    };
    return SetupFlexibleContainerCommand;
}());
exports.SetupFlexibleContainerCommand = SetupFlexibleContainerCommand;
