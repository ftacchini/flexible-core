# Test Utilities for Timeout and Cancellation Support

This module provides test utilities to simplify testing of timeout and cancellation functionality in flexible-core.

## Usage Examples

### TestTimeoutMiddleware

Create timeout middleware instances for testing:

```typescript
import { TestTimeoutMiddleware } from '../test-utilities';

// Create middleware with specific timeout
const middleware = TestTimeoutMiddleware.create(5000);

// Create middleware with mock logger for verification
const { middleware, logger } = TestTimeoutMiddleware.createWithMockLogger(3000);

// Use in tests
await middleware.processEvent(contextBinnacle);
expect(logger.debug).toHaveBeenCalled();
```

### TestCancellationMiddleware

Create cancellation middleware instances for testing:

```typescript
import { TestCancellationMiddleware } from '../test-utilities';

// Create middleware
const middleware = TestCancellationMiddleware.create();

// Create middleware with mock logger for verification
const { middleware, logger } = TestCancellationMiddleware.createWithMockLogger();

// Use in tests
await middleware.processEvent(event, contextBinnacle);
expect(logger.warning).toHaveBeenCalled();
```

### TestAbortController

Create AbortController instances for testing cancellation scenarios:

```typescript
import { TestAbortController } from '../test-utilities';

// Create already-aborted controller
const controller = TestAbortController.createAborted('User cancelled');
expect(controller.signal.aborted).toBe(true);

// Create controller that aborts after delay
const controller = TestAbortController.createWithDelay(100, 'Timeout');
// Signal will abort after 100ms

// Wait for abort signal
await TestAbortController.waitForAbort(controller.signal);

// Create controller with abort promise
const { controller, abortPromise } = TestAbortController.createWithAbortPromise();
controller.abort();
await abortPromise; // Resolves when aborted
```

## Mock Logger

The utilities also export a `createMockLogger()` function that creates a mock logger with jasmine spies for all log methods:

```typescript
import { createMockLogger } from '../test-utilities';

const logger = createMockLogger();
logger.debug('test message');
expect(logger.debug).toHaveBeenCalledWith('test message');
```

## Requirements

These utilities support testing for all timeout and cancellation requirements in the flexible-core framework.
