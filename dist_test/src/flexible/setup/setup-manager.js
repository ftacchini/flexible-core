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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupManager = void 0;
var setup_container_command_1 = require("./setup-container-command");
var setup_router_command_1 = require("./setup-router-command");
var setup_flexible_container_command_1 = require("./setup-flexible-container-command");
var setup_event_sources_command_1 = require("./setup-event-sources-command");
var setup_logger_command_1 = require("./setup-logger-command");
var setup_infrastructure_command_1 = require("./setup-infrastructure-command");
var flexible_app_types_1 = require("../flexible-app-types");
var NO_FRAMEWORK_DEFINED = "Cannot build a flexible app without any framework";
var NO_SERVER_DEFINED = "Cannot build a flexible app without any server";
var NO_CONTAINER_DEFINED = "Cannot build a flexible app without a container";
var NO_LOGGER_DEFINED = "Cannot build a flexible app without a logger";
var NO_ROUTER_DEFINED = "Cannot build a flexible app without a router";
var NO_EXTRACTORS_ROUTER_DEFINED = "Cannot build a flexible app without an extrators router";
var SetupManager = /** @class */ (function () {
    function SetupManager(frameworkModules, eventSourceModules, loggerModule, routerModule, extractorsRouterModule, modules, container) {
        this.frameworkModules = frameworkModules;
        this.eventSourceModules = eventSourceModules;
        this.loggerModule = loggerModule;
        this.routerModule = routerModule;
        this.extractorsRouterModule = extractorsRouterModule;
        this.modules = modules;
        this.container = container;
        if (!loggerModule) {
            throw NO_LOGGER_DEFINED;
        }
        if (!routerModule) {
            throw NO_ROUTER_DEFINED;
        }
        if (!extractorsRouterModule) {
            throw NO_EXTRACTORS_ROUTER_DEFINED;
        }
        if (!frameworkModules || !frameworkModules.length) {
            throw NO_FRAMEWORK_DEFINED;
        }
        if (!eventSourceModules || !eventSourceModules.length) {
            throw NO_SERVER_DEFINED;
        }
        if (!container) {
            throw NO_CONTAINER_DEFINED;
        }
    }
    SetupManager.prototype.initialize = function (app) {
        return __awaiter(this, void 0, void 0, function () {
            var setupContainer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setupContainers()];
                    case 1:
                        setupContainer = _a.sent();
                        return [4 /*yield*/, this.setupApp(setupContainer, app)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SetupManager.prototype.setupContainers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var setupContainerCommand, setupInfrastructureCommand, setupContainer, setupFlexibleContainerCommand;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setupContainerCommand = new setup_container_command_1.SetupContainerCommand(this.loggerModule, __spreadArray(__spreadArray(__spreadArray([], this.modules, true), this.eventSourceModules, true), this.frameworkModules, true), this.container);
                        return [4 /*yield*/, setupContainerCommand.execute()];
                    case 1:
                        _a.sent();
                        setupInfrastructureCommand = new setup_infrastructure_command_1.SetupInfrastructureCommand(this.eventSourceModules, this.frameworkModules, this.container);
                        return [4 /*yield*/, setupInfrastructureCommand.execute()];
                    case 2:
                        _a.sent();
                        setupContainer = this.container.createChild();
                        setupFlexibleContainerCommand = new setup_flexible_container_command_1.SetupFlexibleContainerCommand(this.routerModule, this.extractorsRouterModule, setupContainer);
                        return [4 /*yield*/, setupFlexibleContainerCommand.execute()];
                    case 3:
                        _a.sent();
                        // Bind dependencies from main container using factory functions
                        setupContainer.registerFactory(flexible_app_types_1.FLEXIBLE_APP_TYPES.LOGGER, function () {
                            return _this.container.resolve(flexible_app_types_1.FLEXIBLE_APP_TYPES.LOGGER);
                        });
                        setupContainer.registerFactory(flexible_app_types_1.FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER, function () {
                            return _this.container.resolve(flexible_app_types_1.FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
                        });
                        setupContainer.registerFactory(flexible_app_types_1.FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER, function () {
                            return _this.container.resolve(flexible_app_types_1.FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
                        });
                        // Bind the main container so that recipe factory can access module bindings
                        setupContainer.registerValue(flexible_app_types_1.FLEXIBLE_APP_TYPES.CONTAINER, this.container);
                        return [2 /*return*/, setupContainer];
                }
            });
        });
    };
    SetupManager.prototype.setupApp = function (container, app) {
        return __awaiter(this, void 0, void 0, function () {
            var setupCommands;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        container.registerClass(setup_logger_command_1.SetupLoggerCommand, setup_logger_command_1.SetupLoggerCommand);
                        container.registerClass(setup_router_command_1.SetupRouterCommand, setup_router_command_1.SetupRouterCommand);
                        container.registerClass(setup_event_sources_command_1.SetupEventSourcesCommand, setup_event_sources_command_1.SetupEventSourcesCommand);
                        return [4 /*yield*/, container.resolve(setup_logger_command_1.SetupLoggerCommand).execute(app)];
                    case 1:
                        _a.sent();
                        setupCommands = [
                            container.resolve(setup_event_sources_command_1.SetupEventSourcesCommand),
                            container.resolve(setup_router_command_1.SetupRouterCommand)
                        ];
                        return [4 /*yield*/, Promise.all(setupCommands.map(function (command) { return command.execute(app); }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SetupManager;
}());
exports.SetupManager = SetupManager;
