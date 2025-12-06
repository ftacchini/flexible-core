# Creating an Event Source

This guide shows you how to create a custom event source for Flexible. We'll use concepts from the HTTP source as examples.

## Table of Contents

- [What is an Event Source?](#what-is-an-event-source)
- [Event Source Interface](#event-source-interface)
- [Step-by-Step Guide](#step-by-step-guide)
- [Real Example: HTTP Event Source](#real-example-http-event-source)
- [Testing Your Event Source](#testing-your-event-source)
- [Best Practices](#best-practices)

## What is an Event Source?

An event source is the **entry point** for external input into your Flexible application. It:

- Receives external input (HTTP requests, messages, files, etc.)
- Converts input into `FlexibleEvent` objects
- Calls the router to process events
- Handles responses back to the external system

**Examples:**
- **HTTP Source**: Listens for HTTP requests
- **WebSocket Source**: Handles WebSocket connections
- **Queue Source**: Consumes messages from a queue (RabbitMQ, SQS, etc.)
- **File Source**: Watches for file changes
- **Timer Source**: Triggers events on a schedule

## Event Source Interface

Every event source must implement `FlexibleEventSource`:

```typescript
export interface FlexibleEventSource {
    // Start the event source
    run(): Promise<any>;

    // Stop the event source
    stop(): Promise<any>;

    // Register event handler (called by Flexible)
    onEvent(handler: (event: FlexibleEvent) => Promise<any>): void;

    // Optional: Health check
    healthCheck?(): Promise<HealthStatus>;
}
```

### FlexibleEvent

Events must conform to this structure:

```typescript
interface FlexibleEvent {
    // Type of event (for routing)
    eventType: string;

    // Route data (used by router to match pipelines)
    routeData: RouteData<string>;

    // Optional: Unique request ID
    requestId?: string;

    // Your custom data
    [key: string]: any;
}
```

## Step-by-Step Guide

### Step 1: Define Your Event Type

Decide what external input you'll handle and how to represent it:

```typescript
// HTTP Event
interface HttpEvent extends FlexibleEvent {
    eventType: 'HttpEvent';
    routeData: {
        method: string;
        path: string;
    };
    request: IncomingMessage;
    response: ServerResponse;
}

// Queue Event
interface QueueEvent extends FlexibleEvent {
    eventType: 'QueueEvent';
    routeData: {
        queue: string;
        messageType: string;
    };
    message: any;
    ack: () => void;
    nack: () => void;
}

// Timer Event
interface TimerEvent extends FlexibleEvent {
    eventType: 'TimerEvent';
    routeData: {
        schedule: string;
    };
    timestamp: Date;
}
```

### Step 2: Implement the Interface

Create your event source class:

```typescript
export class MyEventSource implements FlexibleEventSource {
    private handler?: (event: FlexibleEvent) => Promise<any>;
    private isRunning: boolean = false;

    // Store the handler provided by Flexible
    onEvent(handler: (event: FlexibleEvent) => Promise<any>): void {
        this.handler = handler;
    }

    // Start receiving events
    async run(): Promise<any> {
        this.isRunning = true;
        // Start your event source (server, listener, etc.)
        return { running: true };
    }

    // Stop receiving events
    async stop(): Promise<any> {
        this.isRunning = false;
        // Clean up resources
        return { running: false };
    }
}
```

### Step 3: Receive External Input

Set up your external input mechanism:

```typescript
export class HttpEventSource implements FlexibleEventSource {
    private server?: http.Server;
    private handler?: (event: FlexibleEvent) => Promise<any>;

    constructor(private port: number) {}

    async run(): Promise<any> {
        // Create HTTP server
        this.server = http.createServer(async (req, res) => {
            // Convert HTTP request to FlexibleEvent
            const event = this.createEvent(req, res);

            // Call handler
            if (this.handler) {
                await this.handler(event);
            }
        });

        // Start listening
        return new Promise((resolve) => {
            this.server!.listen(this.port, () => {
                resolve({ running: true, port: this.port });
            });
        });
    }

    async stop(): Promise<any> {
        return new Promise((resolve) => {
            this.server?.close(() => {
                resolve({ running: false });
            });
        });
    }

    onEvent(handler: (event: FlexibleEvent) => Promise<any>): void {
        this.handler = handler;
    }
}
```

### Step 4: Convert to FlexibleEvent

Transform external input into events:

```typescript
private createEvent(req: IncomingMessage, res: ServerResponse): FlexibleEvent {
    return {
        eventType: 'HttpEvent',
        routeData: {
            method: req.method || 'GET',
            path: req.url || '/'
        },
        requestId: this.generateRequestId(),
        request: req,
        response: res
    };
}

private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}
```

### Step 5: Handle Responses

Process responses from pipelines:

```typescript
private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const event = this.createEvent(req, res);

    try {
        // Call handler and get responses
        const responses = await this.handler!(event);

        // Process responses
        if (responses && responses.length > 0) {
            const response = responses[0];
            res.statusCode = response.statusCode || 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(response.body));
        } else {
            res.statusCode = 404;
            res.end('Not Found');
        }
    } catch (error) {
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
}
```

## Real Example: HTTP Event Source

Let's look at a simplified version of the HTTP source:

### 1. Event Class

```typescript
export class HttpEvent implements FlexibleEvent {
    public eventType: string = 'HttpEvent';
    public routeData: RouteData<string>;
    public requestId: string;

    constructor(
        public request: IncomingMessage,
        public response: ServerResponse,
        requestId?: string
    ) {
        this.requestId = requestId || this.generateRequestId();
        this.routeData = {
            method: request.method || 'GET',
            path: this.parsePath(request.url || '/')
        };
    }

    private parsePath(url: string): string {
        return url.split('?')[0];
    }

    private generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
}
```

### 2. Event Source Implementation

```typescript
export class HttpSource implements FlexibleEventSource {
    private application: express.Application;
    private server?: http.Server;
    private handler?: (event: FlexibleEvent) => Promise<any>;

    constructor(
        private port: number,
        private logger: FlexibleLogger
    ) {
        this.application = express();
        this.setupMiddleware();
    }

    private setupMiddleware(): void {
        // Parse JSON bodies
        this.application.use(express.json());

        // Handle all routes
        this.application.all("*", async (req, res, next) => {
            try {
                // Get or generate request ID
                const requestId = req.headers['x-request-id'] as string ||
                                 this.generateRequestId();

                // Log request
                this.logger.debug("HTTP request received", {
                    requestId,
                    method: req.method,
                    path: req.path,
                    clientIp: req.ip || 'unknown'
                });

                // Create event
                const httpEvent = new HttpEvent(req, res, requestId);

                // Process event
                const startTime = Date.now();
                const responses = await this.handler!(httpEvent);
                const duration = Date.now() - startTime;

                this.logger.debug("Handler completed", {
                    requestId,
                    duration,
                    responseCount: responses?.length || 0
                });

                // Write responses
                await this.writeResponses(responses, res);

                this.logger.debug("Response sent", {
                    requestId,
                    statusCode: res.statusCode
                });
            } catch (err) {
                this.logger.error("Request failed", {
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
                next(err);
            }
        });
    }

    private async writeResponses(responses: any[], res: express.Response): Promise<void> {
        if (responses && responses.length > 0) {
            const response = responses[0];
            res.status(response.statusCode || 200);
            res.json(response.body || response);
        } else {
            res.status(404).json({ error: 'Not Found' });
        }
    }

    async run(): Promise<any> {
        return new Promise((resolve) => {
            this.server = this.application.listen(this.port, () => {
                this.logger.info("HTTP server started", { port: this.port });
                resolve({ running: true, port: this.port });
            });
        });
    }

    async stop(): Promise<any> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.logger.info("HTTP server stopped");
                    resolve({ running: false });
                });
            } else {
                resolve({ running: false });
            }
        });
    }

    onEvent(handler: (event: FlexibleEvent) => Promise<any>): void {
        this.handler = handler;
    }

    private generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
}
```

### 3. Module and Builder

```typescript
export class HttpModuleBuilder {
    private port: number = 3000;
    private logger?: FlexibleLogger;

    static get instance(): HttpModuleBuilder {
        return new HttpModuleBuilder();
    }

    withPort(port: number): this {
        this.port = port;
        return this;
    }

    withLogger(logger: FlexibleLogger): this {
        this.logger = logger;
        return this;
    }

    build(): FlexibleEventSourceModule {
        return {
            getInstance: (container) => {
                const logger = this.logger || container.get(FLEXIBLE_APP_TYPES.LOGGER);
                return new HttpSource(this.port, logger);
            },
            container: new ContainerModule(() => {})
        };
    }
}
```

## Testing Your Event Source

### Unit Tests

Test event creation:

```typescript
describe("MyEventSource", () => {
    it("should create events with correct structure", () => {
        const source = new MyEventSource();
        const event = source.createEvent(mockInput);

        expect(event.eventType).toBe('MyEvent');
        expect(event.routeData).toBeDefined();
        expect(event.requestId).toBeDefined();
    });

    it("should generate unique request IDs", () => {
        const source = new MyEventSource();
        const id1 = source.generateRequestId();
        const id2 = source.generateRequestId();

        expect(id1).not.toBe(id2);
    });
});
```

### Integration Tests

Test with DummyFramework:

```typescript
import { DummyFramework } from "flexible-core";

describe("MyEventSource Integration", () => {
    let source: MyEventSource;
    let app: FlexibleApp;

    beforeEach(async () => {
        const framework = new DummyFramework();
        framework.addPipelineDefinition({
            filterStack: [],
            middlewareStack: [{
                activationContext: {
                    activate: async () => ({ success: true })
                },
                extractorRecipes: {}
            }]
        });

        source = new MyEventSource();

        app = FlexibleAppBuilder.instance
            .addEventSource(source)
            .addFramework(framework)
            .createApp();

        await app.run();
    });

    afterEach(async () => {
        await app.stop();
    });

    it("should process events", async () => {
        const response = await source.sendTestEvent({
            type: 'test',
            data: 'hello'
        });

        expect(response).toEqual({ success: true });
    });
});
```

## Best Practices

### 1. Generate Unique Request IDs

Always generate or accept request IDs for tracing:

```typescript
private getRequestId(externalId?: string): string {
    return externalId || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}
```

### 2. Add Structured Logging

Log important events with context:

```typescript
this.logger.debug("Event received", {
    requestId: event.requestId,
    eventType: event.eventType,
    routeData: event.routeData
});
```

### 3. Handle Errors Gracefully

Catch and log errors without crashing:

```typescript
try {
    const responses = await this.handler!(event);
    await this.processResponses(responses);
} catch (error) {
    this.logger.error("Event processing failed", {
        requestId: event.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
    });
    await this.sendErrorResponse(error);
}
```

### 4. Support Health Checks

Implement health checks for monitoring:

```typescript
async healthCheck(): Promise<HealthStatus> {
    return {
        healthy: this.isRunning && this.server !== undefined,
        details: {
            port: this.port,
            connections: this.server?.connections || 0
        }
    };
}
```

### 5. Clean Up Resources

Properly clean up in stop():

```typescript
async stop(): Promise<any> {
    // Close connections
    await this.closeConnections();

    // Stop server
    await this.stopServer();

    // Clear handlers
    this.handler = undefined;

    return { running: false };
}
```

### 6. Use Builder Pattern

Provide a fluent API for configuration:

```typescript
const source = MyEventSourceBuilder.instance
    .withPort(8080)
    .withTimeout(30000)
    .withLogger(logger)
    .build();
```

### 7. Document Event Structure

Clearly document your event format:

```typescript
/**
 * HTTP Event
 *
 * @property eventType - Always 'HttpEvent'
 * @property routeData.method - HTTP method (GET, POST, etc.)
 * @property routeData.path - Request path
 * @property request - Node.js IncomingMessage
 * @property response - Node.js ServerResponse
 * @property requestId - Unique request identifier
 *
 * @example
 * ```typescript
 * {
 *   eventType: 'HttpEvent',
 *   routeData: {
 *     method: 'GET',
 *     path: '/users/123'
 *   },
 *   requestId: '1234567890-abc',
 *   request: req,
 *   response: res
 * }
 * ```
 */
export class HttpEvent implements FlexibleEvent {
    // ...
}
```

## Advanced Features

### Request/Response Correlation

Track requests through the system:

```typescript
private async handleEvent(input: any) {
    const requestId = this.extractRequestId(input);
    const event = this.createEvent(input, requestId);

    // Store correlation data
    this.correlations.set(requestId, {
        startTime: Date.now(),
        input: input
    });

    try {
        const responses = await this.handler!(event);
        return responses;
    } finally {
        this.correlations.delete(requestId);
    }
}
```

### Batching

Process multiple events together:

```typescript
private batch: FlexibleEvent[] = [];
private batchTimer?: NodeJS.Timeout;

private addToBatch(event: FlexibleEvent) {
    this.batch.push(event);

    if (this.batch.length >= this.batchSize) {
        this.processBatch();
    } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.batchTimeout);
    }
}

private async processBatch() {
    const events = this.batch.splice(0);
    clearTimeout(this.batchTimer);
    this.batchTimer = undefined;

    await Promise.all(events.map(event => this.handler!(event)));
}
```

### Retry Logic

Retry failed events:

```typescript
private async processWithRetry(event: FlexibleEvent, maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await this.handler!(event);
        } catch (error) {
            this.logger.warning("Event processing failed, retrying", {
                requestId: event.requestId,
                attempt,
                maxRetries
            });

            if (attempt === maxRetries) {
                throw error;
            }

            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
    }
}
```

## Complete Example: Timer Event Source

Here's a complete example of a simple timer event source:

```typescript
export class TimerEventSource implements FlexibleEventSource {
    private handler?: (event: FlexibleEvent) => Promise<any>;
    private interval?: NodeJS.Timeout;
    private isRunning: boolean = false;

    constructor(
        private intervalMs: number,
        private logger: FlexibleLogger
    ) {}

    async run(): Promise<any> {
        this.isRunning = true;

        this.interval = setInterval(async () => {
            const event: FlexibleEvent = {
                eventType: 'TimerEvent',
                routeData: {
                    schedule: `every-${this.intervalMs}ms`
                },
                requestId: this.generateRequestId(),
                timestamp: new Date()
            };

            this.logger.debug("Timer event triggered", {
                requestId: event.requestId,
                timestamp: event.timestamp
            });

            try {
                if (this.handler) {
                    await this.handler(event);
                }
            } catch (error) {
                this.logger.error("Timer event processing failed", {
                    requestId: event.requestId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }, this.intervalMs);

        this.logger.info("Timer event source started", {
            intervalMs: this.intervalMs
        });

        return { running: true, intervalMs: this.intervalMs };
    }

    async stop(): Promise<any> {
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }

        this.logger.info("Timer event source stopped");

        return { running: false };
    }

    onEvent(handler: (event: FlexibleEvent) => Promise<any>): void {
        this.handler = handler;
    }

    private generateRequestId(): string {
        return `timer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
}

// Usage
const timerSource = new TimerEventSource(5000, logger); // Every 5 seconds

const app = FlexibleAppBuilder.instance
    .addEventSource(timerSource)
    .addFramework(framework)
    .createApp();

await app.run();
```

## See Also

- [Architecture: Event Sources](../architecture/event-sources.md)
- [API Reference: FlexibleEventSource](../api/flexible-event-source.md)
- [Example: HTTP Event Source](https://github.com/ftacchini/flexible-http)
- [Guide: Creating Frameworks](creating-framework.md)
