# Flexible Core

[![npm version](https://badge.fury.io/js/flexible-core.svg)](https://www.npmjs.com/package/flexible-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Event processing framework for Node.js that connects Event Sources to Frameworks through a flexible routing system.

## Quick Start

```bash
npm install flexible-core flexible-http flexible-decorators
```

```typescript
import "reflect-metadata";
import { FlexibleApp } from "flexible-core";
import { DecoratorsFrameworkModule, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModule } from "flexible-http";
import { injectable } from "tsyringe";

@injectable()
@Controller()
export class HelloController {
    @Route(HttpGet)
    public world(): any {
        return { message: "Hello, World!" };
    }
}

const app = FlexibleApp.builder()
    .addEventSource(HttpModule.builder().withPort(3000).build())
    .addFramework(DecoratorsFrameworkModule.builder()
        .withControllerLoader(new ExplicitControllerLoader([HelloController]))
        .build())
    .createApp();

app.run();
```

**[→ Full Getting Started Guide](docs/getting-started.md)**

## Features

- 🚀 **High Performance** - O(log n) routing with decision tree
- 📦 **Modular** - Compose event sources, frameworks, and middleware
- ⏱️ **Timeout & Cancellation** - Built-in support for request timeouts and client disconnections
- 🔍 **Structured Logging** - Built-in support with JSON output
- 💉 **Dependency Injection** - Powered by TSyringe with child container support
- 🧪 **Testable** - Built-in test utilities
- 🔌 **Extensible** - Create custom event sources, frameworks, and loggers
- 📝 **TypeScript** - Full type safety

## Documentation

### Getting Started
- **[Getting Started Guide](docs/getting-started.md)** - Create your first app
- **[Installation](docs/getting-started.md#installation)** - Setup instructions
- **[Quick Start](docs/getting-started.md#your-first-application)** - Hello World example
- **[Migration Guide](docs/MIGRATION-TSYRINGE.md)** - Upgrading from InversifyJS (v0.1.x → v0.2.0+)

### Architecture
- **[Overview](docs/architecture/overview.md)** - System design and concepts
- **[Components](docs/architecture/components.md)** - Event sources, routers, frameworks, and pipelines
- **[Modules](docs/architecture/modules.md)** - Module system and dependency injection
- **[Request Flow](docs/architecture/request-flow.md)** - How requests are processed
- **[Design Patterns](docs/architecture/design-patterns.md)** - Patterns used throughout
- **[Tree Router](docs/architecture/tree-router.md)** - Decision tree routing algorithm

### Guides
- **[Timeout and Cancellation](docs/guides/timeout-cancellation.md)** - Handle timeouts and client disconnections
- **[Logging](docs/guides/logging.md)** - Structured logging guide
- **[Composable Architecture](docs/guides/composable-apps.md)** - Build layered security and middleware
- **[Creating Event Sources](docs/guides/creating-event-source.md)** - Build custom sources
- **[Creating Frameworks](docs/guides/creating-framework.md)** - Build custom frameworks
- **[Creating Routers](docs/guides/creating-router.md)** - Build custom routers

## Available Packages

### Event Sources
- **[flexible-http](https://github.com/ftacchini/flexible-http)** - HTTP/HTTPS server
- Create your own by implementing `FlexibleEventSource`

### Frameworks
- **[flexible-decorators](https://github.com/ftacchini/flexible-decorators)** - Decorator-based controllers
- Create your own by implementing `FlexibleFramework`

### Examples
- **[flexible-example-app](https://github.com/ftacchini/flexible-example-app)** - Complete example with Winston logging

## Core Concepts

```
┌─────────────────┐
│  Event Source   │  HTTP, WebSocket, Queue, etc.
└────────┬────────┘
         │ Events
         ▼
┌─────────────────┐
│     Router      │  Decision Tree (O(log n))
└────────┬────────┘
         │ Matched Routes
         ▼
┌─────────────────┐
│   Framework     │  Decorators, Express-like, etc.
└────────┬────────┘
         │ Middleware Pipeline
         ▼
┌─────────────────┐
│  Your Handler   │  Controller, Function, etc.
└─────────────────┘
```

**[→ Learn More About Architecture](docs/architecture/overview.md)**

## Key Features

### Timeout and Cancellation Support

Protect your application from long-running operations and handle client disconnections gracefully:

```typescript
import { TimeoutMiddleware, CancellationMiddleware } from "flexible-core";
import { Controller, Route, BeforeExecution } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class UserController {
    @BeforeExecution(TimeoutMiddleware, 'processEvent', {
        config: { timeout: 5000 }  // 5 second timeout
    })
    @BeforeExecution(CancellationMiddleware, 'processEvent')
    @Route(HttpGet)
    public async getUsers() {
        // Protected by timeout and cancellation
        return await this.userService.fetchUsers();
    }
}
```

**Features:**
- Composable timeout layers with different durations
- Automatic cancellation on client disconnect
- Built-in error types for consistent handling
- Structured logging for timeout and cancellation events

**[→ Timeout and Cancellation Guide](docs/guides/timeout-cancellation.md)**

### Structured Logging

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject, injectable } from "tsyringe";

@injectable()
@Controller()
export class UserController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}

    @Route(HttpPost)
    public createUser(user: User): any {
        this.logger.info("Creating user", {
            username: user.username,
            timestamp: new Date().toISOString()
        });
        return { success: true };
    }
}
```

**[→ Logging Guide](docs/guides/logging.md)**

### High-Performance Routing

Decision tree-based router with O(log n) lookup:

```typescript
// Automatically routes to the right handler
GET /users/123    → UserController.getUser()
POST /users       → UserController.createUser()
GET /posts/456    → PostController.getPost()
```

**[→ Routing Guide](docs/architecture/tree-router.md)**

### Dependency Injection

Built on TSyringe for powerful DI with child container support:

```typescript
import { inject, injectable } from "tsyringe";

@injectable()
@Controller()
export class UserController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(UserService.TYPE) private userService: UserService
    ) {}
}
```

#### Child Containers for Composable Architecture

Create isolated layers with shared dependencies:

```typescript
import { FlexibleContainer } from "flexible-core";

// Main container with shared bindings
const mainContainer = new FlexibleContainer();
mainContainer.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);

// Security layer with child container
const securityContainer = mainContainer.createChild();
securityContainer.registerValue("NextLayer", businessEventSource);

const securityApp = FlexibleApp.builder()
    .withContainer(securityContainer)
    .addEventSource(httpModule)
    .addFramework(securityFramework)
    .createApp();

// Business layer with child container
const businessContainer = mainContainer.createChild();

const businessApp = FlexibleApp.builder()
    .withContainer(businessContainer)
    .addEventSource(businessEventSource)
    .addFramework(businessFramework)
    .createApp();
```

**Benefits:**
- Each layer can override shared bindings
- True isolation between layers
- Shared bindings automatically available
- No pollution of parent container

### Modular Design

Everything is a module that can be composed:

```typescript
const app = FlexibleApp.builder()
    .withLogger(loggerModule)      // Optional logging
    .addEventSource(httpModule)    // HTTP events
    .addEventSource(wsModule)      // WebSocket events
    .addFramework(decoratorModule) // Decorator framework
    .createApp();
```

### Container Management

Use TSyringe's powerful DI with flexible-core's container wrapper:

```typescript
import { FlexibleContainer } from "flexible-core";

// Create container with shared services
const container = new FlexibleContainer();
container.registerClass(UserService.TYPE, UserService);
container.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);

