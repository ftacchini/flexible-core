# Design Patterns

Flexible uses several key design patterns to achieve its goals of modularity, performance, and extensibility.

## 1. Dependency Injection

Flexible uses [TSyringe](https://github.com/microsoft/tsyringe) for dependency injection throughout the framework.

### Pattern

```typescript
@injectable()
export class UserController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(UserService.TYPE) private userService: UserService
    ) {}

    async getUser(userId: string) {
        this.logger.info('Fetching user', { userId });
        return await this.userService.findById(userId);
    }
}
```

### Benefits

- **Testability**: Easy to mock dependencies
- **Flexibility**: Swap implementations without changing code
- **Decoupling**: Components don't know about concrete implementations
- **Lifecycle Management**: Singleton, transient, and request-scoped instances

### Usage in Flexible

- All framework components use DI
- Modules register bindings in TSyringe containers
- Controllers and services receive dependencies via constructor injection

**See:** [Modules](modules.md)

## 2. Module System

Everything in Flexible is a module that can be composed.

### Pattern

```typescript
const app = FlexibleAppBuilder.instance
    .withLogger(loggerModule)      // Logger module
    .addModule(databaseModule)     // Custom module
    .addModule(cacheModule)        // Custom module
    .addEventSource(httpModule)    // Event source module
    .addFramework(decoratorModule) // Framework module
    .createApp();
```

### Benefits

- **Composability**: Mix and match modules
- **Reusability**: Modules can be shared across projects
- **Isolation**: Each module manages its own dependencies
- **Extensibility**: Easy to add new modules

### Module Types

1. **Logger Modules**: Provide logging implementations
2. **Router Modules**: Provide routing strategies
3. **Framework Modules**: Provide application structure
4. **Event Source Modules**: Provide event inputs
5. **Custom Modules**: Provide application-specific dependencies

**See:** [Modules](modules.md)

## 3. Filter Cascade

Filters are chained to create complex routing logic.

### Pattern

```typescript
// All must match (AND logic)
filters: [HttpGet, PathFilter('/users'), AuthFilter]

// Alternatives (OR logic)
filters: [
  [HttpGet, PathFilter('/users')],
  [HttpPost, PathFilter('/users')]
]

// Complex combinations
filters: [
  HttpGet,
  [PathFilter('/users'), PathFilter('/accounts')],
  AuthFilter
]
```

### Benefits

- **Expressiveness**: Complex routing rules with simple syntax
- **Performance**: Short-circuit evaluation
- **Reusability**: Filters can be shared across routes
- **Composability**: Build complex logic from simple filters

### Filter Types

- **Static Filters**: Evaluated during route registration (e.g., `HttpGet`)
- **Dynamic Filters**: Evaluated at request time (e.g., `AuthFilter`)

**See:** [Tree Router](tree-router.md)

## 4. Binnacle Pattern

Context is passed through the pipeline using "binnacles" (storage containers).

### Pattern

```typescript
// Extractor populates context
export class ParamsExtractor implements FlexibleExtractor {
    extract(event: FlexibleEvent, contextBinnacle: any) {
        contextBinnacle.params = extractParams(event.routeData.path);
    }
}

// Middleware uses context
export class UserController {
    @Route(HttpGet, PathFilter('/users/:id'))
    async getUser(contextBinnacle: any) {
        const userId = contextBinnacle.params.id;
        return await this.userService.findById(userId);
    }
}
```

### Two Types of Binnacles

#### Filter Binnacle
Stores filter evaluation results:

```typescript
filterBinnacle = {
  'HttpGet': true,
  'PathFilter(/users/:id)': true,
  'AuthFilter': true
}
```

#### Context Binnacle
Stores extracted data and state:

```typescript
contextBinnacle = {
  params: { id: '123' },
  query: { include: 'posts' },
  body: { name: 'John' },
  user: { id: '456', role: 'admin' }
}
```

### Benefits

- **Simplicity**: Plain JavaScript objects
- **Performance**: No overhead from complex context objects
- **Flexibility**: Store any data structure
- **Immutability**: Each request gets its own binnacles

**See:** [Request Flow](request-flow.md)

## 5. Provider Pattern

Modules provide instances through a consistent interface.

### Pattern

```typescript
interface FlexibleProvider<T> {
    getInstance(container: Container): T;
}

export class ConsoleLoggerModule implements FlexibleLoggerModule {
    public getInstance(container: Container): FlexibleLogger {
        return container.get(FlexibleConsoleLogger.TYPE);
    }
}
```

### Benefits

- **Consistency**: All modules provide instances the same way
- **Lazy Loading**: Instances created only when needed
- **Container Access**: Providers can resolve dependencies
- **Type Safety**: Generic type ensures correct instance type

**See:** [Modules](modules.md)

## 6. Builder Pattern

Application configuration uses the builder pattern.

### Pattern

```typescript
const app = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .addModule(userServiceModule)
    .addModule(databaseModule)
    .addFramework(decoratorFrameworkModule)
    .addEventSource(httpEventSourceModule)
    .createApp();
```

### Benefits

- **Fluent API**: Readable configuration
- **Validation**: Builder validates configuration before creating app
- **Immutability**: Builder doesn't modify existing configuration
- **Flexibility**: Optional and required configuration

## 7. Strategy Pattern

Different implementations can be swapped without changing code.

### Pattern

```typescript
// Development: Console logger
const devApp = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .createApp();

// Production: Structured logger
const prodApp = FlexibleAppBuilder.instance
    .withLogger(new ConfigurableLoggerModule({
        minLevel: LogLevel.INFO,
        format: 'json'
    }))
    .createApp();

// Testing: Silent logger
const testApp = FlexibleAppBuilder.instance
    .withLogger(new SilentLoggerModule())
    .createApp();
```

### Benefits

- **Flexibility**: Swap implementations at runtime
- **Testability**: Use test doubles easily
- **Environment-Specific**: Different strategies per environment

### Used For

- Logging strategies (console, silent, configurable)
- Routing strategies (tree router, custom routers)
- Framework strategies (decorators, custom frameworks)

## 8. Middleware Chain Pattern

Requests flow through a chain of middleware.

### Pattern

```typescript
pipeline = {
  middleware: [
    AuthMiddleware,           // 1. Authenticate
    ValidationMiddleware,     // 2. Validate
    RateLimitMiddleware,      // 3. Check rate limit
    UserController.getUser    // 4. Handle request
  ]
}
```

### Benefits

- **Separation of Concerns**: Each middleware has one responsibility
- **Reusability**: Middleware can be shared across routes
- **Composability**: Build complex behavior from simple pieces
- **Order Control**: Explicit execution order

**See:** [Request Flow](request-flow.md)

## 9. Lazy Initialization

Resources are created only when needed.

### Pattern

```typescript
// Decision tree nodes created lazily
class TreeNode {
    private _children?: Map<string, TreeNode>;

    get children(): Map<string, TreeNode> {
        if (!this._children) {
            this._children = new Map();
        }
        return this._children;
    }
}
```

### Benefits

- **Memory Efficiency**: Don't allocate unused resources
- **Startup Performance**: Faster application startup
- **Scalability**: Memory usage grows with actual usage

### Used For

- Decision tree nodes
- Module instances
- Route registrations

## 10. Isolated Container Pattern

Framework and event source modules have isolated containers.

### Pattern

```typescript
export interface FlexibleFrameworkModule extends FlexibleModule {
    readonly container: ContainerModule;          // Shared bindings
    readonly isolatedContainer: ContainerModule;  // Framework-specific bindings
}
```

### Benefits

- **Isolation**: Framework dependencies don't leak to other components
- **Flexibility**: Multiple frameworks can coexist
- **Clean Separation**: Core vs framework-specific dependencies

**See:** [Modules](modules.md)

## Extension Points

These patterns enable extension at multiple points:

1. **Custom Event Sources**: Implement `FlexibleEventSource`
2. **Custom Frameworks**: Implement `FlexibleFramework`
3. **Custom Routers**: Implement `FlexibleRouter`
4. **Custom Loggers**: Implement `FlexibleLogger`
5. **Custom Filters**: Implement `FlexibleFilter`
6. **Custom Extractors**: Implement `FlexibleExtractor`
7. **Custom Middleware**: Implement middleware function
8. **Custom Modules**: Implement `FlexibleModule`

## See Also

- [Modules](modules.md) - Module system details
- [Components](components.md) - Component architecture
- [Request Flow](request-flow.md) - How patterns work together
- [Composable Architecture](../guides/composable-apps.md) - Building with patterns
