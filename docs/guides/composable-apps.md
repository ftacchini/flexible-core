# Composable Applications

This guide shows you how to build composable applications using Flexible's layered architecture pattern.

## Table of Contents

- [What are Composable Applications?](#what-are-composable-applications)
- [Architecture Pattern](#architecture-pattern)
- [Key Component: DelegateEventSource](#key-component-delegateeeventsource)
- [Step-by-Step Guide](#step-by-step-guide)
- [Real Example: Security Layers](#real-example-security-layers)
- [Testing Composable Apps](#testing-composable-apps)
- [Best Practices](#best-practices)

## What are Composable Applications?

Composable applications are multiple FlexibleApp instances that work together by forwarding events to each other. Instead of adding all middleware to a single app, you create separate apps for different concerns:

```
HTTP Request → Security App → Business App
                (rate limit)    (your code)
```

**Benefits:**
- **Separation of concerns**: Each layer has a single responsibility
- **Reusable**: Package layers as npm modules
- **Testable**: Test each layer independently
- **Flexible**: Different routes can go to different layers
- **No framework changes**: Uses existing controller patterns

## Architecture Pattern

### Traditional Approach

```typescript
// Everything in one app
const app = FlexibleAppBuilder.instance
    .addFramework(framework)
    .addEventSource(httpSource)
    .createApp();

// Middleware mixed with business logic
@Controller()
export class UserController {
    @BeforeExecution(RateLimitMiddleware, 'check')
    @BeforeExecution(AuthMiddleware, 'check')
    @Route(HttpGet)
    public getUsers() { }
}
```

### Composable Approach

```typescript
// Separate apps for different concerns
const businessApp = FlexibleAppBuilder.instance
    .addFramework(businessFramework)
    .addEventSource(new DelegateEventSource())
    .createApp();

const securityApp = FlexibleAppBuilder.instance
    .addFramework(securityFramework)
    .addEventSource(httpSource)
    .createApp();

// Security layer forwards to business layer
@Controller()
export class SecurityController {
    @BeforeExecution(RateLimitMiddleware, 'check')
    @Route(Everything)
    public async processAll(@Param(EventData) event: FlexibleEvent) {
        return await businessApp.eventSource.generateEvent(event);
    }
}
```

## Key Component: DelegateEventSource

`DelegateEventSource` is the glue that connects composable apps. It's an event source that can be triggered programmatically:

```typescript
import { DelegateEventSource } from 'flexible-core';

// Create an app with DelegateEventSource
const app = FlexibleAppBuilder.instance
    .addFramework(framework)
    .addEventSource(new DelegateEventSource())
    .createApp();

await app.run();

// Trigger events programmatically
const responses = await app.eventSource.generateEvent(event);
```

**Key Features:**
- Implements `FlexibleEventSource` interface
- Can be triggered via `generateEvent(event)`
- Works with any event type (HTTP, WebSocket, custom)
- Lightweight and fast

## Step-by-Step Guide

### Step 1: Create the Business Logic App

Start with your business logic as a separate app:

```typescript
import { FlexibleAppBuilder, DelegateEventSource } from 'flexible-core';
import { DecoratorsFrameworkModuleBuilder, ExplicitControllerLoader } from 'flexible-decorators';

// Business controllers
@Controller()
export class UserController {
    @Route(HttpGet)
    public getUsers() {
        return { users: ['Alice', 'Bob'] };
    }
}

// Create business app
const businessApp = FlexibleAppBuilder.instance
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                UserController
            ]))
            .build()
    )
    .addEventSource(new DelegateEventSource())
    .createApp();

await businessApp.run();
```

### Step 2: Create a Security Layer

Create a security layer that forwards to the business app:

```typescript
import { Everything, EventData } from 'flexible-core';
import { Controller, Route, BeforeExecution, Param } from 'flexible-decorators';

@Controller()
export class SecurityController {
    constructor(
        @inject(BUSINESS_APP_EVENT_SOURCE)
        private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(RateLimitMiddleware, 'check', {
        config: { max: 100, windowMs: 60000 }
    })
    @Route(Everything)  // Match ALL events
    public async processAll(@Param(EventData) event: FlexibleEvent) {
        // Forward to business layer
        return await this.nextLayer.generateEvent(event);
    }
}
```

### Step 3: Wire the Layers Together

Connect the layers using dependency injection:

```typescript
import { DependencyContainer } from 'tsyringe';
import { FlexibleModule } from 'flexible-core';

// Define DI token
export const BUSINESS_APP_EVENT_SOURCE = Symbol('BusinessAppEventSource');

// Create module that binds the business app's event source
const securityModule: FlexibleModule = {
    register(container: DependencyContainer): void {
        container.register(BUSINESS_APP_EVENT_SOURCE, {
            useValue: businessApp.eventSource
        });
    }
};

// Create security app with the module
const securityApp = FlexibleAppBuilder.instance
    .addModule(securityModule)
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                SecurityController
            ]))
            .build()
    )
    .addEventSource(new HttpModule(3000))  // Real HTTP source
    .createApp();

await securityApp.run();
```

### Step 4: Test It

```bash
curl http://localhost:3000/users
# {"users":["Alice","Bob"]}

# After 100 requests in 1 minute:
# HTTP 429 Too Many Requests
```

## Real Example: Security Layers

Here's a complete example with multiple security layers:

```typescript
import "reflect-metadata";
import {
    FlexibleAppBuilder,
    DelegateEventSource,
    RateLimitMiddleware,
    Everything,
    EventData
} from "flexible-core";
import {
    DecoratorsFrameworkModuleBuilder,
    ExplicitControllerLoader,
    Controller,
    Route,
    BeforeExecution,
    Param
} from "flexible-decorators";
import { HttpModuleBuilder, HttpGet } from "flexible-http";
import { DependencyContainer } from "tsyringe";
import { inject } from "tsyringe";

// DI Tokens
const BUSINESS_LAYER = Symbol('BusinessLayer');
const AUTH_LAYER = Symbol('AuthLayer');

// ============================================
// Layer 3: Business Logic
// ============================================

@Controller()
class UserController {
    @Route(HttpGet)
    public getUsers() {
        return { users: ['Alice', 'Bob', 'Charlie'] };
    }

    @Route(HttpGet)
    public getProfile() {
        return { name: 'Alice', email: 'alice@example.com' };
    }
}

const businessApp = FlexibleAppBuilder.instance
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                UserController
            ]))
            .build()
    )
    .addEventSource(new DelegateEventSource())
    .createApp();

// ============================================
// Layer 2: Authentication
// ============================================

@Controller()
class AuthController {
    constructor(
        @inject(BUSINESS_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async authenticate(@Param(EventData) event: any) {
        // Check authentication
        const token = event.headers?.['authorization'];
        if (!token) {
            return { error: 'Unauthorized', statusCode: 401 };
        }

        // Forward to business layer
        return await this.nextLayer.generateEvent(event);
    }
}

const authModule = {
    container: new ContainerModule((bind) => {
        bind(BUSINESS_LAYER).toConstantValue(businessApp.eventSource);
    })
};

const authApp = FlexibleAppBuilder.instance
    .addModule(authModule)
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                AuthController
            ]))
            .build()
    )
    .addEventSource(new DelegateEventSource())
    .createApp();

// ============================================
// Layer 1: Rate Limiting (Entry Point)
// ============================================

@Controller()
class RateLimitController {
    constructor(
        @inject(AUTH_LAYER) private nextLayer: DelegateEventSource
    ) {}

    @BeforeExecution(RateLimitMiddleware, 'check', {
        config: { max: 100, windowMs: 60000 }
    })
    @Route(Everything)
    public async rateLimit(@Param(EventData) event: any) {
        // Forward to auth layer
        return await this.nextLayer.generateEvent(event);
    }
}

const rateLimitModule = {
    container: new ContainerModule((bind) => {
        bind(AUTH_LAYER).toConstantValue(authApp.eventSource);
    })
};

const rateLimitApp = FlexibleAppBuilder.instance
    .addModule(rateLimitModule)
    .addFramework(
        DecoratorsFrameworkModuleBuilder.instance
            .withControllerLoader(new ExplicitControllerLoader([
                RateLimitController
            ]))
            .build()
    )
    .addEventSource(HttpModuleBuilder.instance.withPort(3000).build())
    .createApp();

// ============================================
// Start All Apps
// ============================================

async function start() {
    await businessApp.run();
    await authApp.run();
    await rateLimitApp.run();

    console.log('Server running on http://localhost:3000');
    console.log('Architecture: HTTP → Rate Limit → Auth → Business');
}

start();
```

## Testing Composable Apps

### Unit Testing Individual Layers

Test each layer independently:

```typescript
describe("SecurityController", () => {
    it("should forward events to next layer", async () => {
        const mockEventSource = {
            generateEvent: jasmine.createSpy('generateEvent')
                .and.returnValue(Promise.resolve([{ success: true }]))
        };

        const controller = new SecurityController(mockEventSource as any);
        const event = { eventType: 'test' };

        await controller.processAll(event);

        expect(mockEventSource.generateEvent).toHaveBeenCalledWith(event);
    });
});
```

### Integration Testing the Full Stack

Test the complete flow:

```typescript
describe("Composable App Integration", () => {
    let businessApp: FlexibleApp;
    let securityApp: FlexibleApp;

    beforeEach(async () => {
        // Set up apps
        businessApp = FlexibleAppBuilder.instance
            .addFramework(businessFramework)
            .addEventSource(new DelegateEventSource())
            .createApp();

        securityApp = FlexibleAppBuilder.instance
            .addModule(createSecurityModule(businessApp.eventSource))
            .addFramework(securityFramework)
            .addEventSource(new DelegateEventSource())
            .createApp();

        await businessApp.run();
        await securityApp.run();
    });

    it("should process events through all layers", async () => {
        const event = { eventType: 'test', path: '/users' };
        const responses = await securityApp.eventSource.generateEvent(event);

        expect(responses[0]).toEqual({ users: ['Alice', 'Bob'] });
    });
});
```

## Best Practices

### 1. Use Dependency Injection for Layer Connections

```typescript
// Good: Use DI tokens
const NEXT_LAYER = Symbol('NextLayer');

const module = {
    container: new ContainerModule((bind) => {
        bind(NEXT_LAYER).toConstantValue(nextApp.eventSource);
    })
};
```

### 2. Match All Events in Forwarding Controllers

```typescript
// Use Everything filter to match all events
@Route(Everything)
public async forward(@Param(EventData) event: FlexibleEvent) {
    return await this.nextLayer.generateEvent(event);
}
```

### 3. Start Apps in Reverse Order

```typescript
// Start from innermost to outermost
await businessApp.run();
await authApp.run();
await rateLimitApp.run();  // Entry point starts last
```

### 4. Handle Errors at Each Layer

```typescript
@Route(Everything)
public async processWithErrorHandling(@Param(EventData) event: any) {
    try {
        return await this.nextLayer.generateEvent(event);
    } catch (error) {
        // Log and transform error
        this.logger.error('Layer error', error);
        return { error: 'Internal error', statusCode: 500 };
    }
}
```

### 5. Keep Layers Focused

Each layer should have a single responsibility:
- **Rate limiting layer**: Only rate limiting
- **Auth layer**: Only authentication/authorization
- **Business layer**: Only business logic

### 6. Make Layers Reusable

Package common layers as npm modules:

```typescript
// @mycompany/flexible-security-layer
export function createSecurityLayer(nextLayer: DelegateEventSource) {
    return FlexibleAppBuilder.instance
        .addModule(createSecurityModule(nextLayer))
        .addFramework(securityFramework)
        .addEventSource(new DelegateEventSource())
        .createApp();
}
```

## Advanced Patterns

### Conditional Routing

Route different events to different layers:

```typescript
@Controller()
class RouterController {
    constructor(
        @inject(PUBLIC_LAYER) private publicLayer: DelegateEventSource,
        @inject(ADMIN_LAYER) private adminLayer: DelegateEventSource
    ) {}

    @Route(Everything)
    public async route(@Param(EventData) event: any) {
        if (event.path?.startsWith('/admin')) {
            return await this.adminLayer.generateEvent(event);
        }
        return await this.publicLayer.generateEvent(event);
    }
}
```

### Layer Composition

Compose layers dynamically:

```typescript
function createAppStack(layers: LayerConfig[]) {
    let currentEventSource: DelegateEventSource | undefined;

    // Build from innermost to outermost
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        const app = FlexibleAppBuilder.instance
            .addModule(layer.createModule(currentEventSource))
            .addFramework(layer.framework)
            .addEventSource(
                i === 0 ? layer.entryEventSource : new DelegateEventSource()
            )
            .createApp();

        currentEventSource = app.eventSource as DelegateEventSource;
    }

    return currentEventSource;
}
```

### Parallel Processing

Process events through multiple layers in parallel:

```typescript
@Route(Everything)
public async processParallel(@Param(EventData) event: any) {
    const [cacheResult, businessResult] = await Promise.all([
        this.cacheLayer.generateEvent(event),
        this.businessLayer.generateEvent(event)
    ]);

    return cacheResult || businessResult;
}
```

## See Also

- [DelegateEventSource API](../api/delegate-event-source.md)
- [Creating Event Sources](creating-event-source.md)
- [Creating Frameworks](creating-framework.md)
- [Security Best Practices](../security.md)
