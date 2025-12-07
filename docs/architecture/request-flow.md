# Request Flow

This document describes how a request flows through the Flexible framework from reception to response.

## Overview

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

## Step-by-Step Flow

### 1. Event Reception

The event source receives external input and converts it to a `FlexibleEvent`:

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

**What Happens:**
- External input arrives (HTTP request, message, etc.)
- Event source adapter converts it to `FlexibleEvent`
- Event is passed to the router

### 2. Routing

The router finds all pipelines that match the event:

```typescript
// Router finds matching pipelines
router.getEventResources(event, filterBinnacle)
  → Traverses decision tree
  → Finds pipelines with matching filters
  → Returns matched pipelines
```

**What Happens:**
- Router traverses the decision tree
- Static filters are evaluated (O(log n))
- Dynamic filters are checked for matching pipelines
- All matching pipelines are returned

**See:** [Tree Router Details](tree-router.md)

### 3. Pipeline Execution

Each matched pipeline processes the event:

```typescript
// Each pipeline processes the event
pipeline.processEvent(event, filterBinnacle, contextBinnacle)
  → Runs filters (static + dynamic)
  → Runs extractors (populates context)
  → Runs middleware (generates response)
  → Returns response
```

**What Happens:**

#### 3.1 Filter Evaluation
- All filters in the pipeline are evaluated
- If any filter returns false, pipeline is skipped
- Filter results are cached in `filterBinnacle`

#### 3.2 Data Extraction
- Extractors pull data from the event
- Data is stored in `contextBinnacle`
- Examples: body, params, headers, query string

#### 3.3 Middleware Execution
- Middleware chain executes in order
- Each middleware can:
  - Access extracted data from `contextBinnacle`
  - Modify the context
  - Generate a response
  - Pass control to next middleware

### 4. Response

The event source handles the responses:

```typescript
// Event source handles responses
responses.forEach(response => {
  res.status(response.statusCode).json(response.body);
});
```

**What Happens:**
- All pipeline responses are collected
- Event source converts responses to appropriate format
- Response is sent back to the client

## Detailed Example

Let's trace a complete request:

### Request
```
GET /users/123?include=posts
Authorization: Bearer abc123
```

### 1. Event Creation
```typescript
{
  eventType: 'HttpEvent',
  routeData: {
    method: 'GET',
    path: '/users/123',
    query: { include: 'posts' },
    headers: { authorization: 'Bearer abc123' }
  },
  requestId: 'req-001'
}
```

### 2. Router Matching
```typescript
// Router finds pipeline with matching filters:
{
  filters: [
    HttpGet,                    // ✓ Matches GET
    PathFilter('/users/:id')    // ✓ Matches /users/123
  ],
  extractors: [
    ParamsExtractor,
    QueryExtractor,
    HeadersExtractor
  ],
  middleware: [
    AuthMiddleware,
    UserController.getUser
  ]
}
```

### 3. Pipeline Execution

#### Filter Evaluation
```typescript
filterBinnacle = {
  'HttpGet': true,
  'PathFilter(/users/:id)': true
}
// All filters pass → continue
```

#### Data Extraction
```typescript
contextBinnacle = {
  params: { id: '123' },
  query: { include: 'posts' },
  headers: { authorization: 'Bearer abc123' }
}
```

#### Middleware Chain
```typescript
// 1. AuthMiddleware
const token = contextBinnacle.headers.authorization;
const user = await verifyToken(token);
contextBinnacle.user = user;
// Continue to next middleware

// 2. UserController.getUser
const userId = contextBinnacle.params.id;
const include = contextBinnacle.query.include;
const user = await userService.getUser(userId, { include });
return { statusCode: 200, body: user };
```

### 4. Response
```typescript
// Event source sends response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "123",
  "name": "John Doe",
  "posts": [...]
}
```

## Binnacle Pattern

Flexible uses "binnacles" to pass context through the pipeline:

### Filter Binnacle
Stores filter evaluation results to avoid re-evaluation:

```typescript
filterBinnacle = {
  'HttpGet': true,
  'PathFilter(/users/:id)': true,
  'AuthFilter': true
}
```

### Context Binnacle
Stores extracted data and middleware state:

```typescript
contextBinnacle = {
  // Extracted data
  params: { id: '123' },
  query: { include: 'posts' },
  body: { ... },

  // Middleware state
  user: { id: '456', role: 'admin' },
  session: { ... }
}
```

## Multiple Pipeline Execution

If multiple pipelines match, they all execute:

```typescript
// Event matches two pipelines
Pipeline 1: [HttpGet, PathFilter('/users/:id')] → UserController.getUser
Pipeline 2: [HttpGet, PathFilter('/users/:id')] → AuditLogger.logAccess

// Both execute
responses = [
  { statusCode: 200, body: userData },      // From Pipeline 1
  { statusCode: 204, body: null }           // From Pipeline 2
]

// Event source handles multiple responses
// (typically only the first is sent to client)
```

## Error Handling

Errors can occur at any stage:

```typescript
try {
  // 1. Event reception
  const event = eventSource.createEvent(request);

  // 2. Routing
  const pipelines = router.getEventResources(event, filterBinnacle);

  // 3. Pipeline execution
  const responses = await Promise.all(
    pipelines.map(p => p.processEvent(event, filterBinnacle, contextBinnacle))
  );

  // 4. Response
  eventSource.sendResponse(responses);

} catch (error) {
  logger.error('Request processing failed', { error, requestId: event.requestId });
  eventSource.sendError(error);
}
```

## Performance Characteristics

- **Event Reception**: O(1) - Direct conversion
- **Routing**: O(log n) - Decision tree traversal
- **Filter Evaluation**: O(m) - Where m = filters per pipeline
- **Extraction**: O(k) - Where k = extractors per pipeline
- **Middleware**: O(j) - Where j = middleware per pipeline

## See Also

- [Components](components.md) - Component details
- [Tree Router](tree-router.md) - Routing algorithm
- [Design Patterns](design-patterns.md) - Binnacle pattern
