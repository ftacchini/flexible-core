"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleAppBuilder = void 0;
var flexible_app_1 = require("./flexible-app");
var flexible_container_1 = require("../container/flexible-container");
var console_logger_module_1 = require("./logging/console-logger-module");
var flexible_tree_router_module_1 = require("./router/tree-router/flexible-tree-router-module");
var setup_manager_1 = require("./setup/setup-manager");
/**
 * Builder class for creating FlexibleApp instances with a fluent API.
 *
 * This is the main entry point for configuring and creating a Flexible application.
 * It follows the Builder pattern to provide a clean API for
 * assembling the various components of a Flexible application.
 *
 * @example
 * ```typescript
 * const app = FlexibleApp.builder()
 *   .addFramework(myFramework)
 *   .addEventSource(httpSource)
 *   .withLogger(customLogger)
 *   .createApp();
 *
 * await app.run();
 * ```
 *
 * The builder automatically provides sensible defaults:
 * - ConsoleLoggerModule for logging
 * - FlexibleTreeRouterModule for routing
 * - New FlexibleContainer (TSyringe-based) for dependency injection
 */
var FlexibleAppBuilder = /** @class */ (function () {
    function FlexibleAppBuilder() {
        this.frameworks = [];
        this.eventSources = [];
        this.modules = [];
        this.reset();
    }
    /**
     * Creates a FlexibleApp instance with the configured components.
     *
     * This method applies default values for any components not explicitly set,
     * creates the app, and then resets the builder for potential reuse.
     *
     * @returns A configured FlexibleApp instance ready to be initialized and run
     */
    FlexibleAppBuilder.prototype.createApp = function () {
        this.container || (this.container = new flexible_container_1.FlexibleContainer());
        this.logger || (this.logger = new console_logger_module_1.ConsoleLoggerModule());
        this.router || (this.router = new flexible_tree_router_module_1.FlexibleTreeRouterModule());
        this.extractorsRouter || (this.extractorsRouter = new flexible_tree_router_module_1.FlexibleTreeRouterModule());
        var app = new flexible_app_1.FlexibleApp(new setup_manager_1.SetupManager(this.frameworks, this.eventSources, this.logger, this.router, this.extractorsRouter, this.modules, this.container));
        this.reset();
        return app;
    };
    /**
     * Adds a module to the application.
     * Modules provide additional dependency injection bindings.
     *
     * @param fmodule - The module to add
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.addModule = function (fmodule) {
        this.modules.push(fmodule);
        return this;
    };
    /**
     * Adds a framework to the application.
     * Frameworks define how to interpret and route requests to handlers.
     *
     * @param framework - The framework module to add (e.g., decorators-based, use-cases-based)
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.addFramework = function (framework) {
        this.frameworks.push(framework);
        return this;
    };
    /**
     * Adds an event source to the application.
     * Event sources generate events that trigger the application's handlers.
     *
     * @param eventSource - The event source module to add (e.g., HTTP, message queue)
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.addEventSource = function (eventSource) {
        this.eventSources.push(eventSource);
        return this;
    };
    /**
     * Sets a custom router for pipeline routing.
     *
     * @param router - The router module to use for matching events to pipelines
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.withRouter = function (router) {
        this.router = router;
        return this;
    };
    /**
     * Sets a custom router for extractor routing.
     *
     * @param router - The router module to use for matching events to extractors
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.withExtractorsRouter = function (router) {
        this.extractorsRouter = router;
        return this;
    };
    /**
     * Sets a custom FlexibleContainer for dependency injection.
     *
     * @param container - The FlexibleContainer to use
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.withContainer = function (container) {
        this.container = container;
        return this;
    };
    /**
     * Sets a custom logger for the application.
     *
     * @param logger - The logger module to use
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.withLogger = function (logger) {
        this.logger = logger;
        return this;
    };
    /**
     * Resets the builder to its initial state.
     * Called automatically after createApp().
     *
     * @returns This builder instance for method chaining
     */
    FlexibleAppBuilder.prototype.reset = function () {
        this.frameworks = [];
        this.eventSources = [];
        this.modules = [];
        this.container = null;
        this.logger = null;
        this.router = null;
        this.extractorsRouter = null;
        return this;
    };
    return FlexibleAppBuilder;
}());
exports.FlexibleAppBuilder = FlexibleAppBuilder;
