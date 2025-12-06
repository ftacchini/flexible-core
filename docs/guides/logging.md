# Logging Guide

Flexible provides a flexible logging system with structured logging support, multiple logger implementations, and easy integration with popular logging libraries.

## Table of Contents

- [Built-in Loggers](#built-in-loggers)
- [Structured Logging](#structured-logging)
- [Using Logger in Your Code](#using-logger-in-your-code)
- [Request Lifecycle Logging](#request-lifecycle-logging)
- [Log Levels](#log-levels)
- [Integrating Third-Party Loggers](#integrating-third-party-loggers)
- [Security Considerations](#security-considerations)
- [Environment-Based Configuration](#environment-based-configuration)

## Built-in Loggers

### 1. ConsoleLoggerModule (Development)

Simple text-based logging for development:

```typescript
import { FlexibleAppBuilder, ConsoleLoggerModule } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

**Output:**
```
INFO: User logged in {"userId":123,"username":"john"}
DEBUG: Processing request {"requestId":"abc123"}
```

### 2. SilentLoggerModule (Testing)

No output - perfect for tests:

```typescript
import { SilentLoggerModule } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new SilentLoggerModule())
    .createApp();
```

### 3. ConfigurableLoggerModule (Production)

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

**JSON Output:**
```json
{"level":"INFO","message":"User logged in","userId":123,"username":"john","timestamp":"2025-12-05T10:30:00.000Z","hostname":"server-01"}
```

## Structured Logging

All loggers support structured logging with optional context:

```typescript
// Simple message
logger.info("User logged in");

// With structured context
logger.info("User logged in", {
    userId: 123,
    username: "john",
    ip: "192.168.1.1",
    timestamp: new Date().toISOString()
});
```

**Benefits:**
- Easy to parse and query in log aggregators
- Consistent structure across your application
- Type-safe context objects
- No string interpolation needed

## Using Logger in Your Code

Inject the logger into your controllers or services:

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject } from "inversify";
import { Controller, Route } from "flexible-decorators";
import { HttpPost } from "flexible-http";

@Controller()
export class UserController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}

    @Route(HttpPost)
    public createUser(user: User): any {
        this.logger.info("Creating user", {
            username: user.username,
            timestamp: new Date().toISOString()
        });

        try {
            const result = this.userService.create(user);

            this.logger.info("User created successfully", {
                userId: result.id,
                username: user.username
            });

            return { success: true, userId: result.id };
        } catch (error) {
            this.logger.error("Failed to create user", {
                username: user.username,
                error: error.message
            });
            throw error;
        }
    }
}
```

## Request Lifecycle Logging

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

> **See it in action:** Run the tests in [flexible-example-app/integ-test.spec.ts](../../../flexible-example-app/test/integration-test/integ-test.spec.ts) with ConsoleLoggerModule to see the complete request lifecycle logging.

### X-Request-ID Header Support

If a client sends an `X-Request-ID` header, that ID will be used throughout the request lifecycle:

```bash
curl -H "X-Request-ID: my-custom-id" http://localhost:8080/api
```

All logs for this request will include `"requestId":"my-custom-id"`.

## Log Levels

Flexible supports 8 log levels (from highest to lowest priority):

| Level | Value | Usage |
|-------|-------|-------|
| `EMERGENCY` | 0 | System is unusable |
| `ALERT` | 1 | Action must be taken immediately |
| `CRITICAL` | 2 | Critical conditions |
| `ERROR` | 3 | Error conditions |
| `WARNING` | 4 | Warning conditions |
| `NOTICE` | 5 | Normal but significant condition |
| `INFO` | 6 | Informational messages |
| `DEBUG` | 7 | Debug-level messages |

### Filtering by Level

With `ConfigurableLoggerModule`, you can filter logs by minimum level:

```typescript
// Only log INFO and above (INFO, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY)
new ConfigurableLoggerModule({
    minLevel: LogLevel.INFO,
    format: 'json'
})
```

> **Tested behavior:** See [flexible-configurable-logger.spec.ts](../../test/unit-test/flexible/logging/flexible-configurable-logger.spec.ts) for tests demonstrating log level filtering. The test "should filter out logs below minimum level" proves this functionality.

## Integrating Third-Party Loggers

You can integrate any logging library by implementing the `FlexibleLogger` interface.

### Example: Winston Integration

See the [flexible-example-app](https://github.com/ftacchini/flexible-example-app) for a complete Winston integration example.

```typescript
import winston from 'winston';
import { FlexibleLogger, LogContext } from "flexible-core";

export class WinstonLogger implements FlexibleLogger {
    private winstonInstance: winston.Logger;

    constructor(config?: winston.LoggerOptions) {
        this.winstonInstance = winston.createLogger(config);
    }

    debug(message: string, context?: LogContext): void {
        this.winstonInstance.debug(message, context);
    }

    info(message: string, context?: LogContext): void {
        this.winstonInstance.info(message, context);
    }

    error(message: string, context?: LogContext): void {
        this.winstonInstance.error(message, context);
    }

    // ... other methods
}
```

> **Complete implementation:** See [WinstonLogger](../../../flexible-example-app/src/winston-logger.ts) for the full Winston integration code, and [winston-logging.spec.ts](../../../flexible-example-app/test/integration-test/winston-logging.spec.ts) for integration tests that verify file logging works correctly.

### Creating a Custom Logger

```typescript
import { FlexibleLogger, LogContext } from "flexible-core";

export class MyCustomLogger implements FlexibleLogger {
    debug(message: string, context?: LogContext): void {
        // Your implementation
        console.log(`[DEBUG] ${message}`, context);
    }

    info(message: string, context?: LogContext): void {
        // Your implementation
        console.log(`[INFO] ${message}`, context);
    }

    error(message: string, context?: LogContext): void {
        // Your implementation
        console.error(`[ERROR] ${message}`, context);
    }

    // ... implement all 8 log levels
}
```

## Security Considerations

### What's Logged ✅

- Request ID
- HTTP method and path
- Client IP address
- Status code
- Processing duration
- Pipeline count
- Custom context data you explicitly provide

### What's NOT Logged ❌

For security reasons, Flexible does NOT automatically log:

- Request/response bodies
- Query parameters
- Headers (except X-Request-ID)
- Cookies or tokens
- Passwords or secrets
- Personal information (PII)

**Important:** Only log data you explicitly pass in the context parameter. Never log sensitive information.

```typescript
// ❌ BAD - Logging sensitive data
logger.info("User login", {
    username: user.username,
    password: user.password  // NEVER DO THIS
});

// ✅ GOOD - Only log safe metadata
logger.info("User login", {
    username: user.username,
    timestamp: new Date().toISOString()
});
```

## Environment-Based Configuration

Configure logging based on your environment:

```typescript
import {
    FlexibleAppBuilder,
    ConsoleLoggerModule,
    ConfigurableLoggerModule,
    SilentLoggerModule,
    LogLevel
} from "flexible-core";

// Development: Console with all logs
const devLogger = new ConsoleLoggerModule();

// Production: JSON with INFO and above
const prodLogger = new ConfigurableLoggerModule({
    minLevel: LogLevel.INFO,
    format: 'json',
    includeTimestamp: true,
    includeHostname: true
});

// Testing: Silent
const testLogger = new SilentLoggerModule();

// Select based on environment
const logger = process.env.NODE_ENV === 'production'
    ? prodLogger
    : process.env.NODE_ENV === 'test'
    ? testLogger
    : devLogger;

const app = FlexibleAppBuilder.instance
    .withLogger(logger)
    .createApp();
```

### Using Environment Variables

```typescript
import { ConfigurableLoggerModule, LogLevel } from "flexible-core";

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const logger = new ConfigurableLoggerModule({
    minLevel: LogLevel[logLevel.toUpperCase()],
    format: logFormat as 'text' | 'json',
    includeTimestamp: true
});
```

```bash
# Run with different configurations
LOG_LEVEL=debug npm start
LOG_LEVEL=warn LOG_FORMAT=text npm start
NODE_ENV=production LOG_LEVEL=info npm start
```

## Working Code Examples

The logging system is implemented and tested in real code:

**Logger Implementations:**
- [FlexibleLogger Interface](../../src/logging/flexible-logger.ts) - Logger interface with 8 log levels
- [FlexibleConsoleLogger](../../src/flexible/logging/flexible-console-logger.ts) - Simple console logger
- [FlexibleConfigurableLogger](../../src/flexible/logging/flexible-configurable-logger.ts) - Advanced logger with filtering and JSON output
- [FlexibleSilentLogger](../../src/flexible/logging/flexible-silent-logger.ts) - Silent logger for testing

**Logger Modules:**
- [ConsoleLoggerModule](../../src/flexible/logging/console-logger-module.ts) - Console logger module
- [ConfigurableLoggerModule](../../src/flexible/logging/configurable-logger-module.ts) - Configurable logger module
- [SilentLoggerModule](../../src/flexible/logging/silent-logger-module.ts) - Silent logger module

**Winston Integration Example:**
- [WinstonLogger](../../../flexible-example-app/src/winston-logger.ts) - Winston logger implementation
- [WinstonLoggerModule](../../../flexible-example-app/src/winston-logger-module.ts) - Winston logger module
- [WINSTON_LOGGER.md](../../../flexible-example-app/WINSTON_LOGGER.md) - Complete Winston integration guide

**Tests:**
- [flexible-configurable-logger.spec.ts](../../test/unit-test/flexible/logging/flexible-configurable-logger.spec.ts) - Unit tests for configurable logger
- [logging-file-output.spec.ts](../../test/integration-test/logging-file-output.spec.ts) - Integration tests for file logging
- [winston-logging.spec.ts](../../../flexible-example-app/test/integration-test/winston-logging.spec.ts) - Winston integration tests

## See Also

- [API Reference: FlexibleLogger](../api/flexible-logger.md)
- [API Reference: ConfigurableLoggerModule](../api/configurable-logger-module.md)
- [Architecture: Request Lifecycle](../architecture/request-lifecycle.md)
- [Example: Winston Integration](https://github.com/ftacchini/flexible-example-app/blob/main/WINSTON_LOGGER.md)
