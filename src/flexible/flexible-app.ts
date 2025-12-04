import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexiblePipeline } from "./pipeline/flexible-pipeline";
import { FlexibleRouter } from "../router/flexible-router";
import { FlexibleLogger } from "../logging/flexible-logger";
import { SetupManager } from "./setup/setup-manager";

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
 * const app = FlexibleAppBuilder.instance
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
export class FlexibleApp {

    private logger!: FlexibleLogger;
    private eventSources!: FlexibleEventSource[];
    private router!: FlexibleRouter<FlexiblePipeline>;
    private initialized!: boolean;

    public constructor(private setupManager: SetupManager) {
    }

    /**
     * Initializes the application by setting up all frameworks, event sources, and routing.
     *
     * This method is idempotent - calling it multiple times will only initialize once.
     * It's automatically called by run() if not already initialized.
     *
     * @returns The configured router for pipelines
     * @throws Error if initialization fails
     */
    public async setUp(): Promise<FlexibleRouter<FlexiblePipeline>> {

        if (!this.initialized) {

            try {
                var that = this;

                await this.setupManager.initialize({
                    get router() {
                        return that.router;
                    },
                    set router(router: FlexibleRouter<FlexiblePipeline>) {
                        that.router = router
                    },
                    get eventSources() {
                        return that.eventSources;
                    },
                    set eventSources(eventSources: FlexibleEventSource[]) {
                        that.eventSources = eventSources
                    },
                    get logger() {
                        return that.logger;
                    },
                    set logger(logger: FlexibleLogger) {
                        that.logger = logger;
                    }
                });
                this.initialized = true;
                this.logger.debug("APP SUCCESSFULLY INITIALIZED!\n")
            }
            catch (err) {
                this.logger && this.logger.emergency(JSON.stringify(err));
                this.initialized = false;
                throw err;
            }
        }

        return this.router;
    }

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
    public async run(): Promise<any[]> {
        var router = await this.setUp();
        this.logger.debug("STARTING EVENT SOURCES\n")
        var promises = this.eventSources.map(source => this.runEventSource(router, source))
        var results = await Promise.all(promises);
        this.logger.debug("APP RUNNING SUCCESSFULLY\n")

        return results;
    }

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
    private async runEventSource(router: FlexibleRouter<FlexiblePipeline>, eventSource: FlexibleEventSource): Promise<boolean> {
        eventSource.onEvent(async event => {
            //Events should be routable by event type.
            event.routeData.eventType = event.eventType;
            var filterBinnacle = {};
            var contextBinnacle = {};
            var pipelines = await router.getEventResources(event, filterBinnacle);
            var responses = await Promise.all(pipelines.map(pipeline => pipeline.processEvent(
                event,
                filterBinnacle,
                contextBinnacle)));
            return responses;
        })

        return eventSource.run();
    }

    /**
     * Gracefully stops the application by shutting down all event sources.
     *
     * @returns Array of results from stopping each event source
     */
    public async stop(): Promise<any[]> {
        this.logger.debug("STOPPING EVENT SOURCES\n")
        var promises = this.initialized ? this.eventSources.map(s => {
            return s.stop()
        }) : [Promise.resolve()]

        const results = Promise.all(promises);
        this.logger.debug("EVENT SOURCES STOPPED SUCCESSFULLY\n")

        return results;
    }
}