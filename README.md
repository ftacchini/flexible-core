# Table of Contents

1. [Introduction](#flexible)
1. [Getting started](#getting-started)
1. [Available Frameworks and Event Sources](#available-frameworks-and-event-sources)
1. [Architecture](#architecture)
1. [How-tos](#how-tos)
    1. [How-to build an event source](#architecture)
    1. [How-to build a framework](#architecture)
    1. [How-to create your logger](#architecture)
    1. [How-to create your router](#architecture)
1. [FAQ](#architecture)
1. [Contacts](#architecture)
1. [Issues](#architecture)
1. [License](#architecture)



## Flexible

Flexible is a library that helps you build event processing pipelines by connecting Event Sources to Frameworks. Event Sources provide events
as javascript objects and flexible routes them through middleware structured according to the Frameworks of your choice.

## Getting started

To start using flexible you need to install flexible's core package, one or more event sources and one or more frameworks.

````
npm install flexible-core
npm install flexible-http #or any other
npm install flexible-decorators #or any other
````

Once that's done, you need to initialize your app and you are good to go!


`````
----------------------
./index.ts:
----------------------

const httpEventSource = HttpModuleBuilder.instance
    .build();

const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([
        HelloController
    ]))
    .build();

const application = FlexibleAppBuilder.instance
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();

application.run().then(status => {
    console.log(JSON.stringify(status));
});

----------------------
./hello-controller.ts:
----------------------

@Controller({ filter: HttpMethod })
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return "hello world";
    }

}
`````

## Available Frameworks and Event Sources

### Frameworks

1. [flexible-decorators](https://github.com/ftacchini/flexible-decorators): a framework that uses typescript decorators to create controllers that shape your pipelines.
1. [flexible-dummy-framework](https://github.com/ftacchini/flexible-dummy-framework): a framework that helps you to easily create integration tests for newly created event sources.

### Event Sources

1. [flexible-http](https://github.com/ftacchini/flexible-http): an event source that allows you to feed and filter http and https events into pipelines.
1. [flexible-dummy-source](https://github.com/ftacchini/flexible-dummy-source): an event sources that helps you easily create integration tests for newly created frameworks.

## Architecture

A simplified schema of Flexible can be seen below:

![Flexible's architecture](docs/img/flexible-core_31-7-21.png)

- Flexible Core:
- Frameworks:
- Event Sources:
- User Code:

## Logging

Flexible provides a flexible logging system with structured logging support, multiple logger implementations, and easy integration with popular logging libraries.

### Built-in Loggers

#### 1. ConsoleLoggerModule (Development)

Simple text-based logging for development:

```typescript
import { FlexibleAppBuilder, ConsoleLoggerModule } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

#### 2. SilentLoggerModule (Testing)

No output - perfect for tests:

```typescript
import { SilentLoggerModule } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new SilentLoggerModule())
    .createApp();
```

#### 3. ConfigurableLoggerModule (Production)

Advanced logging with level filtering, JSON output, and sampling:

```typescript
import { ConfigurableLoggerModule, LogLevel } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new ConfigurableLoggerModule({
        minLevel: LogLevel.INFO,
        format: 'json',
        includeTimestamp: true,
        includeHostname: true,
        sampling: {
            rate: 0.1,  // Sample 10% of debug logs
            levels: [LogLevel.DEBUG]
        }
    }))
    .createApp();
```

### Structured Logging

All loggers support structured logging with optional context:

```typescript
// Simple message
logger.info("User logged in");

// With structured context
logger.info("User logged in", {
    userId: 123,
    username: "john",
    ip: "192.168.1.1"
});
```

**Output (ConsoleLoggerModule):**
```
INFO: User logged in {"userId":123,"username":"john","ip":"192.168.1.1"}
```

**Output (ConfigurableLoggerModule with JSON):**
```json
{"level":"INFO","message":"User logged in","userId":123,"username":"john","ip":"192.168.1.1","timestamp":"2025-12-05T10:30:00.000Z"}
```

### Using Logger in Your Code

Inject the logger into your controllers or services:

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject } from "inversify";

@Controller()
export class UserController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}

    @Route(HttpPost)
    public createUser(user: User): any {
        this.logger.info("Creating user", {
            username: user.username,
            timestamp: new Date().toISOString()
        });

        // ... your logic

        return { success: true };
    }
}
```

### Request Lifecycle Logging

Flexible automatically logs request lifecycle with unique request IDs:

```
DEBUG: HTTP request received {"requestId":"1764974867385-x09e","method":"GET","path":"/world","clientIp":"127.0.0.1"}
DEBUG: Request received {"requestId":"1764974867385-x09e","eventType":"HttpEvent"}
DEBUG: Routing request - Finding matching pipelines {"requestId":"1764974867385-x09e"}
DEBUG: Found matching pipelines {"requestId":"1764974867385-x09e","pipelineCount":1}
INFO: World endpoint called {"endpoint":"/world"}
DEBUG: Request completed {"requestId":"1764974867385-x09e","responseCount":1}
DEBUG: Response sent {"requestId":"1764974867385-x09e","statusCode":200}
```

### X-Request-ID Header Support

If a client sends an `X-Request-ID` header, that ID will be used throughout the request lifecycle:

```bash
curl -H "X-Request-ID: my-custom-id" http://localhost:8080/api
```

### Log Levels

Flexible supports 8 log levels (from highest to lowest priority):

1. `EMERGENCY` - System is unusable
2. `ALERT` - Action must be taken immediately
3. `CRITICAL` - Critical conditions
4. `ERROR` - Error conditions
5. `WARNING` - Warning conditions
6. `NOTICE` - Normal but significant condition
7. `INFO` - Informational messages
8. `DEBUG` - Debug-level messages

### Integrating Third-Party Loggers

You can integrate any logging library by implementing the `FlexibleLogger` interface. See the [flexible-example-app](https://github.com/ftacchini/flexible-example-app) for a complete Winston integration example.

```typescript
import { FlexibleLogger, LogContext } from "flexible-core";

export class MyCustomLogger implements FlexibleLogger {
    debug(message: string, context?: LogContext): void {
        // Your implementation
    }

    info(message: string, context?: LogContext): void {
        // Your implementation
    }

    // ... other methods
}
```

### What's Logged

✅ **Safe metadata:**
- Request ID
- HTTP method and path
- Client IP address
- Status code
- Processing duration
- Pipeline count
- Custom context data

❌ **NOT logged (security):**
- Request/response bodies
- Query parameters
- Headers (except X-Request-ID)
- Cookies or tokens
- Passwords or secrets

### Environment-Based Configuration

```typescript
const logger = process.env.NODE_ENV === 'production'
    ? new ConfigurableLoggerModule({
        minLevel: LogLevel.INFO,
        format: 'json',
        includeTimestamp: true
      })
    : new ConsoleLoggerModule();

const app = FlexibleAppBuilder.instance
    .withLogger(logger)
    .createApp();
```

## Test Utilities

Flexible Core now includes test utilities (previously separate packages):

```typescript
import { DummyFramework, DummyEventSource } from "flexible-core";

// Use in tests
const framework = new DummyFramework();
framework.addPipelineDefinition({
  filterStack: [/* ... */],
  middlewareStack: [/* ... */]
});

const eventSource = new DummyEventSource();
await eventSource.run();
await eventSource.generateEvent(myEvent);
```

## How do I create an Event Source?

Event sources should implement the `FlexibleEventSource` interface:

```typescript
export interface FlexibleEventSource {
  run(): Promise<any>;
  stop(): Promise<any>;
  onEvent(handler: (event: FlexibleEvent) => Promise<any>): void;

  // Optional: for health checks
  healthCheck?(): Promise<HealthStatus>;
}
```

## How do I create a Framework?

Frameworks should implement the `FlexibleFramework` interface:

```typescript
export interface FlexibleFramework {
  readonly container: AsyncContainerModule;
  createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]>;
}
```