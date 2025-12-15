# CancellationMiddleware

`CancellationMiddleware` monitors cancellation tokens and throws `CancellationError` when cancellation is signaled.

## Import

```typescript
import { CancellationMiddleware, CancellationError } from "flexible-core";
```

## Constructor

```typescript
constructor(logger: FlexibleLogger)
```

### Parameters

- `logger: FlexibleLogger` - Logger instance for warning messages

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

Checks if the event has a cancellation token and if it's already aborted. Stores the token in the context binnacle for downstream middleware access.

#### Parameters

- `event: FlexibleEvent` - The event being processed (may contain `cancellationToken`)
- `response: FlexibleResponse` - The response object
- `filterBinnacle: { [key: string]: string }` - Filter context data
- `contextBinnacle: { [key: string]: any }` - Shared context for middleware

#### Returns

`Promise<any>` - Resolves immediately if not cancelled

#### Throws

`CancellationError` - If the cancellation token is already aborted

#### Side Effects

If `event.cancellationToken` exists, stores it in `contextBinnacle` under key `__cancellation_token`

#### Logging

**Warning Level:**
- When cancellation is detected: Logs request ID and cancellation reason

**No Logging:**
- When event has no cancellation token

## Usage

### Basic Usage

```typescript
import { CancellationMiddleware } from "flexible-core";
import { Controller, Route, BeforeExecution } from "flexible-decorators";
import { HttpGet } from "flexible-http";

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

### With Timeout

```typescript
@Controller()
export class ApiController {
    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 5000 }
    })
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(HttpGet)
    public async getData() {
        // Protected by both timeout and cancellation
        return await this.dataService.fetch();
    }
}
```

### Accessing Cancellation Token in Middleware

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

## CancellationError

Error thrown when cancellation is detected.

```typescript
class CancellationError extends Error {
    public readonly name = "CancellationError";
    public readonly reason?: string;      // Cancellation reason if available

    constructor(reason?: string, message?: string);
}
```

### Properties

- `name: string` - Always "CancellationError"
- `reason?: string` - The reason for cancellation (e.g., "Client disconnected")
- `message: string` - Error message

### Example

```typescript
try {
    await processRequest();
} catch (error) {
    if (error instanceof CancellationError) {
        console.log(`Request cancelled: ${error.reason || 'unknown reason'}`);

        // Return appropriate HTTP response
        return {
            statusCode: 499,  // Client Closed Request
            error: 'Request Cancelled',
            reason: error.reason
        };
    }
}
```

## Context Binnacle Keys

The middleware uses the following key in the context binnacle:

```typescript
export const CANCELLATION_CONTEXT_KEYS = {
    TOKEN: "__cancellation_token"  // AbortSignal instance
} as const;
```

This key is prefixed with `__` to avoid collisions with user data.

## How It Works

1. **Checking Token**: When `processEvent` is called, checks if `event.cancellationToken` exists
2. **Storing Token**: If present, stores the token in the context binnacle
3. **Checking Status**: If the token's `aborted` property is `true`, throws `CancellationError`
4. **Passthrough**: If no token or token is not aborted, returns immediately

## HTTP Integration

The HTTP event source automatically creates cancellation tokens:

```typescript
// Automatic in HTTP module
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

### Testing Client Disconnection

```bash
# Start a long-running request and cancel it
curl http://localhost:3000/slow-operation &
PID=$!
sleep 1
kill $PID

# The server will detect the disconnection and stop processing
```

## Checking Cancellation in Long-Running Operations

For operations that take significant time, check the cancellation token periodically:

```typescript
public async processLargeDataset(
    data: any[],
    contextBinnacle: { [key: string]: any }
) {
    const token = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal;

    for (let i = 0; i < data.length; i++) {
        // Check cancellation every iteration
        if (token?.aborted) {
            throw new CancellationError(token.reason, 'Processing cancelled');
        }

        await this.processItem(data[i]);
    }

    return { processed: data.length };
}
```

### Using AbortSignal with Fetch

```typescript
public async fetchExternalData(
    url: string,
    contextBinnacle: { [key: string]: any }
) {
    const token = contextBinnacle[CANCELLATION_CONTEXT_KEYS.TOKEN] as AbortSignal;

    // Pass token to fetch
    const response = await fetch(url, {
        signal: token
    });

    return await response.json();
}
```

## Composable Architecture

CancellationMiddleware works seamlessly with composable apps:

```typescript
// Cancellation layer
@Controller()
class CancellationController {
    constructor(
        @inject('NextLayer') private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(Everything)
    public async processAll(@Param(FullEvent) event: FlexibleEvent) {
        return await this.nextLayer.generateEvent(event);
    }
}

const cancellationApp = FlexibleApp.builder()
    .addFramework(cancellationFramework)
    .addEventSource(cancellationEventSource)
    .createApp();
```

**[→ See Composable Architecture Guide](../guides/composable-apps.md)**

## Best Practices

### 1. Place After TimeoutMiddleware

```typescript
// Good: Check timeout first, then cancellation
@BeforeExecution(TimeoutMiddleware, 'processEvent', { config: { timeout: 5000 } })
@BeforeExecution(CancellationMiddleware, 'processEvent')
@Route(HttpGet)
public async getData() { /* ... */ }
```

### 2. Check Cancellation in Long Operations

```typescript
// Check periodically in loops
for (let i = 0; i < items.length; i++) {
    if (token?.aborted) {
        throw new CancellationError(token.reason);
    }
    await processItem(items[i]);
}
```

### 3. Pass Token to External APIs

```typescript
// Use with fetch, axios, etc.
const response = await fetch(url, { signal: token });
```

### 4. Handle Errors Gracefully

```typescript
if (error instanceof CancellationError) {
    return {
        statusCode: 499,  // Client Closed Request
        error: 'Request Cancelled',
        message: 'The request was cancelled by the client'
    };
}
```

### 5. Log Cancellation Events

```typescript
try {
    return await this.dataService.fetch();
} catch (error) {
    if (error instanceof CancellationError) {
        this.logger.warn('Operation cancelled', {
            reason: error.reason
        });
    }
    throw error;
}
```

## Testing

```typescript
import { CancellationMiddleware, CancellationError } from "flexible-core";
import { TestCancellationMiddleware, TestAbortController } from "flexible-core/test-utilities";

describe("CancellationMiddleware", () => {
    it("should throw CancellationError for aborted token", async () => {
        const { middleware, logger } = TestCancellationMiddleware.createWithMockLogger();

        const abortController = TestAbortController.createAborted('Test cancellation');

        const event: FlexibleEvent = {
            cancellationToken: abortController.signal,
            /* ... */
        };

        await expectAsync(
            middleware.processEvent(event, {}, {}, {})
        ).toBeRejectedWithError(CancellationError);
    });

    it("should store token in binnacle", async () => {
        const { middleware } = TestCancellationMiddleware.createWithMockLogger();

        const abortController = new AbortController();
        const event: FlexibleEvent = {
            cancellationToken: abortController.signal,
            /* ... */
        };
        const contextBinnacle = {};

        await middleware.processEvent(event, {}, {}, contextBinnacle);

        expect(contextBinnacle['__cancellation_token']).toBe(abortController.signal);
    });
});
```

## See Also

- **[TimeoutMiddleware](timeout-middleware.md)** - Timeout support
- **[Timeout and Cancellation Guide](../guides/timeout-cancellation.md)** - Complete guide
- **[FlexibleEvent](flexible-event.md)** - Event interface with cancellation token
- **[FlexibleMiddleware](flexible-middleware.md)** - Base middleware class

