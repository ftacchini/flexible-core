# Composable Architecture Pattern

## Overview

The **composable architecture pattern** allows you to build security layers, middleware layers, and business logic as separate FlexibleApp instances that forward events to each other. This pattern uses existing framework features (controllers, routes, middleware) without requiring new framework concepts.

## Architecture

```
HTTP Request → Security App → HTTP Security App → Business App
                (rate limit)    (headers, CORS)     (your code)
```

Each layer is a FlexibleApp with controllers that forward to the next layer via `DelegateEventSource`.

## Key Components

### DelegateEventSource

`DelegateEventSource` is a production-ready event source designed for composable architectures. Unlike real event sources (HTTP, WebSocket), it doesn't listen to external events. Instead, it receives events programmatically via its `generateEvent()` method.

```typescript
import { DelegateEventSource } from 'flexible-core';

// Create an app with DelegateEventSource
const app = FlexibleAppBuilder.instance
    .addFramework(decoratorsFramework)
    .addEventSource(new DelegateEventSource())
    .createApp();

await app.run();

// Now you can programmatically send events to this app
const delegateSource = app.eventSources[0] as DelegateEventSource;
const responses = await delegateSource.generateEvent(myEvent);
```

### Middleware Controllers

Middleware controllers are regular controllers that:
1. Match events using `@Route`
2. Apply middleware using `@BeforeExecution`
3. Forward events to the next layer

## Dependency Injection Strategy

There are three approaches to inject the downstream DelegateEventSource into upstream controllers:

### Approach 1: Custom Module (Recommended)

Create a custom module that binds the DelegateEventSource instance:

```typescript
import { ContainerModule } from 'inversify';
import { DelegateEventSource } from 'flexible-core';

// Define a DI token
export const NEXT_LAYER = Symbol('NextLayer');

// Create a module that binds the downstream event source
export function createNextLayerModule(nextLayer: DelegateEventSource): ContainerModule {
    return new ContainerModule((bind) => {
        bind<DelegateEventSource>(NEXT_LAYER).toConstantValue(nextLayer);
    });
}
```

Then use it in your controller:

```typescript
import { Controller, Route } from 'flexible-decorators';
import { inject } from 'inversify';
import { NEXT_LAYER } from './next-layer-module';

@Controller()
export class SecurityMiddlewareController {
    constructor(
        @inject(NEXT_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async processAll(@Param(EventData) event: FlexibleEvent) {
        // Apply security checks...

        // Forward to next layer
        return await this.nextLayer.generateEvent(event);
    }
}
```

Wire it all together:

```typescript
// 1. Create downstream app (business logic)
const businessApp = FlexibleAppBuilder.instance
    .addFramework(businessFramework)
    .addEventSource(new DelegateEventSource())
    .createApp();

await businessApp.run();

// 2. Get the DelegateEventSource from the business app
const businessEventSource = businessApp.eventSources[0] as DelegateEventSource;

// 3. Create the next layer module
const nextLayerModule = createNextLayerModule(businessEventSource);

// 4. Create upstream app (security layer)
const securityFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([SecurityMiddlewareController]))
    .withDependencies([nextLayerModule])  // Inject the module
    .build();

const securityApp = FlexibleAppBuilder.instance
    .addFramework(securityFramework)
    .addEventSource(new HttpModule(3000))  // Real HTTP source
    .createApp();

await securityApp.run();
```

### Approach 2: Factory Pattern

Use a factory to create controllers with the dependency:

```typescript
export class SecurityMiddlewareControllerFactory {
    public static create(nextLayer: DelegateEventSource): SecurityMiddlewareController {
        return new SecurityMiddlewareController(nextLayer);
    }
}

// Usage
const businessEventSource = businessApp.eventSources[0] as DelegateEventSource;
const controller = SecurityMiddlewareControllerFactory.create(businessEventSource);

const securityFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([controller]))
    .build();
```

### Approach 3: Direct Instantiation

For simple cases, instantiate the controller directly:

```typescript
const businessEventSource = businessApp.eventSources[0] as DelegateEventSource;
const controller = new SecurityMiddlewareController(businessEventSource);

const securityFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([controller]))
    .build();
```

## Complete Example

Here's a complete three-layer example:

