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
exports.DelegateEventSource = void 0;
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
var DelegateEventSource = /** @class */ (function () {
    /**
     * Creates a new DelegateEventSource.
     *
     * This event source is typically used as the event source for downstream apps
     * in a composable architecture. The upstream app's controllers will call
     * `generateEvent()` to forward events to this app.
     */
    function DelegateEventSource() {
        this.availableExtractors = [];
        this.availableFilters = [];
        this.running = false;
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
    DelegateEventSource.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.running = true;
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Stops the event source.
     *
     * @returns Promise resolving to true when stopped
     */
    DelegateEventSource.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.running = false;
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Registers the event handler that will process events.
     *
     * This is called by the FlexibleApp during initialization to connect
     * the event source to the routing pipeline.
     *
     * @param handler - Function that processes events and returns responses
     */
    DelegateEventSource.prototype.onEvent = function (handler) {
        this.eventHandler = handler;
    };
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
    DelegateEventSource.prototype.generateEvent = function (event) {
        if (!this.running) {
            throw new Error("DelegateEventSource is not running. Call run() before generating events.");
        }
        if (!this.eventHandler) {
            throw new Error("No event handler registered. The app may not be properly initialized.");
        }
        return this.eventHandler(event);
    };
    return DelegateEventSource;
}());
exports.DelegateEventSource = DelegateEventSource;
