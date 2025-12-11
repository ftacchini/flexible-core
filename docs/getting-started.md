# Getting Started

This guide will help you create your first Flexible application in minutes.

> **📦 Upgrading from v0.1.x?** See the [TSyringe Migration Guide](MIGRATION-TSYRINGE.md) for breaking changes.

## Installation

Install flexible-core and the packages you need:

```bash
npm install flexible-core
npm install flexible-http        # For HTTP event source
npm install flexible-decorators  # For decorator-based controllers
```

## Your First Application

### 1. Create a Controller

Create a file `hello-controller.ts`:

```typescript
import { Controller, Route } from "flexible-decorators";
import { HttpGet } from "flexible-http";

@Controller()
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return { message: "Hello, World!" };
    }
}
```

### 2. Set Up the Application

Create a file `index.ts`:

```typescript
import "reflect-metadata";
import { FlexibleAppBuilder } from "flexible-core";
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from "flexible-decorators";
import { HttpModuleBuilder } from "flexible-http";
import { HelloController } from "./hello-controller";

// Configure HTTP event source
const httpEventSource = HttpModuleBuilder.instance
    .withPort(3000)
    .build();

// Configure decorators framework
const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([
        HelloController
    ]))
    .build();

// Build and run the application
const application = FlexibleAppBuilder.instance
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();

application.run().then(status => {
    console.log("Application started:", JSON.stringify(status));
});
```

### 3. Run Your Application

```bash
# Compile TypeScript
npx tsc

# Run the application
node dist/index.js
```

### 4. Test It

```bash
curl http://localhost:3000/world
# {"message":"Hello, World!"}
```

> **See it in action:** Check out [flexible-example-app/integ-test.spec.ts](../../../flexible-example-app/test/integration-test/integ-test.spec.ts) for a complete integration test that starts the application and tests the `/world` endpoint.

## Adding More Features

### Add Logging

```typescript
import { FlexibleAppBuilder, ConsoleLoggerModule } from "flexible-core";

const application = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())  // Add this line
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

Now you'll see debug logs:

```
DEBUG: Setting up logger...
DEBUG: Setting up event sources...
DEBUG: Setting up router...
DEBUG: APP SUCCESSFULLY INITIALIZED!
DEBUG: STARTING EVENT SOURCES
DEBUG: APP RUNNING SUCCESSFULLY
```

### Add More Routes

```typescript
import { Controller, Route } from "flexible-decorators";
import { HttpGet, HttpPost } from "flexible-http";

@Controller()
export class UserController {

    @Route(HttpGet)
    public list(): any {
        return { users: ["Alice", "Bob", "Charlie"] };
    }

    @Route(HttpPost)
    public create(user: any): any {
        return { success: true, user };
    }
}
```

Don't forget to add it to the controller loader:

```typescript
const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([
        HelloController,
        UserController  // Add this
    ]))
    .build();
```

### Inject Dependencies

```typescript
import { FlexibleLogger, FLEXIBLE_APP_TYPES } from "flexible-core";
import { inject } from "tsyringe";

@Controller()
export class UserController {
    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger) {}

    @Route(HttpGet)
    public list(): any {
        this.logger.info("Listing users", {
            timestamp: new Date().toISOString()
        });

        return { users: ["Alice", "Bob", "Charlie"] };
    }
}
```

> **Real example:** See [HelloController](../../../flexible-example-app/src/hello-controller.ts) for a working controller with logger injection.

### Configure Different Ports

```typescript
const port = parseInt(process.env.PORT || "3000", 10);

const httpEventSource = HttpModuleBuilder.instance
    .withPort(port)
    .build();
```

```bash
PORT=8080 node dist/index.js
```

## Project Structure

Here's a recommended project structure:

```
my-app/
├── src/
│   ├── controllers/
│   │   ├── user-controller.ts
│   │   └── hello-controller.ts
│   ├── services/
│   │   └── user-service.ts
│   ├── models/
│   │   └── user.ts
│   └── index.ts
├── test/
│   ├── unit-test/
│   └── integration-test/
├── package.json
└── tsconfig.json
```

## TypeScript Configuration

Recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js",
    "test": "jest"
  }
}
```

## Next Steps

Now that you have a basic application running, explore:

- [Logging Guide](guides/logging.md) - Add structured logging
- [Architecture Overview](architecture/overview.md) - Understand how it works
- [Creating Event Sources](guides/creating-event-source.md) - Build custom event sources
- [Creating Frameworks](guides/creating-framework.md) - Build custom frameworks
- [API Reference](api/) - Detailed API documentation

## Common Issues

### "Cannot find module 'reflect-metadata'"

Make sure you have `reflect-metadata` installed and imported:

```bash
npm install reflect-metadata
```

```typescript
import "reflect-metadata";  // Must be first import
```

### "Decorator errors"

Enable decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### "Port already in use"

Change the port or kill the process using it:

```bash
# Change port
PORT=3001 node dist/index.js

# Or kill the process (macOS/Linux)
lsof -ti:3000 | xargs kill
```

## Examples

Check out the [flexible-example-app](https://github.com/ftacchini/flexible-example-app) for a complete working example with:
- Winston logger integration
- Multiple controllers
- Integration tests
- Production configuration

### Working Code Examples

The concepts in this guide are proven by real working code:

**Integration Tests:**
- [flexible-app.spec.ts](../../test/integration-test/flexible-app.spec.ts) - Complete application lifecycle tests showing how to build, run, and route events through a Flexible app
- [flexible-example-app/integ-test.spec.ts](../../../flexible-example-app/test/integration-test/integ-test.spec.ts) - Real HTTP endpoint testing with the decorators framework

**Source Code:**
- [FlexibleAppBuilder](../../src/flexible/flexible-app-builder.ts) - The builder pattern implementation for creating applications
- [HelloController](../../../flexible-example-app/src/hello-controller.ts) - Example controller with dependency injection

## Getting Help

- [GitHub Issues](https://github.com/ftacchini/flexible-core/issues)
- [Documentation](../README.md)
- [Examples](https://github.com/ftacchini/flexible-example-app)
