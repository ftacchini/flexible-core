# Architecture Overview

Flexible is an event processing framework that connects **Event Sources** to **Frameworks** through a flexible routing system.

## Core Concepts

```
┌─────────────────┐
│  Event Source   │  (HTTP, WebSocket, Queue, etc.)
└────────┬────────┘
         │ Events
         ▼
┌─────────────────┐
│     Router      │  (Decision Tree)
└────────┬────────┘
         │ Matched Routes
         ▼
┌─────────────────┐
│   Framework     │  (Decorators, Express-like, etc.)
└────────┬────────┘
         │ Middleware Pipeline
         ▼
┌─────────────────┐
│  Your Handler   │  (Controller, Function, etc.)
└─────────────────┘
```

## Components

### 1. Event Sources

Event sources provide events as JavaScript objects. They handle:
- Receiving external input (HTTP requests, messages, etc.)
- Converting input to `FlexibleEvent` objects
- Calling the router with events
- Processing responses

**Built-in Event Sources:**
- [flexible-http](https://github.com/ftacchini/flexible-http) - HTTP/HTTPS server
- `DummyEventSource` - Testing utility

**See:** [Event Sources Guide](event-sources.md)

### 2. Router

The router matches events to resources (pipelines) using a decision tree:
- O(log n) lookup time
- Supports static routing (exact matches)
- Supports dynamic routing (filter functions)
- Handles complex filter combinations (AND/OR logic)

**Implementation:**
- `FlexibleTreeRouter` - Decision tree-based router (default)

**See:** [Routing Guide](routing.md)

### 3. Frameworks

Frameworks define how to structure your application code:
- Create middleware pipelines
- Define routing rules
- Handle dependency injection
- Process events through middleware chains

**Built-in Frameworks:**
- [flexible-decorators](https://github.com/ftacchini/flexible-decorators) - Decorator-based controllers
- `DummyFramework` - Testing utility

**See:** [Frameworks Guide](frameworks.md)

### 4. Pipelines

Pipelines are chains of middleware that process events:
- **Filters**: Determine if pipeline should run
- **Extractors**: Extract data from events
- **Middleware**: Process the event and generate responses

```typescript
Pipeline = {
  filters: [HttpGet, PathFilter('/users')],
  extractors: [BodyExtractor, ParamsExtractor],
  middleware: [AuthMiddleware, ValidationMiddleware, UserHandler]
}
```

**See:** [Pipelines Guide](pipelines.md)

## Request Flow

### 1. Event Reception

```typescript
// HTTP request arrives
GET /users/123

// Event source creates FlexibleEvent
{
  eventType: 'HttpEvent',
  routeData: {
    method: 'GET',
    path: '/users/123'
  },
  requestId: '1234-5678-90ab'
}
```

### 2. Routing

```typescript
// Router finds matching pipelines
router.getEventResources(event, filterBinnacle)
  → Traverses decision tree
  → Finds pipelines with matching filters
  → Returns matched pipelines
```

### 3. Pipeline Execution

```typescript
// Each pipeline processes the event
pipeline.processEvent(event, filterBinnacle, contextBinnacle)
  → Runs filters (static + dynamic)
  → Runs extractors (populates context)
  → Runs middleware (generates response)
  → Returns response
```

### 4. Response

```typescript
// Event source handles responses
responses.forEach(response => {
  res.status(response.statusCode).json(response.body);
});
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                     FlexibleApp                          │
│                                                          │
│  ┌────────────┐    ┌──────────┐    ┌────────────────┐  │
│  │   Event    │───▶│  Router  │───▶│   Pipelines    │  │
│  │  Sources   │    │          │    │                │  │
│  └────────────┘    └──────────┘    └────────────────┘  │
│        │                                     │           │
│        │                                     ▼           │
│        │                            ┌────────────────┐  │
│        │                            │   Middleware   │  │
│        │                            │     Chain      │  │
│        │                            └────────────────┘  │
│        │                                     │           │
│        │◀────────────────────────────────────┘           │
│        │              Responses                          │
└──────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Dependency Injection

Flexible uses [InversifyJS](https://inversify.io/) for dependency injection:

```typescript
@injectable()
export class UserController {
    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(UserService.TYPE) private userService: UserService
    ) {}
}
```

### 2. Module System

Everything is a module that can be composed:

```typescript
const app = FlexibleAppBuilder.instance
    .withLogger(loggerModule)      // Logger module
    .addEventSource(httpModule)    // Event source module
    .addFramework(decoratorModule) // Framework module
    .createApp();
```

### 3. Filter Cascade

Filters are chained to create complex routing logic:

```typescript
// All must match (AND)
[HttpGet, PathFilter('/users'), AuthFilter]

// Alternatives (OR)
[[HttpGet, PathFilter('/users')], [HttpPost, PathFilter('/users')]]
```

### 4. Binnacle Pattern

Context is passed through the pipeline using "binnacles":

- **filterBinnacle**: Stores filter state
- **contextBinnacle**: Stores extracted data

```typescript
// Extractor populates context
contextBinnacle.user = extractedUser;

// Middleware uses context
const user = contextBinnacle.user;
```

## Extension Points

Flexible is designed to be extended:

1. **Custom Event Sources**: Implement `FlexibleEventSource`
2. **Custom Frameworks**: Implement `FlexibleFramework`
3. **Custom Routers**: Implement `FlexibleRouter`
4. **Custom Loggers**: Implement `FlexibleLogger`
5. **Custom Filters**: Implement `FlexibleFilter`
6. **Custom Extractors**: Implement `FlexibleExtractor`

## Performance Characteristics

- **Router**: O(log n) lookup with decision tree
- **Filter Evaluation**: O(m) where m = number of filters per route
- **Pipeline Execution**: O(k) where k = middleware chain length
- **Memory**: Lazy node creation in decision tree

## Thread Safety

Flexible is designed for Node.js single-threaded event loop:
- No shared mutable state between requests
- Each request gets its own binnacles
- Pipelines are stateless

## See Also

- [Event Sources Guide](event-sources.md)
- [Frameworks Guide](frameworks.md)
- [Routing Guide](routing.md)
- [Pipelines Guide](pipelines.md)
- [Request Lifecycle](request-lifecycle.md)
