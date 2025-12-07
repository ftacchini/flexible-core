import { FlexibleEventSource } from "./flexible-event-source";
import { FlexibleExtractor } from "./flexible-extractor";
import { FlexibleFilter } from "./flexible-filter";
import { FlexibleEvent } from "./flexible-event";
import { FlexibleResponse } from "../flexible/flexible-response";
import { Type } from "../flexible/type";
import { ContainerModule } from "inversify";

/**
 * A production-ready event source for composable controller architectures.
 *
 * DelegateEventSource enables the **composable controller pattern** where security layers,
 * middleware layers, and business logic are implemented as separate FlexibleApp instances
 * that forward events to each other.
 *
 * ## Composable Architecture Pattern
 *
 * Instead of adding middleware to a single app, you can create multiple apps that
 * forward events to each other:
 *
 * ```
 * HTTP Request → Security App → HTTP Security App → Business App
 *                 (rate limit)    (headers, CORS)     (your code)
 * ```
 *
 * Each layer is a FlexibleApp with controllers that forward to the next layer via DelegateEventSource.
 *
 * ## Example Usage
 *
 * ```typescript
 * // Business logic app
 * const businessApp = FlexibleApp.builder()
 *     .addFramework(decoratorsFramework)
 *     .addEventSource(new DelegateEventSource())
 *     .createApp();
 *
 * await businessApp.run();
 *
 * // Security layer that forwards to business app
 * @Controller()
 * export class SecurityMiddlewareController {
 *     constructor(
 *         @inject(DELEGATE_EVENT_SOURCE) private nextLayer: DelegateEventSource
 *     ) {}
 *
 *     @BeforeExecution(RateLimitMiddleware)
 *     @Route(Everything)  // Match ALL events
 *     public async processAll(@Param(EventData) event: FlexibleEvent) {
 *         return await this.nextLayer.generateEvent(event);
 *     }
 * }
 *
 * const securityApp = FlexibleApp.builder()
 *     .addFramework(new DecoratorsFramework([SecurityMiddlewareController]))
 *     .addEventSource(new HttpModule(3000))  // Real HTTP source
 *     .createApp();
 *
 * await securityApp.run();
 * ```
 *
 * ## Benefits
 *
 * - **Composable**: Stack security layers as needed
 * - **Reusable**: Security layers can be npm packages
 * - **Testable**: Each layer tested independently
 * - **Flexible**: Different routes can go to different layers
 * - **No framework changes**: Uses existing patterns
 *
 * @see DummyEventSource for testing purposes
 */
export class DelegateEventSource implements FlexibleEventSource {
    readonly container!: ContainerModule;
    readonly availableExtractors: Type<FlexibleExtractor>[] = [];
    readonly availableFilters: Type<FlexibleFilter>[] = [];

    private eventHandler!: (event: FlexibleEvent) => Promise<FlexibleResponse[]>;
    private running: boolean = false;

    /**
     * Creates a new DelegateEventSource.
     *
     * This event source is typically used as the event source for downstream apps
     * in a composable architecture. The upstream app's controllers will call
     * `generateEvent()` to forward events to this app.
     */
    public constructor() {
        // No configuration needed - this is a simple forwarding mechanism
    }

    /**
     * Starts the event source.
     *
     * For DelegateEventSource, this simply marks it as running and ready to
     * receive events via `generateEvent()`.
     *
     * @returns Promise resolving to true when started
     */
    public async run(): Promise<boolean> {
        this.running = true;
        return true;
    }

    /**
     * Stops the event source.
     *
     * @returns Promise resolving to true when stopped
     */
    public async stop(): Promise<boolean> {
        this.running = false;
        return true;
    }

    /**
     * Registers the event handler that will process events.
     *
     * This is called by the FlexibleApp during initialization to connect
     * the event source to the routing pipeline.
     *
     * @param handler - Function that processes events and returns responses
     */
    public onEvent(handler: (event: FlexibleEvent) => Promise<FlexibleResponse[]>): void {
        this.eventHandler = handler;
    }

    /**
     * Programmatically generates an event and processes it through the app.
     *
     * This is the key method for composable architectures. Upstream controllers
     * call this method to forward events to the downstream app.
     *
     * @param event - The event to process
     * @returns Promise resolving to the responses from the app
     * @throws Error if the event source is not running
     *
     * @example
     * ```typescript
     * // In a middleware controller
     * @Controller()
     * export class SecurityController {
     *     constructor(
     *         @inject(DELEGATE_EVENT_SOURCE) private nextLayer: DelegateEventSource
     *     ) {}
     *
     *     @Route(Everything)
     *     public async processAll(@Param(EventData) event: FlexibleEvent) {
     *         // Do security checks...
     *
     *         // Forward to next layer
     *         return await this.nextLayer.generateEvent(event);
     *     }
     * }
     * ```
     */
    public generateEvent(event: FlexibleEvent): Promise<FlexibleResponse[]> {
        if (!this.running) {
            throw new Error("DelegateEventSource is not running. Call run() before generating events.");
        }

        if (!this.eventHandler) {
            throw new Error("No event handler registered. The app may not be properly initialized.");
        }

        return this.eventHandler(event);
    }
}
