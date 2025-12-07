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

## Architecture Documents

### [Components](components.md)
Learn about the four main components:
- **Event Sources** - Receive external input and create events
- **Router** - Match events to pipelines using a decision tree
- **Frameworks** - Structure your application code
- **Pipelines** - Process events through middleware chains

### [Modules](modules.md)
Understand the module system:
- Module structure and interfaces
- Logger, Router, Framework, and Event Source modules
- Module composition and dependency injection
- Creating custom modules

### [Request Flow](request-flow.md)
Follow a request through the system:
- Event reception and creation
- Router matching algorithm
- Pipeline execution stages
- Response handling
- Binnacle pattern for context passing

### [Design Patterns](design-patterns.md)
Explore the patterns used throughout:
- Dependency Injection with InversifyJS
- Module composition system
- Filter cascade for routing
- Binnacle pattern for context
- Provider and builder patterns

### [Tree Router](tree-router.md)
Deep dive into the routing algorithm:
- Decision tree structure
- O(log n) lookup performance
- Static vs dynamic filters
- Route registration and matching

## Quick Reference

### Data Flow

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

### Extension Points

Flexible is designed to be extended:

1. **Custom Event Sources**: Implement `FlexibleEventSource`
2. **Custom Frameworks**: Implement `FlexibleFramework`
3. **Custom Routers**: Implement `FlexibleRouter`
4. **Custom Loggers**: Implement `FlexibleLogger`
5. **Custom Filters**: Implement `FlexibleFilter`
6. **Custom Extractors**: Implement `FlexibleExtractor`

### Performance Characteristics

- **Router**: O(log n) lookup with decision tree
- **Filter Evaluation**: O(m) where m = number of filters per route
- **Pipeline Execution**: O(k) where k = middleware chain length
- **Memory**: Lazy node creation in decision tree

### Thread Safety

Flexible is designed for Node.js single-threaded event loop:
- No shared mutable state between requests
- Each request gets its own binnacles
- Pipelines are stateless

## See Also

### Guides
- [Getting Started](../getting-started.md) - Build your first app
- [Composable Architecture](../guides/composable-apps.md) - Build layered applications
- [Creating Event Sources](../guides/creating-event-source.md) - Build custom sources
- [Creating Frameworks](../guides/creating-framework.md) - Build custom frameworks
- [Creating Routers](../guides/creating-router.md) - Build custom routers
- [Logging](../guides/logging.md) - Structured logging guide
