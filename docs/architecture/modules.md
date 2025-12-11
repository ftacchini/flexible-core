# Modules

Flexible uses a modular architecture where all components are packaged as modules. Modules encapsulate dependencies and provide instances through dependency injection using TSyringe.

## Module Structure

Every module implements the `FlexibleModule` interface:

```typescript
interface FlexibleModule {
    register(container: DependencyContainer): void;  // TSyringe registration
}
```

Most modules also implement `FlexibleProvider<T>` to provide instances:

```typescript
interface FlexibleProvider<T> {
    getInstance(container: Container): T;
}
```

## Module Types

### 1. Logger Modules

**Interface:** `FlexibleLoggerModule extends FlexibleModule, FlexibleProvider<FlexibleLogger>`

**What Gets Injected:**
- `FlexibleLogger` implementation (console, silent, or configurable)
- Console instance (for logger implementations)
- Logger configuration (for configurable logger)

**Built-in Implementations:**
- `ConsoleLoggerModule` - Logs to console
- `SilentLoggerModule` - No-op logger for testing
- `ConfigurableLoggerModule` - Configurable log levels

**Example:**
```typescript
const app = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .createApp();
```

**See:** [Logging Guide](../guides/logging.md)

### 2. Router Modules

**Interface:** `FlexibleRouterModule<Resource> extends FlexibleModule, FlexibleProvider<FlexibleRouter<Resource>>`

**What Gets Injected:**
- `FlexibleRouter<Resource>` implementation
- `RouteDataHelper` - Helper for route data manipulation
- `FilterCascadeBuilder` - Builds filter chains

**Built-in Implementations:**
- `FlexibleTreeRouterModule<Resource>` - Decision tree-based router

**Example:**
```typescript
const routerModule = new FlexibleTreeRouterModule<FlexiblePipeline>();
```

**See:** [Creating Routers Guide](../guides/creating-router.md)

### 3. Framework Modules

**Interface:** `FlexibleFrameworkModule extends FlexibleModule, FlexibleProvider<FlexibleFramework>`

**What Gets Injected:**
- `FlexibleFramework` implementation
- Framework-specific dependencies (controllers, metadata readers, etc.)
- `isolatedContainer` - Additional container for framework-specific bindings

**Built-in Implementations:**
- [flexible-decorators](https://github.com/ftacchini/flexible-decorators) - Decorator-based framework

**Example:**
```typescript
const app = FlexibleAppBuilder.instance
    .addFramework(decoratorFrameworkModule)
    .createApp();
```

**Note:** Framework modules have an `isolatedContainer` property that provides additional bindings specific to that framework, keeping framework dependencies separate from core dependencies.

**See:** [Creating Frameworks Guide](../guides/creating-framework.md)

### 4. Event Source Modules

**Interface:** `FlexibleEventSourceModule extends FlexibleModule, FlexibleProvider<FlexibleEventSource>`

**What Gets Injected:**
- `FlexibleEventSource` implementation
- Event source-specific dependencies (server, adapters, etc.)
- `isolatedContainer` - Additional container for event source-specific bindings

**Built-in Implementations:**
- [flexible-http](https://github.com/ftacchini/flexible-http) - HTTP/HTTPS event source

**Example:**
```typescript
const app = FlexibleAppBuilder.instance
    .addEventSource(httpEventSourceModule)
    .createApp();
```

**Note:** Event source modules have an `isolatedContainer` property for event source-specific bindings, similar to framework modules.

**See:** [Creating Event Sources Guide](../guides/creating-event-source.md)

### 5. Generic Modules

**Interface:** `FlexibleModule`

**What Gets Injected:**
- Custom dependencies specific to your application
- Services, repositories, utilities, etc.

**Example:**
```typescript
const customModule = new ContainerModule((bind) => {
    bind(UserService.TYPE).to(UserService).inSingletonScope();
    bind(DatabaseConnection.TYPE).toConstantValue(dbConnection);
});

const app = FlexibleAppBuilder.instance
    .addModule({ container: customModule })
    .createApp();
```

## Module Composition

Modules are composed together when building the application:

```typescript
const app = FlexibleAppBuilder.instance
    // Required: Logger module
    .withLogger(new ConsoleLoggerModule())

    // Optional: Custom modules for your dependencies
    .addModule(userServiceModule)
    .addModule(databaseModule)

    // Required: At least one framework
    .addFramework(decoratorFrameworkModule)

    // Required: At least one event source
    .addEventSource(httpEventSourceModule)

    .createApp();
```

## Dependency Injection Flow

1. **Module Registration**: Each module's `register()` method is called to register bindings in the TSyringe container
2. **Isolated Containers**: Framework and event source modules use child containers via `registerIsolated()` for isolation
3. **Instance Creation**: When needed, `getInstance(container)` is called to retrieve the module's main instance
4. **Dependency Resolution**: TSyringe resolves all dependencies automatically, with child containers inheriting parent bindings

## Creating Custom Modules

To create a custom module:

```typescript
import { DependencyContainer } from "tsyringe";
import { FlexibleModule } from "flexible-core";

export class MyCustomModule implements FlexibleModule {
    public register(container: DependencyContainer): void {
        // Register your dependencies
        if (!container.isRegistered(MyService.TYPE)) {
            container.register(MyService.TYPE, { useClass: MyService });

            isBound(MyRepository.TYPE) ||
                bind(MyRepository.TYPE).to(MyRepository);
        });
    }
}
```

**Best Practices:**
- Check `isBound()` before binding to avoid conflicts
- Use symbols as type identifiers (e.g., `MyService.TYPE`)
- Use `.inSingletonScope()` for stateless services
- Keep module dependencies minimal and focused

## Module Loading Order

Modules are loaded in this order:

1. Logger module (if provided)
2. Custom modules (via `addModule()`)
3. Router module (internal)
4. Framework modules (via `addFramework()`)
5. Event source modules (via `addEventSource()`)

This ensures that:
- Logging is available to all components
- Custom services are available before frameworks initialize
- Frameworks can use all registered dependencies
- Event sources can access the fully configured system

## See Also

- [Components](components.md) - What modules provide
- [Design Patterns](design-patterns.md) - Dependency injection pattern
- [Composable Architecture](../guides/composable-apps.md) - Building with modules