// Use container in app
const app = FlexibleApp.builder()
    .withContainer(container)
    .addEventSource(httpModule)
    .addFramework(decoratorModule)
    .createApp();
```

## Examples

### Basic HTTP Server

```typescript
const app = FlexibleApp.builder()
    .addEventSource(HttpModule.builder().withPort(3000).build())
    .addFramework(DecoratorsFrameworkModule.builder()
        .withControllerLoader(new ExplicitControllerLoader([HelloController]))
        .build())
    .createApp();

await app.run();
```

### With Logging

```typescript
import { ConsoleLoggerModule } from "flexible-core";

const app = FlexibleApp.builder()
    .withLogger(new ConsoleLoggerModule())
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

### Production Configuration

```typescript
import { ConfigurableLoggerModule, LogLevel } from "flexible-core";

const app = FlexibleApp.builder()
    .withLogger(new ConfigurableLoggerModule({
        minLevel: LogLevel.INFO,
        format: 'json',
        includeTimestamp: true
    }))
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

**[→ More Examples](https://github.com/ftacchini/flexible-example-app)**

## Testing

Flexible includes built-in test utilities:

```typescript
import { DummyFramework, DummyEventSource } from "flexible-core";

const framework = new DummyFramework();
framework.addPipelineDefinition({
    filterStack: [/* ... */],
    middlewareStack: [/* ... */]
});

const eventSource = new DummyEventSource();
await eventSource.run();
await eventSource.generateEvent(myEvent);
```

**[→ Testing Guide](docs/guides/testing.md)**

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Federico Tacchini](https://github.com/ftacchini)

## Links

- [GitHub Repository](https://github.com/ftacchini/flexible-core)
- [npm Package](https://www.npmjs.com/package/flexible-core)
- [Documentation](docs/)
- [Examples](https://github.com/ftacchini/flexible-example-app)
- [Issues](https://github.com/ftacchini/flexible-core/issues)

---

**Made with ❤️ by the Flexible team**
