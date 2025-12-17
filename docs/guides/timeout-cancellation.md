# Timeout and Cancellation Support

This guide shows you how to use timeout and cancellation features in Flexible to handle long-running operations, prevent resource exhaustion, and respond to client disconnections.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [TimeoutMiddleware](#timeoutmiddleware)
- [CancellationMiddleware](#cancellationmiddleware)
- [HTTP Integration](#http-integration)
- [Composable Timeout Layers](#composable-timeout-layers)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

Flexible provides two complementary mechanisms for controlling request lifecycles:

1. **Timeout Support** - Set time limits on request processing
2. **Cancellation Support** - Respond to client disconnections and explicit cancellation signals

### Why Use Timeouts and Cancellation?

- **Prevent Resource Exhaustion**: Stop long-running operations that consume server resources
- **Improve Responsiveness**: Fail fast when operations take too long
- **Handle Client Disconnections**: Stop processing when clients are no longer waiting
- **Composable Architecture**: Apply different timeouts at different layers

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FlexibleApp                            │
│                                                             │
│  ┌──────────────┐         ┌─────────────────────┐         │
│  │ HTTP Source  │────────▶│  FlexibleEvent      │         │
│  │              │         │  + cancellationToken│         │
│  └──────────────┘         └──────────┬──────────┘         │
│                                      │                      │
│                                      ▼                      │
│                           ┌─────────────────────┐          │
│                           │  FlexiblePipeline   │          │
│                           │                     │          │
│                           │  ┌───────────────┐ │          │
│                           │  │   Timeout     │ │          │
│                           │  │  Middleware   │ │          │
│                           │  └───────┬───────┘ │          │
│                           │          │         │          │
│                           │  ┌───────▼───────┐ │          │
│                           │  │ Cancellation  │ │          │
│                           │  │  Middleware   │ │          │
│                           │  └───────┬───────┘ │          │
│                           │          │         │          │
│                           │  ┌───────▼───────┐ │          │
│                           │  │   Business    │ │          │
│                           │  │  Middleware   │ │          │
│                           │  └───────────────┘ │          │
│                           └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Timeout

```typescript
import { TimeoutMiddleware } from "flexible-core";
import { Controller, Route, BeforeExecution } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class UserController {
    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 5000 }  // 5 second timeout
    })
    @Route(HttpGet)
    public async getUsers() {
        // This operation must complete within 5 seconds
        return await this.userService.fetchUsers();
    }
}
```

### Basic Cancellation

```typescript
import { CancellationMiddleware } from "flexible-core";
import { Controller, Route, BeforeExecution } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class UserController {
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(HttpGet)
    public async getUsers() {
        // This operation will stop if the client disconnects
        return await this.userService.fetchUsers();
    }
}
```

## TimeoutMiddleware

`TimeoutMiddleware` monitors execution time and throws `TimeoutError` when the configured duration is exceeded.

### Configuration

```typescript
export interface TimeoutMiddlewareConfig {
    timeout: number;  // milliseconds
}
```

### Usage

#### Per-Route Timeout

```typescript
@Controller()
export class ApiController {
    // Fast endpoint: 1 second timeout
    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 1000 }
    })
    @Route(HttpGet)
    public async quickOperation() {
        return { result: "fast" };
    }

    // Slow endpoint: 30 second timeout
    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 30000 }
    })
    @Route(HttpPost)
    public async slowOperation() {
        return await this.processLargeFile();
    }
}
```

#### Global Timeout

Apply timeout to all routes in a controller:

```typescript
@Controller()
@BeforeExecution(TimeoutMiddleware, 'processEvent', {
    config: { timeout: 10000 }  // 10 second timeout for all routes
})
export class UserController {
    @Route(HttpGet)
    public async getUsers() { /* ... */ }

    @Route(HttpPost)
    public async createUser() { /* ... */ }
}
```

### How It Works

1. **Recording Start Time**: When `processEvent` is called, the middleware records the current timestamp
2. **Storing Configuration**: Timeout value is stored in the context binnacle
3. **Pipeline Monitoring**: The FlexiblePipeline checks elapsed time before each middleware execution
4. **Throwing Error**: If timeout is exceeded, `TimeoutError` is thrown and remaining middleware is skipped

### TimeoutError

```typescript
export class TimeoutError extends Error {
    public readonly name = "TimeoutError";
    public readonly timeout: number;      // Configured timeout in ms
    public readonly elapsed: number;      // Actual elapsed time in ms

    constructor(timeout: number, elapsed: number, message?: string);
}
```

**Example:**
```typescript
try {
    await processRequest();
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log(`Request timed out after ${error.elapsed}ms (limit: ${error.timeout}ms)`);
    }
}
```

### Logging

TimeoutMiddleware logs timing information:

```typescript
// Debug level: When monitoring starts
{
    level: "debug",
    message: "Timeout monitoring started",
    requestId: "req-123",
    timeout: 5000,
    startTime: 1234567890
}

// Warning level: When timeout occurs
{
    level: "warn",
    message: "Request timeout exceeded",
    requestId: "req-123",
    timeout: 5000,
    elapsed: 5001
}

// Debug level: When request completes successfully
{
    level: "debug",
    message: "Request completed within timeout",
    requestId: "req-123",
    elapsed: 2345
}
```

## CancellationMiddleware

`CancellationMiddleware` monitors cancellation tokens and throws `CancellationError` when cancellation is signaled.

### Usage

#### Basic Cancellation Check

```typescript
@Controller()
export class DataController {
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(HttpGet)
    public async fetchData() {
        // If client disconnects, CancellationError is thrown
        return await this.dataService.fetchLargeDataset();
    }
}
```

#### Accessing Cancellation Token in Middleware

The cancellation token is stored in the context binnacle and can be accessed by downstream middleware:

```typescript
import { FlexibleMiddleware, CANCELLATION_CONTEXT_KEYS } from "flexible-core";

export class LongRunningMiddleware extends FlexibleMiddleware {
    public async processEvent(
        event: FlexibleEvent,
        response: FlexibleResponse,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any> {
        const token = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal;

        for (let i = 0; i < 1000; i++) {
            // Check if cancelled
            if (token?.aborted) {
                throw new CancellationError(token.reason, "Operation cancelled");
            }

            await this.processChunk(i);
        }

        return { success: true };
    }
}
```

### How It Works

1. **Checking Token**: When `processEvent` is called, the middleware checks if the event has a cancellation token
2. **Storing Token**: If present, the token is stored in the context binnacle under `CANCELLATION_CONTEXT_KEYS.TOKEN`
3. **Checking Status**: If the token is already aborted, `CancellationError` is thrown immediately
4. **Passthrough**: If no token or token is not aborted, processing continues normally

### CancellationError

```typescript
export class CancellationError extends Error {
    public readonly name = "CancellationError";
    public readonly reason?: string;      // Cancellation reason if available

    constructor(reason?: string, message?: string);
}
```

**Example:**
```typescript
try {
    await processRequest();
} catch (error) {
    if (error instanceof CancellationError) {
        console.log(`Request cancelled: ${error.reason || 'unknown reason'}`);
    }
}
```

### Logging

CancellationMiddleware logs cancellation events:

```typescript
// Warning level: When cancellation is detected
{
    level: "warn",
    message: "Request cancellation detected",
    requestId: "req-123",
    reason: "Client disconnected"
}

// No logging when event has no cancellation token
```

## HTTP Integration

The HTTP event source automatically creates cancellation tokens from client disconnections.

### Automatic AbortSignal Creation

When an HTTP request is received:

1. An `AbortController` is created
2. The controller's signal is attached to the `FlexibleEvent` as `cancellationToken`
3. The request's `close` event is monitored
4. When the client disconnects, `abort()` is called on the controller

```typescript
// This happens automatically in the HTTP module
const abortController = new AbortController();

request.on('close', () => {
    abortController.abort('Client disconnected');
});

const event: FlexibleEvent = {
    data: request,
    routeData: { /* ... */ },
    eventType: 'http',
    requestId: requestId,
    cancellationToken: abortController.signal  // Automatically added
};
```

### Configuration

```typescript
export interface HttpEventSourceConfig {
    enableCancellation?: boolean;  // default: true
}

// Disable cancellation if needed
const httpModule = HttpModuleBuilder.instance
    .withPort(3000)
    .withConfig({ enableCancellation: false })
    .build();
```

### Testing Client Disconnection

```bash
# Start a long-running request and cancel it
curl http://localhost:3000/slow-operation &
PID=$!
sleep 1
kill $PID

# The server will detect the disconnection and stop processing
```

## Composable Timeout Layers

One of the most powerful features is the ability to compose multiple timeout layers with different configurations.

### Architecture Pattern

```
HTTP Request → Global Timeout (30s) → API Timeout (5s) → Business Logic
```

### Example: Multi-Layer Timeouts

```typescript
import "reflect-metadata";
import {
    FlexibleAppBuilder,
    DelegateEventSource,
    TimeoutMiddleware,
    CancellationMiddleware,
    Everything,
    FullEvent
} from "flexible-core";
import {
    DecoratorsFrameworkModuleBuilder,
    ExplicitControllerLoader,
    Controller,
    Route,
    BeforeExecution,
    Param
} from "flexible-decorators";
import { HttpModuleBuilder, HttpGet } from "flexible-http";

// ============================================
// Business Layer (innermost)
// ============================================

@Controller()
class BusinessController {
    @Route(HttpGet)
    public async getUsers() {
        return { users: ['Alice', 'Bob', 'Charlie'] };
    }

    @Route(HttpGet)
    public async slowOperation() {
        // Simulates a 10 second operation
        await new Promise(resolve => setTimeout(resolve, 10000));
        return { result: 'completed' };
    }
}

const businessEventSource = new DelegateEventSource();

const businessApp = FlexibleAppBuilder.instance
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                BusinessController
            ]))
            .build()
    )
    .addEventSource(businessEventSource)
    .createApp();

// ============================================
// API Layer (5 second timeout)
// ============================================

@Controller()
class ApiTimeoutController {
    constructor(
        @inject('BusinessEventSource') private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 5000 }  // 5 second timeout for API calls
    })
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(Everything)
    public async processAll(@Param(FullEvent) event: FlexibleEvent) {
        return await this.nextLayer.generateEvent(event);
    }
}

const apiEventSource = new DelegateEventSource();

const apiApp = FlexibleAppBuilder.instance
    .addModule({
        register(container) {
            container.register('BusinessEventSource', {
                useValue: businessEventSource
            });
        }
    })
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                ApiTimeoutController
            ]))
            .build()
    )
    .addEventSource(apiEventSource)
    .createApp();

// ============================================
// Global Layer (30 second timeout)
// ============================================

@Controller()
class GlobalTimeoutController {
    constructor(
        @inject('ApiEventSource') private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 30000 }  // 30 second global timeout
    })
    @Route(Everything)
    public async processAll(@Param(FullEvent) event: FlexibleEvent) {
        return await this.nextLayer.generateEvent(event);
    }
}

const httpModule = HttpModuleBuilder.instance.withPort(3000).build();

const globalApp = FlexibleAppBuilder.instance
    .addModule({
        register(container) {
            container.register('ApiEventSource', {
                useValue: apiEventSource
            });
        }
    })
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                GlobalTimeoutController
            ]))
            .build()
    )
    .addEventSource(httpModule)
    .createApp();

// ============================================
// Start All Apps
// ============================================

async function start() {
    await businessApp.run();
    await apiApp.run();
    await globalApp.run();

    console.log('Server running on http://localhost:3000');
    console.log('Architecture: HTTP → Global (30s) → API (5s) → Business');
}

start();
```

### How It Works

1. **Request arrives**: HTTP → Global layer (30s timeout starts)
2. **Forwarded to API layer**: API layer (5s timeout starts)
3. **Forwarded to Business layer**: Business logic executes

**Timeout Behavior:**
- `/users` completes quickly → No timeout
- `/slowOperation` takes 10s → API layer times out after 5s
- If API layer had no timeout, global layer would timeout after 30s

### Benefits

- **Layered Protection**: Different timeout policies for different concerns
- **Fail Fast**: Inner layers can have stricter timeouts
- **Flexibility**: Easy to adjust timeouts per layer
- **Composability**: Add/remove layers without changing business logic

**[→ See Full Example](https://github.com/ftacchini/flexible-example-app/tree/main/src/examples/02-composable-security)**

## Error Handling

### Catching Timeout and Cancellation Errors

```typescript
import { TimeoutError, CancellationError } from "flexible-core";
import { Controller, Route, Param } from "flexible-decorators";
import { PreviousError } from "flexible-decorators";

@Controller()
export class ErrorHandlerController {
    @Route(Everything)
    public async handleError(
        @Param(PreviousError) error: Error
    ) {
        if (error instanceof TimeoutError) {
            return {
                statusCode: 408,
                error: 'Request Timeout',
                message: `Request exceeded ${error.timeout}ms limit (took ${error.elapsed}ms)`,
                timeout: error.timeout,
                elapsed: error.elapsed
            };
        }

        if (error instanceof CancellationError) {
            return {
                statusCode: 499,  // Client Closed Request
                error: 'Request Cancelled',
                message: error.reason || 'Client disconnected',
                reason: error.reason
            };
        }

        return {
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message
        };
    }
}
```

### HTTP Status Codes

**Recommended status codes:**
- `408 Request Timeout` - For TimeoutError
- `499 Client Closed Request` - For CancellationError (nginx convention)
- `503 Service Unavailable` - For server-side cancellation

### Error Propagation

Errors flow through the middleware stack:

```
Business Layer (throws TimeoutError)
    ↓
API Layer (catches, logs, re-throws)
    ↓
Global Layer (catches, transforms to HTTP response)
    ↓
HTTP Response (408 Request Timeout)
```

## Testing

### Testing Timeout Behavior

```typescript
import { TimeoutMiddleware, TimeoutError } from "flexible-core";
import { FlexibleEvent, FlexibleResponse } from "flexible-core";

describe("TimeoutMiddleware", () => {
    it("should throw TimeoutError when timeout is exceeded", async () => {
        const middleware = new TimeoutMiddleware(
            { timeout: 100 },
            mockLogger
        );

        const event: FlexibleEvent = { /* ... */ };
        const response: FlexibleResponse = { /* ... */ };

        // Start timeout monitoring
        await middleware.processEvent(event, response, {}, {});

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 150));

        // Pipeline would check timeout here and throw
        expect(() => checkTimeout(contextBinnacle))
            .toThrow(TimeoutError);
    });
});
```

### Testing Cancellation Behavior

```typescript
import { CancellationMiddleware, CancellationError } from "flexible-core";

describe("CancellationMiddleware", () => {
    it("should throw CancellationError for aborted token", async () => {
        const middleware = new CancellationMiddleware(mockLogger);

        const abortController = new AbortController();
        abortController.abort('Test cancellation');

        const event: FlexibleEvent = {
            cancellationToken: abortController.signal,
            /* ... */
        };

        await expectAsync(
            middleware.processEvent(event, response, {}, {})
        ).toBeRejectedWithError(CancellationError);
    });
});
```

### Test Utilities

Flexible provides test utilities for timeout and cancellation testing:

```typescript
import {
    TestTimeoutMiddleware,
    TestCancellationMiddleware,
    TestAbortController
} from "flexible-core/test-utilities";

// Create timeout middleware with mock logger
const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger();

// Create cancellation middleware with mock logger
const { middleware, logger } = TestCancellationMiddleware.createWithMockLogger();

// Create pre-aborted AbortController
const controller = TestAbortController.createAborted('Test reason');

// Create AbortController that aborts after delay
const controller = TestAbortController.createWithDelay(1000);
```

## Best Practices

### 1. Place TimeoutMiddleware Early in the Stack

```typescript
// Good: Timeout protects all downstream middleware
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
@BeforeExecution(AuthMiddleware, 'authenticate')
@BeforeExecution(ValidationMiddleware, 'validate')
@Route(HttpPost)
public async createUser() { /* ... */ }
```

### 2. Place CancellationMiddleware After Timeout

```typescript
// Good: Check timeout first, then cancellation
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
@BeforeExecution(CancellationMiddleware, 'processEvent')
@Route(HttpGet)
public async getData() { /* ... */ }
```

### 3. Use Appropriate Timeout Values

```typescript
// Fast operations: 1-5 seconds
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 2000 } })
@Route(HttpGet)
public async quickQuery() { /* ... */ }

// File uploads: 30-60 seconds
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 60000 } })
@Route(HttpPost)
public async uploadFile() { /* ... */ }

// Long-running jobs: 5-10 minutes
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 300000 } })
@Route(HttpPost)
public async processJob() { /* ... */ }
```

### 4. Check Cancellation in Long-Running Operations

```typescript
public async processLargeDataset(
    data: any[],
    contextBinnacle: { [key: string]: any }
) {
    const token = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal;

    for (let i = 0; i < data.length; i++) {
        // Check cancellation periodically
        if (token?.aborted) {
            throw new CancellationError(token.reason, 'Processing cancelled');
        }

        await this.processItem(data[i]);
    }
}
```

### 5. Log Timeout and Cancellation Events

```typescript
@Controller()
export class MonitoredController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}

    @BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(HttpGet)
    public async getData() {
        try {
            return await this.dataService.fetch();
        } catch (error) {
            if (error instanceof TimeoutError) {
                this.logger.warn('Operation timed out', {
                    timeout: error.timeout,
                    elapsed: error.elapsed
                });
            } else if (error instanceof CancellationError) {
                this.logger.warn('Operation cancelled', {
                    reason: error.reason
                });
            }
            throw error;
        }
    }
}
```

### 6. Use Composable Layers for Complex Timeout Policies

```typescript
// Instead of complex timeout logic in one place:
// ❌ Bad
@BeforeExecution(ComplexTimeoutMiddleware, 'processEvent', {
    config: {
        globalTimeout: 30000,
        apiTimeout: 5000,
        dbTimeout: 2000
    }
})

// Use composable layers:
// ✅ Good
// Global layer: 30s timeout
// API layer: 5s timeout
// DB layer: 2s timeout
```

### 7. Handle Errors Gracefully

```typescript
// Always provide meaningful error responses
if (error instanceof TimeoutError) {
    return {
        statusCode: 408,
        error: 'Request Timeout',
        message: 'The operation took too long to complete',
        retryAfter: 60  // Suggest retry after 60 seconds
    };
}

if (error instanceof CancellationError) {
    return {
        statusCode: 499,
        error: 'Request Cancelled',
        message: 'The request was cancelled by the client'
    };
}
```

## See Also

- **[Composable Apps Guide](composable-apps.md)** - Build layered architectures
- **[Logging Guide](logging.md)** - Structured logging for timeout/cancellation events
- **[Example: Composable Security](https://github.com/ftacchini/flexible-example-app/tree/main/src/examples/02-composable-security)** - Full working example
- **[Creating Middleware](creating-middleware.md)** - Build custom middleware

