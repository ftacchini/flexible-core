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
import { FlexibleAppBuilder } from "flexible-core";
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";

@Controller()
export class HelloController {
    @Route(HttpGet)
    public world(): any {
        return { message: "Hello, World!" };
    }
}

const app = FlexibleAppBuilder.instance
    .addEventSource(HttpModuleBuilder.instance.withPort(3000).build())
    .addFramework(DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([HelloController]))
        .build())
    .createApp();

app.run();
```

**[→ Full Getting Started Guide](docs/getting-started.md)**

## Features

- 🚀 **High Performance** - O(log n) routing with decision tree
- 📦 **Modular** - Compose event sources, frameworks, and middleware
- 🔍 **Structured Logging** - Built-in support with JSON output
- 💉 **Dependency Injection** - Powered by InversifyJS
- 🧪 **Testable** - Built-in test utilities
- 🔌 **Extensible** - Create custom event sources, frameworks, and loggers
- 📝 **TypeScript** - Full type safety

## Documentation

### Getting Started
- **[Getting Started Guide](docs/getting-started.md)** - Create your first app
- **[Installation](docs/getting-started.md#installation)** - Setup instructions
- **[Quick Start](docs/getting-started.md#your-first-application)** - Hello World example

### Architecture
- **[Overview](docs/architecture/overview.md)** - System design and concepts
- **[Event Sources](docs/architecture/event-sources.md)** - How event sources work
- **[Frameworks](docs/architecture/frameworks.md)** - Framework system
- **[Routing](docs/architecture/routing.md)** - Decision tree router
- **[Request Lifecycle](docs/architecture/request-lifecycle.md)** - Request flow

### Guides
- **[Logging](docs/guides/logging.md)** - Structured logging guide
- **[Creating Event Sources](docs/guides/creating-event-source.md)** - Build custom sources
- **[Creating Frameworks](docs/guides/creating-framework.md)** - Build custom frameworks
- **[Testing](docs/guides/testing.md)** - Testing strategies

### API Reference
- **[FlexibleApp](docs/api/flexible-app.md)** - Main application class
- **[FlexibleRouter](docs/api/flexible-router.md)** - Routing interface
- **[FlexibleLogger](docs/api/flexible-logger.md)** - Logging interface
- **[Full API Reference](docs/api/)** - Complete API documentation

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

### Structured Logging

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";

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

**[→ Routing Guide](docs/architecture/routing.md)**

### Dependency Injection

Built on InversifyJS for powerful DI:

```typescript
@Controller()
export class UserController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(UserService.TYPE) private userService: UserService
    ) {}
}
```

### Modular Design

Everything is a module that can be composed:

```typescript
const app = FlexibleAppBuilder.instance
    .withLogger(loggerModule)      // Optional logging
    .addEventSource(httpModule)    // HTTP events
    .addEventSource(wsModule)      // WebSocket events
    .addFramework(decoratorModule) // Decorator framework
    .createApp();
```

## Examples

### Basic HTTP Server

```typescript
const app = FlexibleAppBuilder.instance
    .addEventSource(HttpModuleBuilder.instance.withPort(3000).build())
    .addFramework(DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([HelloController]))
        .build())
    .createApp();

await app.run();
```

### With Logging

```typescript
import { ConsoleLoggerModule } from "flexible-core";

const app = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

### Production Configuration

```typescript
import { ConfigurableLoggerModule, LogLevel } from "flexible-core";

const app = FlexibleAppBuilder.instance
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

MIT © [Francisco Tacchini](https://github.com/ftacchini)

## Links

- [GitHub Repository](https://github.com/ftacchini/flexible-core)
- [npm Package](https://www.npmjs.com/package/flexible-core)
- [Documentation](docs/)
- [Examples](https://github.com/ftacchini/flexible-example-app)
- [Issues](https://github.com/ftacchini/flexible-core/issues)

---

**Made with ❤️ by the Flexible team**