```typescript
import "reflect-metadata";
import {
    FlexibleAppBuilder,
    DelegateEventSource,
    FlexibleEvent
} from 'flexible-core';
import {
    Controller,
    Route,
    Param,
    EventData,
    Everything,
    DecoratorsFrameworkModuleBuilder,
    ExplicitControllerLoader
} from 'flexible-decorators';
import { HttpModuleBuilder } from 'flexible-http';
import { inject } from 'inversify';
import { ContainerModule } from 'inversify';

// ============================================================================
// 1. Define DI Token and Module
// ============================================================================

const NEXT_LAYER = Symbol('NextLayer');

function createNextLayerModule(nextLayer: DelegateEventSource): ContainerModule {
    return new ContainerModule((bind) => {
        bind<DelegateEventSource>(NEXT_LAYER).toConstantValue(nextLayer);
    });
}

// ============================================================================
// 2. Business Logic Layer (innermost)
// ============================================================================

@Controller()
class BusinessController {
    @Route(Everything)
    public async handleRequest(@Param(EventData) event: FlexibleEvent) {
        return {
            status: 200,
            body: { message: 'Hello from business logic!' }
        };
    }
}

// ============================================================================
// 3. HTTP Security Layer (middle)
// ============================================================================

@Controller()
class HttpSecurityController {
    constructor(
        @inject(NEXT_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async addSecurityHeaders(@Param(EventData) event: FlexibleEvent) {
        // Add security headers to the event
        event.data.securityHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        };

        // Forward to business layer
        return await this.nextLayer.generateEvent(event);
    }
}

// ============================================================================
// 4. App Security Layer (outermost)
// ============================================================================

@Controller()
class AppSecurityController {
    constructor(
        @inject(NEXT_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async checkRateLimit(@Param(EventData) event: FlexibleEvent) {
        // Check rate limit (simplified)
        const clientId = event.data.clientId || 'unknown';
        console.log(`Rate limit check for client: ${clientId}`);

        // Forward to HTTP security layer
        return await this.nextLayer.generateEvent(event);
    }
}

// ============================================================================
// 5. Wire Everything Together
// ============================================================================

async function createComposableApp() {
    // Layer 1: Business Logic (innermost)
    const businessFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([BusinessController]))
        .build();

    const businessApp = FlexibleAppBuilder.instance
        .addFramework(businessFramework)
        .addEventSource(new DelegateEventSource())
        .createApp();

    await businessApp.run();
    const businessEventSource = businessApp.eventSources[0] as DelegateEventSource;

    // Layer 2: HTTP Security (middle)
    const httpSecurityFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([HttpSecurityController]))
        .withDependencies([createNextLayerModule(businessEventSource)])
        .build();

    const httpSecurityApp = FlexibleAppBuilder.instance
        .addFramework(httpSecurityFramework)
        .addEventSource(new DelegateEventSource())
        .createApp();

    await httpSecurityApp.run();
    const httpSecurityEventSource = httpSecurityApp.eventSources[0] as DelegateEventSource;

    // Layer 3: App Security (outermost)
    const appSecurityFramework = DecoratorsFrameworkModuleBuilder.instance
        .withControllerLoader(new ExplicitControllerLoader([AppSecurityController]))
        .withDependencies([createNextLayerModule(httpSecurityEventSource)])
        .build();

    const appSecurityApp = FlexibleAppBuilder.instance
        .addFramework(appSecurityFramework)
        .addEventSource(HttpModuleBuilder.instance.withPort(3000).build())
        .createApp();

    await appSecurityApp.run();

    return appSecurityApp;
}

// Run the app
createComposableApp().then(() => {
    console.log('Composable app running on port 3000');
});
```

## Benefits

1. **Security by composition** - Stack security layers as needed
2. **Reusable** - Security layers can be npm packages
3. **Testable** - Each layer tested independently
4. **Flexible** - Different routes can go to different layers
5. **No framework changes** - Uses existing patterns
6. **Type-safe** - Full TypeScript support

## Testing

Each layer can be tested independently:

```typescript
describe('HttpSecurityController', () => {
    it('should add security headers', async () => {
        // Create a mock next layer
        const mockNextLayer = new DelegateEventSource();
        mockNextLayer.onEvent(async (event) => {
            // Verify headers were added
            expect(event.data.securityHeaders).toBeDefined();
            return [{ status: 200, body: {} }];
        });

        await mockNextLayer.run();

        // Create controller with mock
        const controller = new HttpSecurityController(mockNextLayer);

        // Test the controller
        const event = { data: {}, type: 'test' };
        await controller.addSecurityHeaders(event);
    });
});
```

## Best Practices

1. **Keep layers focused** - Each layer should have a single responsibility
2. **Use meaningful names** - Name your DI tokens clearly (e.g., `BUSINESS_LAYER`, `SECURITY_LAYER`)
3. **Document dependencies** - Make it clear which layer depends on which
4. **Test independently** - Write tests for each layer in isolation
5. **Consider performance** - Each layer adds latency, so keep them lightweight
6. **Handle errors** - Each layer should handle errors appropriately
7. **Log at boundaries** - Log when events enter/exit layers for debugging

## Common Patterns

### Conditional Forwarding

Forward only certain events to the next layer:

```typescript
@Controller()
class ConditionalController {
    constructor(@inject(NEXT_LAYER) private nextLayer: DelegateEventSource) {}

    @Route(Everything)
    public async process(@Param(EventData) event: FlexibleEvent) {
        if (event.type === 'public') {
            // Handle public events directly
            return { status: 200, body: { message: 'Public endpoint' } };
        }

        // Forward private events to next layer
        return await this.nextLayer.generateEvent(event);
    }
}
```

### Multiple Downstream Layers

Route to different layers based on event type:

```typescript
@Controller()
class RouterController {
    constructor(
        @inject(API_LAYER) private apiLayer: DelegateEventSource,
        @inject(ADMIN_LAYER) private adminLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async route(@Param(EventData) event: FlexibleEvent) {
        if (event.data.path?.startsWith('/admin')) {
            return await this.adminLayer.generateEvent(event);
        }

        return await this.apiLayer.generateEvent(event);
    }
}
```

### Error Handling Layer

Add a layer that catches and transforms errors:

```typescript
@Controller()
class ErrorHandlingController {
    constructor(@inject(NEXT_LAYER) private nextLayer: DelegateEventSource) {}

    @Route(Everything)
    public async handleErrors(@Param(EventData) event: FlexibleEvent) {
        try {
            return await this.nextLayer.generateEvent(event);
        } catch (error) {
            // Transform error into user-friendly response
            return {
                status: 500,
                body: { error: 'Internal server error' }
            };
        }
    }
}
```

## See Also

- [Creating Event Sources](./creating-event-source.md)
- [Creating Frameworks](./creating-framework.md)
- [Security Guide](../security.md)
