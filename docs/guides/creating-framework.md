# Creating a Framework

This guide shows you how to create a custom framework for Flexible. We'll use the decorators framework as a real-world example.

## Table of Contents

- [What is a Framework?](#what-is-a-framework)
- [Framework Interface](#framework-interface)
- [Step-by-Step Guide](#step-by-step-guide)
- [Real Example: Decorators Framework](#real-example-decorators-framework)
- [Testing Your Framework](#testing-your-framework)
- [Best Practices](#best-practices)

## What is a Framework?

A framework in Flexible defines **how you structure your application code**. It:

- Discovers your handlers (controllers, functions, etc.)
- Creates pipeline definitions (routes + middleware)
- Manages dependency injection for your code
- Defines the programming model (decorators, functions, classes, etc.)

**Examples:**
- **Decorators Framework**: Uses TypeScript decorators (`@Controller`, `@Route`)
- **Express-like Framework**: Uses `app.get('/path', handler)` style
- **Function Framework**: Uses plain functions with metadata
- **Class Framework**: Uses class methods with conventions

## Framework Interface

Every framework must implement `FlexibleFramework`:

```typescript
export interface FlexibleFramework {
    // Dependency injection container
    readonly container: ContainerModule;

    // Optional: Isolated container for framework-specific bindings
    readonly isolatedContainer?: ContainerModule;

    // Creates pipeline definitions from your code
    createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]>;
}
```

### Pipeline Definition

A pipeline definition describes a route and its middleware:

```typescript
interface FlexiblePipelineDocument {
    // Filters that determine if this pipeline should run
    filterStack: FlexibleFilter[];

    // Middleware that processes the event
    middlewareStack: FlexibleMiddlewareDocument[];
}

interface FlexibleMiddlewareDocument {
    // The actual handler
    activationContext: {
        activate: (event: FlexibleEvent, context: any) => Promise<any>;
    };

    // Extractors that populate context before handler runs
    extractorRecipes: { [key: string]: FlexibleExtractorRecipe };
}
```

## Step-by-Step Guide

### Step 1: Define Your Programming Model

Decide how users will write code with your framework.

**Option A: Decorators**
```typescript
@Controller()
export class UserController {
    @Route(HttpGet)
    public getUsers() { }
}
```

**Option B: Functions**
```typescript
export const getUsers = route(HttpGet, () => {
    // handler
});
```

**Option C: Builder**
```typescript
framework
    .route('/users')
    .method('GET')
    .handler(() => { });
```

### Step 2: Create Metadata Storage

Store information about your handlers:

```typescript
// Simple metadata storage
class FrameworkMetadata {
    private routes: Map<Function, RouteInfo[]> = new Map();

    addRoute(target: Function, method: string, filters: any[]) {
        if (!this.routes.has(target)) {
            this.routes.set(target, []);
        }
        this.routes.get(target)!.push({ method, filters });
    }

    getRoutes(target: Function): RouteInfo[] {
        return this.routes.get(target) || [];
    }
}
```

### Step 3: Implement Discovery

Find all handlers in the user's code:

```typescript
class MyFramework implements FlexibleFramework {
    private controllers: Function[];

    constructor(controllers: Function[]) {
        this.controllers = controllers;
    }

    async createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]> {
        const pipelines: FlexiblePipelineDocument[] = [];

        // Discover routes from each controller
        for (const controller of this.controllers) {
            const routes = metadata.getRoutes(controller);

            for (const route of routes) {
                pipelines.push(this.createPipeline(controller, route));
            }
        }

        return pipelines;
    }
}
```

### Step 4: Create Pipeline Definitions

Convert your metadata into pipeline definitions:

```typescript
private createPipeline(
    controller: Function,
    route: RouteInfo
): FlexiblePipelineDocument {
    return {
        // Filters determine when this pipeline runs
        filterStack: route.filters,

        // Middleware processes the event
        middlewareStack: [{
            activationContext: {
                activate: async (event, context) => {
                    // Get controller instance from DI
                    const instance = container.get(controller);

                    // Call the method
                    return instance[route.method](event, context);
                }
            },
            extractorRecipes: {}
        }]
    };
}
```

### Step 5: Set Up Dependency Injection

Create a container module for your framework:

```typescript
public get container(): ContainerModule {
    return new ContainerModule(({ bind }) => {
        // Bind all controllers
        for (const controller of this.controllers) {
            bind(controller).toSelf().inSingletonScope();
        }
    });
}
```

## Real Example: Decorators Framework

Let's look at how the decorators framework works:

### 1. Decorators for Metadata

```typescript
// @Controller decorator
export function Controller(): ClassDecorator {
    return (target: Function) => {
        // Mark this class as a controller
        Reflect.defineMetadata('flexible:controller', true, target);
    };
}

// @Route decorator
export function Route(...filters: FlexibleFilter[]): MethodDecorator {
    return (target: any, propertyKey: string | symbol) => {
        // Store route metadata
        const routes = Reflect.getMetadata('flexible:routes', target.constructor) || [];
        routes.push({
            method: propertyKey,
            filters: filters
        });
        Reflect.setMetadata('flexible:routes', routes, target.constructor);
    };
}
```

### 2. Controller Loader

```typescript
export class ExplicitControllerLoader implements ControllerLoader {
    constructor(private controllers: Function[]) {}

    loadControllers(): Function[] {
        return this.controllers.filter(controller =>
            Reflect.getMetadata('flexible:controller', controller)
        );
    }
}
```

### 3. Framework Implementation

```typescript
export class DecoratorsFramework implements FlexibleFramework {
    constructor(
        private controllerLoader: ControllerLoader,
        private container: Container
    ) {}

    async createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]> {
        const controllers = this.controllerLoader.loadControllers();
        const pipelines: FlexiblePipelineDocument[] = [];

        for (const controller of controllers) {
            // Get routes from metadata
            const routes = Reflect.getMetadata('flexible:routes', controller) || [];

            for (const route of routes) {
                pipelines.push({
                    filterStack: route.filters,
                    middlewareStack: [{
                        activationContext: {
                            activate: async (event, context) => {
                                // Get controller instance
                                const instance = this.container.get(controller);

                                // Call method with extracted parameters
                                const params = this.extractParameters(
                                    controller,
                                    route.method,
                                    event,
                                    context
                                );

                                return instance[route.method](...params);
                            }
                        },
                        extractorRecipes: this.getExtractors(controller, route.method)
                    }]
                });
            }
        }

        return pipelines;
    }

    public get container(): ContainerModule {
        return new ContainerModule(({ bind }) => {
            const controllers = this.controllerLoader.loadControllers();

            for (const controller of controllers) {
                bind(controller).toSelf().inSingletonScope();
            }
        });
    }
}
```

### 4. Builder Pattern

```typescript
export class DecoratorsFrameworkModuleBuilder {
    private controllerLoader?: ControllerLoader;

    static get instance(): DecoratorsFrameworkModuleBuilder {
        return new DecoratorsFrameworkModuleBuilder();
    }

    withControllerLoader(loader: ControllerLoader): this {
        this.controllerLoader = loader;
        return this;
    }

    build(): FlexibleFrameworkModule {
        if (!this.controllerLoader) {
            throw new Error("Controller loader is required");
        }

        return {
            getInstance: (container) => new DecoratorsFramework(
                this.controllerLoader!,
                container
            ),
            container: new ContainerModule(() => {}),
            isolatedContainer: new ContainerModule(() => {})
        };
    }
}
```

## Testing Your Framework

### Unit Tests

Test pipeline creation:

```typescript
describe("MyFramework", () => {
    it("should create pipeline for decorated method", async () => {
        @Controller()
        class TestController {
            @Route(HttpGet)
            public test() {
                return { success: true };
            }
        }

        const framework = new MyFramework([TestController]);
        const pipelines = await framework.createPipelineDefinitions();

        expect(pipelines.length).toBe(1);
        expect(pipelines[0].filterStack).toContain(HttpGet);
    });
});
```

> **Real tests:** See [decorated-app.spec.ts](../../../flexible-decorators/test/integration-test/decorated-app.spec.ts) for comprehensive tests of the decorators framework.

### Integration Tests

Test with DummyEventSource:

```typescript
import { DummyEventSource } from "flexible-core";

describe("MyFramework Integration", () => {
    it("should handle events", async () => {
        const eventSource = new DummyEventSource();

        const app = FlexibleAppBuilder.instance
            .addEventSource(eventSource)
            .addFramework(myFramework)
            .createApp();

        await app.run();

        const event = {
            eventType: 'test',
            routeData: { method: 'GET' }
        };

        const responses = await eventSource.generateEvent(event);

        expect(responses[0]).toEqual({ success: true });
    });
});
```

> **Real tests:** See [flexible-app.spec.ts](../../test/integration-test/flexible-app.spec.ts) for examples of testing frameworks with DummyEventSource and DummyFramework.

## Best Practices

### 1. Use Dependency Injection

Let users inject dependencies into their handlers:

```typescript
@Controller()
export class UserController {
    constructor(
        @inject(UserService.TYPE) private userService: UserService,
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger
    ) {}
}
```

### 2. Support Extractors

Allow users to extract data from events:

```typescript
@Controller()
export class UserController {
    @Route(HttpPost)
    public createUser(
        @Body() user: User,
        @Param('id') id: string
    ) {
        // user and id are automatically extracted
    }
}
```

### 3. Provide Good Error Messages

```typescript
if (!this.controllerLoader) {
    throw new Error(
        "Controller loader is required. " +
        "Use .withControllerLoader() before calling .build()"
    );
}
```

### 4. Support Async Operations

```typescript
async createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]> {
    // Allow async discovery
    const controllers = await this.discoverControllers();
    // ...
}
```

### 5. Document Your Programming Model

Provide clear examples of how to use your framework:

```typescript
/**
 * Marks a class as a controller.
 *
 * @example
 * ```typescript
 * @Controller()
 * export class UserController {
 *     @Route(HttpGet)
 *     public getUsers() {
 *         return { users: [] };
 *     }
 * }
 * ```
 */
export function Controller(): ClassDecorator {
    // ...
}
```

### 6. Provide Type Safety

Use TypeScript generics and types:

```typescript
export interface ControllerLoader {
    loadControllers(): Function[];
}

export class ExplicitControllerLoader implements ControllerLoader {
    constructor(private controllers: Function[]) {}

    loadControllers(): Function[] {
        return this.controllers;
    }
}
```

## Advanced Features

### Parameter Extraction

Extract parameters from events:

```typescript
private extractParameters(
    controller: Function,
    method: string,
    event: FlexibleEvent,
    context: any
): any[] {
    const paramMetadata = Reflect.getMetadata(
        'flexible:params',
        controller.prototype,
        method
    ) || [];

    return paramMetadata.map((param: ParamMetadata) => {
        switch (param.type) {
            case 'body':
                return event.body;
            case 'param':
                return event.params[param.name];
            case 'query':
                return event.query[param.name];
            case 'context':
                return context[param.name];
            default:
                return undefined;
        }
    });
}
```

### Middleware Support

Allow users to add middleware:

```typescript
@Controller()
@UseMiddleware(AuthMiddleware, LoggingMiddleware)
export class UserController {
    @Route(HttpGet)
    @UseMiddleware(CacheMiddleware)
    public getUsers() {
        // ...
    }
}
```

### Filter Composition

Support complex filter combinations:

```typescript
@Controller()
export class UserController {
    // Both filters must match (AND)
    @Route([HttpGet, AuthFilter])
    public getUsers() { }

    // Either filter can match (OR)
    @Route(HttpGet, HttpPost)
    public handleUser() { }
}
```

## Complete Example

Here's a minimal but complete framework:

```typescript
// simple-framework.ts
import { FlexibleFramework, FlexiblePipelineDocument, ContainerModule } from "flexible-core";

// Metadata storage
const routes = new Map<Function, RouteInfo[]>();

interface RouteInfo {
    method: string;
    path: string;
    handler: Function;
}

// Decorator
export function Route(path: string): MethodDecorator {
    return (target: any, propertyKey: string | symbol) => {
        if (!routes.has(target.constructor)) {
            routes.set(target.constructor, []);
        }
        routes.get(target.constructor)!.push({
            method: propertyKey as string,
            path,
            handler: target[propertyKey]
        });
    };
}

// Framework
export class SimpleFramework implements FlexibleFramework {
    constructor(private controllers: Function[]) {}

    async createPipelineDefinitions(): Promise<FlexiblePipelineDocument[]> {
        const pipelines: FlexiblePipelineDocument[] = [];

        for (const controller of this.controllers) {
            const controllerRoutes = routes.get(controller) || [];

            for (const route of controllerRoutes) {
                pipelines.push({
                    filterStack: [{
                        staticRouting: { path: route.path },
                        filterEvent: null
                    }],
                    middlewareStack: [{
                        activationContext: {
                            activate: async (event, context) => {
                                const instance = new (controller as any)();
                                return instance[route.method](event, context);
                            }
                        },
                        extractorRecipes: {}
                    }]
                });
            }
        }

        return pipelines;
    }

    public get container(): ContainerModule {
        return new ContainerModule(() => {});
    }
}

// Usage
class MyController {
    @Route('/hello')
    public hello() {
        return { message: "Hello!" };
    }
}

const framework = new SimpleFramework([MyController]);
```

## Working Code Examples

The concepts in this guide are proven by real working code:

**Decorators Framework Implementation:**
- [DecoratorsFramework](../../../flexible-decorators/src/framework/decorators-framework.ts) - Complete framework implementation using decorators
- [Controller Decorator](../../../flexible-decorators/src/decorator/controller.ts) - Metadata storage using decorators
- [Route Decorator](../../../flexible-decorators/src/decorator/route.ts) - Route registration with decorators

**Integration Tests:**
- [decorated-app.spec.ts](../../../flexible-decorators/test/integration-test/decorated-app.spec.ts) - Full integration tests showing decorators framework in action
- [test-controllers.ts](../../../flexible-decorators/test/integration-test/test-controllers.ts) - Example controllers used in tests

**Core Framework Tests:**
- [flexible-app.spec.ts](../../test/integration-test/flexible-app.spec.ts) - Tests showing how frameworks integrate with the core system

## See Also

- [Architecture: Frameworks](../architecture/frameworks.md)
- [API Reference: FlexibleFramework](../api/flexible-framework.md)
- [Example: Decorators Framework](https://github.com/ftacchini/flexible-decorators)
- [Guide: Creating Event Sources](creating-event-source.md)
