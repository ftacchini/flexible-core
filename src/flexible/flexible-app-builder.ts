import { FlexibleApp } from "./flexible-app";
import { Container } from "inversify";
import { FlexibleFrameworkModule } from "../framework/flexible-framework-module";
import { FlexibleEventSourceModule } from "../event/flexible-event-source-module";
import { FlexibleLoggerModule } from "../logging/flexible-logger-module";
import { ConsoleLoggerModule } from "./logging/console-logger-module";
import { FlexibleRouterModule } from "../router/flexible-router-module";
import { FlexibleTreeRouterModule } from "./router/tree-router/flexible-tree-router-module";
import { FlexibleModule } from "../module/flexible-module";
import { FlexiblePipeline } from "./pipeline/flexible-pipeline";
import { FlexibleExtractor } from "../event";
import { SetupManager } from "./setup/setup-manager";

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
 * - New Inversify Container for dependency injection
 */
export class FlexibleAppBuilder {

    private frameworks: FlexibleFrameworkModule[] = [];
    private eventSources: FlexibleEventSourceModule[] = [];
    private modules: FlexibleModule[] = [];

    protected logger!: FlexibleLoggerModule;
    protected router!: FlexibleRouterModule<FlexiblePipeline>;
    protected extractorsRouter!: FlexibleRouterModule<FlexibleExtractor>;
    protected container!: Container;

    constructor() {
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
    createApp(): FlexibleApp {

        this.container || (this.container = new Container());
        this.logger || (this.logger = new ConsoleLoggerModule());
        this.router || (this.router = new FlexibleTreeRouterModule());
        this.extractorsRouter || (this.extractorsRouter = new FlexibleTreeRouterModule());

        var app =  new FlexibleApp(
            new SetupManager(
                this.frameworks,
                this.eventSources,
                this.logger,
                this.router,
                this.extractorsRouter,
                this.modules,
                this.container)
        );

        this.reset();
        return app;
    }

    /**
     * Adds a module to the application.
     * Modules provide additional dependency injection bindings.
     *
     * @param fmodule - The module to add
     * @returns This builder instance for method chaining
     */
    addModule(fmodule: FlexibleModule): this {
        this.modules.push(fmodule);
        return this;
    }

    /**
     * Adds a framework to the application.
     * Frameworks define how to interpret and route requests to handlers.
     *
     * @param framework - The framework module to add (e.g., decorators-based, use-cases-based)
     * @returns This builder instance for method chaining
     */
    addFramework(framework: FlexibleFrameworkModule): this {
        this.frameworks.push(framework);
        return this;
    }

    /**
     * Adds an event source to the application.
     * Event sources generate events that trigger the application's handlers.
     *
     * @param eventSource - The event source module to add (e.g., HTTP, message queue)
     * @returns This builder instance for method chaining
     */
    addEventSource(eventSource: FlexibleEventSourceModule): this {
        this.eventSources.push(eventSource);
        return this;
    }

    /**
     * Sets a custom router for pipeline routing.
     *
     * @param router - The router module to use for matching events to pipelines
     * @returns This builder instance for method chaining
     */
    withRouter(router: FlexibleRouterModule<FlexiblePipeline>): this {
        this.router = router;
        return this;
    }

    /**
     * Sets a custom router for extractor routing.
     *
     * @param router - The router module to use for matching events to extractors
     * @returns This builder instance for method chaining
     */
    withExtractorsRouter(router: FlexibleRouterModule<FlexibleExtractor>): this {
        this.extractorsRouter = router;
        return this;
    }

    /**
     * Sets a custom Inversify container for dependency injection.
     *
     * @param container - The Inversify container to use
     * @returns This builder instance for method chaining
     */
    withContainer(container: Container): this {
        this.container = container;
        return this;
    }

    /**
     * Sets a custom logger for the application.
     *
     * @param logger - The logger module to use
     * @returns This builder instance for method chaining
     */
    withLogger(logger: FlexibleLoggerModule): this {
        this.logger = logger;
        return this;
    }

    /**
     * Resets the builder to its initial state.
     * Called automatically after createApp().
     *
     * @returns This builder instance for method chaining
     */
    reset(): this {
        this.frameworks = [];
        this.eventSources = [];
        this.modules = [];
        this.container = null!;
        this.logger = null!;
        this.router = null!;
        this.extractorsRouter = null!;
        return this;
    }
}