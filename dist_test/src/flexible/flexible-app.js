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
exports.FlexibleApp = void 0;
var request_id_generator_1 = require("./utils/request-id-generator");
var flexible_app_builder_1 = require("./flexible-app-builder");
/**
 * The main application class that orchestrates event sources, routing, and request handling.
 *
 * FlexibleApp is the core runtime that:
 * 1. Initializes all configured frameworks, event sources, and modules
 * 2. Sets up routing between events and handlers
 * 3. Manages the lifecycle of event sources (start/stop)
 * 4. Coordinates the processing of events through middleware pipelines
 *
 * @example
 * ```typescript
 * const app = FlexibleApp.builder()
 *   .addFramework(decoratorsFramework)
 *   .addEventSource(httpSource)
 *   .createApp();
 *
 * // Initialize and start the app
 * await app.run();
 *
 * // Later, gracefully shut down
 * await app.stop();
 * ```
 *
 * The app follows this lifecycle:
 * 1. setUp() - Initializes all components and builds the routing table
 * 2. run() - Starts all event sources and begins processing events
 * 3. stop() - Gracefully shuts down all event sources
 */
var FlexibleApp = /** @class */ (function () {
    function FlexibleApp(setupManager) {
        this.setupManager = setupManager;
        this.requestIdGenerator = new request_id_generator_1.RequestIdGenerator();
    }
    /**
     * Creates a new builder for constructing FlexibleApp instances.
     * @returns A new FlexibleAppBuilder instance
     */
    FlexibleApp.builder = function () {
        return new flexible_app_builder_1.FlexibleAppBuilder();
    };
    /**
     * Initializes the application by setting up all frameworks, event sources, and routing.
     *
     * This method is idempotent - calling it multiple times will only initialize once.
     * It's automatically called by run() if not already initialized.
     *
     * @returns The configured router for pipelines
     * @throws Error if initialization fails
     */
    FlexibleApp.prototype.setUp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var that, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.initialized) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        that = this;
                        return [4 /*yield*/, this.setupManager.initialize({
                                get router() {
                                    return that.router;
                                },
                                set router(router) {
                                    that.router = router;
                                },
                                get eventSources() {
                                    return that.eventSources;
                                },
                                set eventSources(eventSources) {
                                    that.eventSources = eventSources;
                                },
                                get logger() {
                                    return that.logger;
                                },
                                set logger(logger) {
                                    that.logger = logger;
                                }
                            })];
                    case 2:
                        _a.sent();
                        this.initialized = true;
                        this.logger.debug("APP SUCCESSFULLY INITIALIZED!\n");
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        this.logger && this.logger.emergency(JSON.stringify(err_1));
                        this.initialized = false;
                        throw err_1;
                    case 4: return [2 /*return*/, this.router];
                }
            });
        });
    };
    /**
     * Starts the application by initializing (if needed) and running all event sources.
     *
     * This method:
     * 1. Calls setUp() to ensure initialization
     * 2. Starts all configured event sources
     * 3. Begins processing events through the routing and middleware pipeline
     *
     * @returns Array of results from starting each event source
     * @throws Error if initialization or startup fails
     */
    FlexibleApp.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var router, promises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setUp()];
                    case 1:
                        router = _a.sent();
                        this.logger.debug("STARTING EVENT SOURCES\n");
                        promises = this.eventSources.map(function (source) { return _this.runEventSource(router, source); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        results = _a.sent();
                        this.logger.debug("APP RUNNING SUCCESSFULLY\n");
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Connects an event source to the routing system.
     *
     * When an event is received:
     * 1. The event type is added to route data
     * 2. The router finds matching pipelines
     * 3. Each pipeline processes the event through its middleware stack
     *
     * @param router - The router to use for finding matching pipelines
     * @param eventSource - The event source to connect
     * @returns Result of starting the event source
     */
    FlexibleApp.prototype.runEventSource = function (router, eventSource) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                eventSource.onEvent(function (event) { return __awaiter(_this, void 0, void 0, function () {
                    var requestId, filterBinnacle, contextBinnacle, pipelines, responses;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                requestId = event.requestId || this.requestIdGenerator.generate();
                                this.logger.debug("Request received", { requestId: requestId, eventType: event.eventType });
                                //Events should be routable by event type.
                                event.routeData.eventType = event.eventType;
                                filterBinnacle = {};
                                contextBinnacle = {};
                                this.logger.debug("Routing request - Finding matching pipelines", { requestId: requestId });
                                return [4 /*yield*/, router.getEventResources(event, filterBinnacle)];
                            case 1:
                                pipelines = _a.sent();
                                this.logger.debug("Found matching pipelines", { requestId: requestId, pipelineCount: pipelines.length });
                                return [4 /*yield*/, Promise.all(pipelines.map(function (pipeline, index) {
                                        _this.logger.debug("Processing pipeline", { requestId: requestId, pipelineIndex: index + 1, totalPipelines: pipelines.length });
                                        return pipeline.processEvent(event, filterBinnacle, contextBinnacle);
                                    }))];
                            case 2:
                                responses = _a.sent();
                                this.logger.debug("Request completed", { requestId: requestId, responseCount: responses.length });
                                return [2 /*return*/, responses];
                        }
                    });
                }); });
                return [2 /*return*/, eventSource.run()];
            });
        });
    };
    /**
     * Gracefully stops the application by shutting down all event sources.
     *
     * @returns Array of results from stopping each event source
     */
    FlexibleApp.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promises, results;
            return __generator(this, function (_a) {
                this.logger.debug("STOPPING EVENT SOURCES\n");
                promises = this.initialized ? this.eventSources.map(function (s) {
                    return s.stop();
                }) : [Promise.resolve()];
                results = Promise.all(promises);
                this.logger.debug("EVENT SOURCES STOPPED SUCCESSFULLY\n");
                return [2 /*return*/, results];
            });
        });
    };
    return FlexibleApp;
}());
exports.FlexibleApp = FlexibleApp;
