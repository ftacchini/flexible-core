# Components

Flexible's architecture is built on four main components that work together to process events.

## 1. Event Sources

Event sources provide events as JavaScript objects. They handle:
- Receiving external input (HTTP requests, messages, etc.)
- Converting input to `FlexibleEvent` objects
- Calling the router with events
- Processing responses

**Built-in Event Sources:**
- [flexible-http](https://github.com/ftacchini/flexible-http) - HTTP/HTTPS server
- `DummyEventSource` - Testing utility

**See:** [Creating Event Sources Guide](../guides/creating-event-source.md)

## 2. Router

The router matches events to resources (pipelines) using a decision tree:
- O(log n) lookup time
- Supports static routing (exact matches)
- Supports dynamic routing (filter functions)
- Handles complex filter combinations (AND/OR logic)

**Implementation:**
- `FlexibleTreeRouter` - Decision tree-based router (default)

**See:**
- [Tree Router Details](tree-router.md)
- [Creating Routers Guide](../guides/creating-router.md)

## 3. Frameworks

Frameworks define how to structure your application code:
- Create middleware pipelines
- Define routing rules
- Handle dependency injection
- Process events through middleware chains

**Built-in Frameworks:**
- [flexible-decorators](https://github.com/ftacchini/flexible-decorators) - Decorator-based controllers
- `DummyFramework` - Testing utility

**See:** [Creating Frameworks Guide](../guides/creating-framework.md)

## 4. Pipelines

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

### Pipeline Structure

Each pipeline consists of three stages:

1. **Filtering**: Determines if the pipeline should handle the event
2. **Extraction**: Pulls data from the event into the context
3. **Processing**: Middleware chain that generates the response

### Example Pipeline

```typescript
{
  filters: [
    HttpGet,                    // Must be GET request
    PathFilter('/users/:id')    // Must match path pattern
  ],
  extractors: [
    ParamsExtractor,            // Extract :id parameter
    QueryExtractor,             // Extract query string
    HeadersExtractor            // Extract headers
  ],
  middleware: [
    AuthMiddleware,             // Verify authentication
    ValidationMiddleware,       // Validate input
    UserController.getUser      // Handle request
  ]
}
```

## Component Interaction

```
┌─────────────────┐
│  Event Source   │  Receives external input
└────────┬────────┘
         │ Creates FlexibleEvent
         ▼
┌─────────────────┐
│     Router      │  Matches event to pipelines
└────────┬────────┘
         │ Returns matching pipelines
         ▼
┌─────────────────┐
│   Framework     │  Executes pipelines
└────────┬────────┘
         │ Runs middleware chains
         ▼
┌─────────────────┐
│  Your Handler   │  Generates response
└─────────────────┘
```

## See Also

- [Modules](modules.md) - How components are packaged
- [Request Flow](request-flow.md) - How components process requests
- [Design Patterns](design-patterns.md) - Patterns used throughout
