# TimeoutMiddleware

`TimeoutMiddleware` monitors execution time and throws `TimeoutError` when the configured duration is exceeded.

## Import

```typescript
import { TimeoutMiddleware, TimeoutError } from "flexible-core";
```

## Constructor

```typescript
constructor(
    config: TimeoutMiddlewareConfig,
    logger: FlexibleLogger
)
```

### Parameters

- `config: TimeoutMiddlewareConfig` - Configuration object containing timeout duration
- `logger: FlexibleLogger` - Logger instance for debug and warning messages

### Configuration

```typescript
interface TimeoutMiddlewareConfig {
    timeout: number;  // Timeout duration in milliseconds
}
```

**Validation:**
- `timeout` must be a positive number
- Zero or negative values will throw a configuration error

## Methods

### processEvent

```typescript
public async processEvent(
    event: FlexibleEvent,
    response: FlexibleResponse,
    filterBinnacle: { [key: string]: string },
    contextBinnacle: { [key: string]: any }
): Promise<any>
```

Records the start time and stores timeout configuration in the context binnacle. The FlexiblePipeline monitors elapsed time and throws `TimeoutError` if the timeout is exceeded.

#### Parameters

- `event: FlexibleEvent` - The event being processed
- `response: FlexibleResponse` - The response object
- `filterBinnacle: { [key: string]: string }` - Filter context data
- `contextBinnacle: { [key: string]: any }` - Shared context for middleware

#### Returns

`Promise<any>` - Resolves immediately after recording timing information

#### Side Effects

Stores the following in `contextBinnacle`:
- `__timeout_start_time`: Current timestamp in milliseconds
- `__timeout_ms`: Configured timeout duration

#### Logging

**Debug Level:**
- When monitoring starts: Logs start time and configured timeout
- When request completes: Logs elapsed time

**Warning Level:**
- When timeout occurs: Logs request ID, timeout value, and elapsed time

## Usage

### Basic Usage

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
        return await this.userService.fetchUsers();
    }
}
```

### Multiple Timeouts

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

### Global Timeout

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

## TimeoutError

Error thrown when timeout is exceeded.

```typescript
class TimeoutError extends Error {
    public readonly name = "TimeoutError";
    public readonly timeout: number;      // Configured timeout in ms
    public readonly elapsed: number;      // Actual elapsed time in ms

    constructor(timeout: number, elapsed: number, message?: string);
}
```

### Properties

- `name: string` - Always "TimeoutError"
- `timeout: number` - The configured timeout duration in milliseconds
- `elapsed: number` - The actual elapsed time in milliseconds
- `message: string` - Error message

### Example

```typescript
try {
    await processRequest();
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log(`Request timed out after ${error.elapsed}ms (limit: ${error.timeout}ms)`);

        // Return appropriate HTTP response
        return {
            statusCode: 408,
            error: 'Request Timeout',
            timeout: error.timeout,
            elapsed: error.elapsed
        };
    }
}
```

## Context Binnacle Keys

The middleware uses the following keys in the context binnacle:

```typescript
export const TIMEOUT_CONTEXT_KEYS = {
    START_TIME: "__timeout_start_time",  // Timestamp when monitoring started
    TIMEOUT_MS: "__timeout_ms"           // Configured timeout duration
} as const;
```

These keys are prefixed with `__` to avoid collisions with user data.

## How It Works

1. **Recording Start Time**: When `processEvent` is called, the middleware records `Date.now()` as the start time
2. **Storing Configuration**: The timeout value is stored in the context binnacle
3. **Pipeline Monitoring**: The `FlexiblePipeline` checks elapsed time before executing each middleware
4. **Throwing Error**: If `Date.now() - startTime > timeout`, a `TimeoutError` is thrown
5. **Stopping Execution**: Remaining middleware in the pipeline is skipped

## Composable Architecture

TimeoutMiddleware works seamlessly with composable apps:

```typescript
// Global timeout layer (30 seconds)
const globalApp = FlexibleApp.builder()
    .addEventSource(httpSource)
    .addFramework(timeoutFramework({ timeout: 30000 }))
    .createApp();

// API timeout layer (5 seconds)
const apiApp = FlexibleApp.builder()
    .addEventSource(apiEventSource)
    .addFramework(timeoutFramework({ timeout: 5000 }))
    .addFramework(businessFramework)
    .createApp();
```

**[→ See Composable Timeout Layers Guide](../guides/timeout-cancellation.md#composable-timeout-layers)**

## Best Practices

### 1. Place Early in Middleware Stack

```typescript
// Good: Timeout protects all downstream middleware
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
@BeforeExecution(AuthMiddleware, 'authenticate')
@BeforeExecution(ValidationMiddleware, 'validate')
@Route(HttpPost)
public async createUser() { /* ... */ }
```

### 2. Use Appropriate Timeout Values

```typescript
// Fast operations: 1-5 seconds
{ timeout: 2000 }

// File uploads: 30-60 seconds
{ timeout: 60000 }

// Long-running jobs: 5-10 minutes
{ timeout: 300000 }
```

### 3. Combine with CancellationMiddleware

```typescript
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
@BeforeExecution(CancellationMiddleware, 'processEvent')
@Route(HttpGet)
public async getData() { /* ... */ }
```

### 4. Handle Errors Gracefully

```typescript
if (error instanceof TimeoutError) {
    return {
        statusCode: 408,
        error: 'Request Timeout',
        message: 'The operation took too long to complete',
        retryAfter: 60
    };
}
```

## Testing

```typescript
import { TimeoutMiddleware, TimeoutError } from "flexible-core";
import { TestTimeoutMiddleware } from "flexible-core/test-utilities";

describe("TimeoutMiddleware", () => {
    it("should throw TimeoutError when timeout is exceeded", async () => {
        const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger();

        const event: FlexibleEvent = { /* ... */ };
        const response: FlexibleResponse = { /* ... */ };
        const contextBinnacle = {};

        await middleware.processEvent(event, response, {}, contextBinnacle);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 150));

        // Check if timeout would be triggered
        const startTime = contextBinnacle['__timeout_start_time'];
        const timeout = contextBinnacle['__timeout_ms'];
        const elapsed = Date.now() - startTime;

        expect(elapsed).toBeGreaterThan(timeout);
    });
});
```

## See Also

- **[CancellationMiddleware](cancellation-middleware.md)** - Cancellation support
- **[Timeout and Cancellation Guide](../guides/timeout-cancellation.md)** - Complete guide
- **[Composable Apps Guide](../guides/composable-apps.md)** - Layered architecture
- **[FlexibleMiddleware](flexible-middleware.md)** - Base middleware class

