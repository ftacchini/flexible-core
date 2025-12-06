# Tree Router Architecture

The tree router is Flexible's high-performance routing implementation using a decision tree data structure for O(log n) route lookups.

## Table of Contents

- [Overview](#overview)
- [Decision Tree Structure](#decision-tree-structure)
- [How It Works](#how-it-works)
- [Performance Characteristics](#performance-characteristics)
- [Implementation Details](#implementation-details)
- [Examples](#examples)

## Overview

The tree router efficiently matches incoming events to resources (pipelines) by building a decision tree based on route data properties.

### Key Features

- **O(log n) lookup time** - Logarithmic performance for route matching
- **Static routing** - Exact matches on route properties
- **Dynamic routing** - Custom filter functions
- **Complex filters** - AND/OR logic through filter cascades
- **Lazy node creation** - Memory-efficient tree building

### Architecture

```
                    Root Node
                        |
                 [method: GET]
                   /         \
              match           all
                |              |
         [path: /users]  [path: /posts]
            /      \         /      \
        match      all   match     all
          |         |      |        |
       [leaf]   [leaf]  [leaf]   [leaf]
     (Pipeline) (Pipeline) (Pipeline) (Pipeline)
```

## Decision Tree Structure

### Node Types

Each node in the tree has three components:

1. **Value Matcher** - Matches a specific route property value
2. **Match Link** - Follows when the property matches
3. **All Link** - Follows for alternative routes (doesn't match)
4. **Leaves** - Filter cascades that end at this node

```typescript
class DecisionTreeNode<LeafType> {
    private valueMatcher: RouteValueMatcher;
    private matchLink: DecisionTreeNode<LeafType>;
    private allLink: DecisionTreeNode<LeafType>;
    private leaves: LeafType[];
}
```

### Tree Traversal

When matching a route:

1. Start at root node
2. Check if current node's matcher matches the route data
3. If match: follow `matchLink` and collect leaves
4. Always follow `allLink` for alternative routes
5. Combine all collected leaves

```
Event: { method: 'GET', path: '/users' }

Root
 ├─ matcher: method=GET
 │   ├─ MATCH → follow matchLink
 │   │   ├─ matcher: path=/users
 │   │   │   ├─ MATCH → collect leaves [Pipeline1]
 │   │   │   └─ follow allLink → collect leaves [Pipeline2]
 │   │   └─ ...
 │   └─ follow allLink → ...
 └─ ...

Result: [Pipeline1, Pipeline2]
```

## How It Works

### 1. Route Registration

When a route is added:

```typescript
router.addResource([
    { staticRouting: { method: 'GET', path: '/users' } }
], usersPipeline);
```

**Process:**

1. **Flatten route data** - Convert nested objects to flat structure
   ```typescript
   { method: 'GET', path: '/users' }
   // Already flat
   ```

2. **Sort properties** - Ensure consistent tree structure
   ```typescript
   ['method', 'path'] // Alphabetically sorted
   ```

3. **Create iterator** - Iterate through property-value pairs
   ```typescript
   Iterator: method=GET → path=/users
   ```

4. **Insert into tree** - Create or traverse nodes
   ```
   Root
    └─ method=GET (new node)
        └─ path=/users (new node)
            └─ [usersPipeline] (leaf)
   ```

### 2. Route Matching

When an event arrives:

```typescript
const event = {
    eventType: 'HttpEvent',
    routeData: { method: 'GET', path: '/users' }
};

const pipelines = await router.getEventResources(event, {});
```

**Process:**

1. **Flatten event route data**
   ```typescript
   { method: 'GET', path: '/users' }
   ```

2. **Traverse tree** - Follow matching paths
   ```
   Root
    ├─ method=GET? YES → follow matchLink
    │   ├─ path=/users? YES → collect leaves
    │   └─ follow allLink
    └─ follow allLink
   ```

3. **Collect candidates** - All matching filter cascades
   ```typescript
   [filterCascade1, filterCascade2, ...]
   ```

4. **Evaluate filters** - Run dynamic filters
   ```typescript
   const results = await Promise.all(
       cascades.map(cascade => cascade.getEventResources(event, {}))
   );
   ```

5. **Return matched resources**
   ```typescript
   return results.filter(r => r !== null);
   ```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Description |
|-----------|-----------|-------------|
| Insert route | O(k) | k = number of route properties |
| Match route | O(log n) | n = number of routes |
| Evaluate filters | O(m) | m = number of candidate filters |

### Space Complexity

- **Best case**: O(n) - All routes share common prefixes
- **Worst case**: O(n * k) - No shared prefixes
- **Typical**: O(n * log k) - Some shared prefixes

### Optimization: Lazy Node Creation

Nodes are created only when needed:

```typescript
if (this.valueMatcher.isMatch(iterator.routeData)) {
    this.matchLink || (this.matchLink = new DecisionTreeNode());
    this.matchLink.addRouteData(iterator, filter);
}
```

This saves memory when routes don't share prefixes.

## Implementation Details

### Route Value Matcher

Matches a specific property value:

```typescript
class RouteValueMatcher {
    constructor(
        private propertyKey: string,
        private value: string | number | boolean
    ) {}

    isMatch(routeData: PlainRouteData): boolean {
        const value = routeData[this.propertyKey];

        // Handle arrays
        if (Array.isArray(value)) {
            return value.includes(this.value);
        }

        // Handle primitives
        return value === this.value;
    }
}
```

**Example:**
```typescript
const matcher = new RouteValueMatcher('method', 'GET');
matcher.isMatch({ method: 'GET', path: '/users' }); // true
matcher.isMatch({ method: 'POST', path: '/users' }); // false
```

### Route Data Iterator

Iterates through route properties in sorted order:

```typescript
class RouteDataIterator {
    private sortedProperties: string[];
    private currentPropertyIndex: number = 0;

    next(): RouteValueMatcher {
        const property = this.sortedProperties[this.currentPropertyIndex];
        const value = this.routeData[property];

        this.currentPropertyIndex++;

        return new RouteValueMatcher(property, value);
    }
}
```

**Example:**
```typescript
const iterator = new RouteDataIterator({
    method: 'GET',
    path: '/users'
});

iterator.next(); // RouteValueMatcher(method, GET)
iterator.next(); // RouteValueMatcher(path, /users)
iterator.next(); // null
```

### Filter Cascade

Chains filters together (AND logic):

```typescript
class FilterCascadeNode<Resource> {
    constructor(
        private filter: FlexibleFilter,
        private parentNode: FilterCascadeNode<Resource> | null
    ) {}

    async getEventResources(event: FlexibleEvent): Promise<Resource | null> {
        // Check parent first
        if (this.parentNode) {
            const parentResult = await this.parentNode.getEventResources(event);
            if (parentResult === null) {
                return null; // Parent didn't match
            }
        }

        // Check this filter
        const isMatch = await this.evaluateFilter(event);
        if (!isMatch) {
            return null;
        }

        return this.resource;
    }
}
```

## Examples

### Example 1: Simple Routes

```typescript
// Register routes
router.addResource([
    { staticRouting: { method: 'GET', path: '/users' } }
], getUsersPipeline);

router.addResource([
    { staticRouting: { method: 'POST', path: '/users' } }
], createUserPipeline);

router.addResource([
    { staticRouting: { method: 'GET', path: '/posts' } }
], getPostsPipeline);
```

**Resulting Tree:**
```
Root
 ├─ method=GET
 │   ├─ path=/users → [getUsersPipeline]
 │   └─ path=/posts → [getPostsPipeline]
 └─ method=POST
     └─ path=/users → [createUserPipeline]
```

### Example 2: Shared Prefixes

```typescript
// Register routes with shared prefix
router.addResource([
    { staticRouting: { method: 'GET', path: '/api/users' } }
], getUsersPipeline);

router.addResource([
    { staticRouting: { method: 'GET', path: '/api/posts' } }
], getPostsPipeline);
```

**Resulting Tree:**
```
Root
 └─ method=GET
     ├─ path=/api/users → [getUsersPipeline]
     └─ path=/api/posts → [getPostsPipeline]
```

Routes share the `method=GET` node, saving memory.

### Example 3: Array Values

```typescript
// Register route with array value
router.addResource([
    { staticRouting: { method: 'GET', tags: ['api', 'v1'] } }
], apiV1Pipeline);
```

**Resulting Tree:**
```
Root
 └─ method=GET
     ├─ tags=api → [apiV1Pipeline]
     └─ tags=v1 → [apiV1Pipeline]
```

Each array element creates a separate path.

### Example 4: Dynamic Filters

```typescript
// Register route with dynamic filter
router.addResource([
    {
        staticRouting: { method: 'GET', path: '/users' },
        filterEvent: async (event) => {
            // Custom logic
            return event.headers['authorization'] !== undefined;
        }
    }
], protectedUsersPipeline);
```

**Process:**
1. Tree matches `method=GET` and `path=/users`
2. Returns filter cascade as candidate
3. Evaluates `filterEvent` function
4. Returns pipeline only if filter passes

## Debugging

### Enable Logging

The tree router includes structured logging:

```typescript
import { FlexibleAppBuilder, ConsoleLoggerModule } from "flexible-core";

const app = FlexibleAppBuilder.instance
    .withLogger(new ConsoleLoggerModule())
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();
```

**Log Output:**
```
DEBUG: Tree router: Adding resource {"filterCount":1,"resourceType":"Pipeline"}
DEBUG: Tree router: Built filter cascades {"cascadeCount":1}
DEBUG: Tree router: Inserting route into tree {"routeProperties":["method","path"],"routeData":{"method":"GET","path":"/users"}}
DEBUG: Tree router: Resource added {"totalRoutes":1}
DEBUG: Tree router: Finding matching routes {"eventType":"HttpEvent","routeDataKeys":["method","path"],"totalRoutes":1}
DEBUG: Tree router: Found candidate filters {"candidateCount":1}
DEBUG: Tree router: Matched resources {"matchedCount":1}
```

### Visualize Tree Structure

Add logging to see tree structure:

```typescript
class DecisionTreeNode<LeafType> {
    public debug(depth: number = 0): void {
        const indent = '  '.repeat(depth);
        console.log(`${indent}Node: ${this.valueMatcher?.toString() || 'Root'}`);
        console.log(`${indent}  Leaves: ${this.leaves.length}`);

        if (this.matchLink) {
            console.log(`${indent}  Match:`);
            this.matchLink.debug(depth + 2);
        }

        if (this.allLink) {
            console.log(`${indent}  All:`);
            this.allLink.debug(depth + 2);
        }
    }
}
```

## Comparison with Other Routers

### Linear Router (O(n))

```typescript
// Check every route
for (const route of routes) {
    if (matchesRoute(event, route)) {
        return route.pipeline;
    }
}
```

**Pros:** Simple, easy to understand
**Cons:** Slow with many routes (O(n))

### Hash Router (O(1))

```typescript
// Direct lookup
const key = `${event.method}:${event.path}`;
return routeMap.get(key);
```

**Pros:** Very fast (O(1))
**Cons:** No pattern matching, no dynamic filters

### Tree Router (O(log n))

**Pros:**
- Fast with many routes (O(log n))
- Supports pattern matching
- Supports dynamic filters
- Memory efficient with shared prefixes

**Cons:**
- More complex implementation
- Slightly slower than hash for exact matches

## See Also

- [Architecture: Overview](overview.md)
- [Architecture: Routing](routing.md)
- [Guide: Creating Custom Router](../guides/creating-router.md)
- [API Reference: FlexibleTreeRouter](../api/flexible-tree-router.md)
