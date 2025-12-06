# Creating a Custom Router

This guide shows you how to create a custom router for Flexible if the built-in tree router doesn't meet your needs.

## Table of Contents

- [When to Create a Custom Router](#when-to-create-a-custom-router)
- [Router Interface](#router-interface)
- [Step-by-Step Guide](#step-by-step-guide)
- [Example: Hash Router](#example-hash-router)
- [Example: Pattern Router](#example-pattern-router)
- [Testing Your Router](#testing-your-router)
- [Best Practices](#best-practices)

## When to Create a Custom Router

Consider creating a custom router when:

- **Performance requirements** - Need O(1) lookups for exact matches
- **Special routing logic** - Pattern matching, regex, wildcards
- **External routing** - Integration with external routing systems
- **Caching strategies** - Custom caching or memoization
- **Debugging needs** - Custom logging or instrumentation

**Default tree router is good for:**
- Most applications (O(log n) is fast enough)
- Complex filter combinations
- Dynamic routing with filter functions
- Memory efficiency with shared route prefixes

## Router Interface

Every router must implement `FlexibleRouter`:

```typescript
export interface FlexibleRouter<Resource> {
    // Find resources that match an event
    getEventResources(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string }
    ): Promise<Resource[]>;

    // Register a resource with its filters
    addResource(
        filters: (FlexibleFilter | FlexibleFilter[])[],
        resource: Resource
    ): void;
}
```

### FlexibleFilter

Filters determine when a route matches:

```typescript
interface FlexibleFilter {
    // Static routing data (for fast matching)
    staticRouting: RouteData<string>;

    // Dynamic filter function (for complex logic)
    filterEvent: ((event: FlexibleEvent, binnacle: any) => Promise<boolean>) | null;
}
```

## Step-by-Step Guide

### Step 1: Choose Your Data Structure

Pick a data structure based on your routing needs:

**Hash Map** - O(1) exact matches
```typescript
private routes: Map<string, Resource> = new Map();
```

**Trie** - O(k) prefix matching (k = path length)
```typescript
private root: TrieNode = new TrieNode();
```

**Array** - O(n) linear search (simple, flexible)
```typescript
private routes: RouteEntry[] = [];
```

**Tree** - O(log n) balanced lookups
```typescript
private root: TreeNode = new TreeNode();
```

### Step 2: Implement addResource

Store routes in your data structure:

```typescript
export class MyRouter<Resource> implements FlexibleRouter<Resource> {
    private routes: Map<string, Resource[]> = new Map();

    addResource(
        filters: (FlexibleFilter | FlexibleFilter[])[],
        resource: Resource
    ): void {
        // Extract route key from filters
        const key = this.extractRouteKey(filters);

        // Store resource
        if (!this.routes.has(key)) {
            this.routes.set(key, []);
        }
        this.routes.get(key)!.push(resource);
    }

    private extractRouteKey(filters: any[]): string {
        // Create a unique key from filters
        const filter = filters[0];
        if (Array.isArray(filter)) {
            return this.extractRouteKey(filter);
        }

        const routing = filter.staticRouting || {};
        return `${routing.method}:${routing.path}`;
    }
}
```

### Step 3: Implement getEventResources

Find matching resources:

```typescript
async getEventResources(
    event: FlexibleEvent,
    filterBinnacle: { [key: string]: string }
): Promise<Resource[]> {
    // Create key from event
    const key = this.createEventKey(event);

    // Lookup resources
    const resources = this.routes.get(key) || [];

    // Return matches
    return resources;
}

private createEventKey(event: FlexibleEvent): string {
    const { method, path } = event.routeData;
    return `${method}:${path}`;
}
```

### Step 4: Handle Dynamic Filters

Evaluate filter functions:

```typescript
async getEventResources(
    event: FlexibleEvent,
    filterBinnacle: { [key: string]: string }
): Promise<Resource[]> {
    // Get candidate resources
    const candidates = this.findCandidates(event);

    // Evaluate dynamic filters
    const results = await Promise.all(
        candidates.map(async (candidate) => {
            const matches = await this.evaluateFilters(
                candidate.filters,
                event,
                filterBinnacle
            );
            return matches ? candidate.resource : null;
        })
    );

    // Return matched resources
    return results.filter((r): r is Resource => r !== null);
}

private async evaluateFilters(
    filters: FlexibleFilter[],
    event: FlexibleEvent,
    binnacle: any
): Promise<boolean> {
    for (const filter of filters) {
        if (filter.filterEvent) {
            const matches = await filter.filterEvent(event, binnacle);
            if (!matches) {
                return false;
            }
        }
    }
    return true;
}
```

## Example: Hash Router

A simple O(1) router for exact matches:

```typescript
export class HashRouter<Resource> implements FlexibleRouter<Resource> {
    private routes: Map<string, RouteEntry<Resource>[]> = new Map();

    addResource(
        filters: (FlexibleFilter | FlexibleFilter[])[],
        resource: Resource
    ): void {
        // Flatten filters
        const flatFilters = this.flattenFilters(filters);

        // Create route key
        const key = this.createKey(flatFilters);

        // Store route
        if (!this.routes.has(key)) {
            this.routes.set(key, []);
        }

        this.routes.get(key)!.push({
            filters: flatFilters,
            resource
        });
    }

    async getEventResources(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string }
    ): Promise<Resource[]> {
        // Create key from event
        const key = this.createEventKey(event);

        // Get candidates
        const candidates = this.routes.get(key) || [];

        // Evaluate dynamic filters
        const results = await Promise.all(
            candidates.map(async (candidate) => {
                const matches = await this.evaluateFilters(
                    candidate.filters,
                    event,
                    filterBinnacle
                );
                return matches ? candidate.resource : null;
            })
        );

        return results.filter((r): r is Resource => r !== null);
    }

    private createKey(filters: FlexibleFilter[]): string {
        // Create key from static routing
        const parts: string[] = [];

        for (const filter of filters) {
            const routing = filter.staticRouting || {};
            Object.keys(routing).sort().forEach(key => {
                parts.push(`${key}=${routing[key]}`);
            });
        }

        return parts.join('&');
    }

    private createEventKey(event: FlexibleEvent): string {
        const parts: string[] = [];

        Object.keys(event.routeData).sort().forEach(key => {
            parts.push(`${key}=${event.routeData[key]}`);
        });

        return parts.join('&');
    }

    private flattenFilters(
        filters: (FlexibleFilter | FlexibleFilter[])[]
    ): FlexibleFilter[] {
        const result: FlexibleFilter[] = [];

        for (const filter of filters) {
            if (Array.isArray(filter)) {
                result.push(...filter);
            } else {
                result.push(filter);
            }
        }

        return result;
    }

    private async evaluateFilters(
        filters: FlexibleFilter[],
        event: FlexibleEvent,
        binnacle: any
    ): Promise<boolean> {
        for (const filter of filters) {
            if (filter.filterEvent) {
                const matches = await filter.filterEvent(event, binnacle);
                if (!matches) {
                    return false;
                }
            }
        }
        return true;
    }
}

interface RouteEntry<Resource> {
    filters: FlexibleFilter[];
    resource: Resource;
}
```

**Usage:**
```typescript
const router = new HashRouter<Pipeline>();

router.addResource([
    { staticRouting: { method: 'GET', path: '/users' }, filterEvent: null }
], getUsersPipeline);

const event = {
    eventType: 'HttpEvent',
    routeData: { method: 'GET', path: '/users' }
};

const pipelines = await router.getEventResources(event, {});
```

## Example: Pattern Router

A router with pattern matching:

```typescript
export class PatternRouter<Resource> implements FlexibleRouter<Resource> {
    private routes: PatternRoute<Resource>[] = [];

    addResource(
        filters: (FlexibleFilter | FlexibleFilter[])[],
        resource: Resource
    ): void {
        const flatFilters = this.flattenFilters(filters);

        // Extract pattern from filters
        const pattern = this.extractPattern(flatFilters);

        this.routes.push({
            pattern,
            filters: flatFilters,
            resource
        });
    }

    async getEventResources(
        event: FlexibleEvent,
        filterBinnacle: { [key: string]: string }
    ): Promise<Resource[]> {
        const results: Resource[] = [];

        // Check each route
        for (const route of this.routes) {
            // Match pattern
            if (this.matchPattern(route.pattern, event)) {
                // Evaluate dynamic filters
                const matches = await this.evaluateFilters(
                    route.filters,
                    event,
                    filterBinnacle
                );

                if (matches) {
                    results.push(route.resource);
                }
            }
        }

        return results;
    }

    private extractPattern(filters: FlexibleFilter[]): RoutePattern {
        const pattern: RoutePattern = {};

        for (const filter of filters) {
            const routing = filter.staticRouting || {};
            Object.assign(pattern, routing);
        }

        return pattern;
    }

    private matchPattern(pattern: RoutePattern, event: FlexibleEvent): boolean {
        for (const key in pattern) {
            const patternValue = pattern[key];
            const eventValue = event.routeData[key];

            // Support wildcards
            if (patternValue === '*') {
                continue;
            }

            // Support regex
            if (typeof patternValue === 'string' && patternValue.startsWith('/')) {
                const regex = new RegExp(patternValue.slice(1, -1));
                if (!regex.test(String(eventValue))) {
                    return false;
                }
                continue;
            }

            // Exact match
            if (patternValue !== eventValue) {
                return false;
            }
        }

        return true;
    }

    private flattenFilters(
        filters: (FlexibleFilter | FlexibleFilter[])[]
    ): FlexibleFilter[] {
        const result: FlexibleFilter[] = [];

        for (const filter of filters) {
            if (Array.isArray(filter)) {
                result.push(...filter);
            } else {
                result.push(filter);
            }
        }

        return result;
    }

    private async evaluateFilters(
        filters: FlexibleFilter[],
        event: FlexibleEvent,
        binnacle: any
    ): Promise<boolean> {
        for (const filter of filters) {
            if (filter.filterEvent) {
                const matches = await filter.filterEvent(event, binnacle);
                if (!matches) {
                    return false;
                }
            }
        }
        return true;
    }
}

interface PatternRoute<Resource> {
    pattern: RoutePattern;
    filters: FlexibleFilter[];
    resource: Resource;
}

interface RoutePattern {
    [key: string]: string | number | boolean;
}
```

**Usage:**
```typescript
const router = new PatternRouter<Pipeline>();

// Wildcard
router.addResource([
    { staticRouting: { method: '*', path: '/api/*' }, filterEvent: null }
], apiPipeline);

// Regex
router.addResource([
    { staticRouting: { method: 'GET', path: '/users/\\d+/' }, filterEvent: null }
], userPipeline);
```

## Testing Your Router

### Unit Tests

```typescript
describe("MyRouter", () => {
    let router: MyRouter<string>;

    beforeEach(() => {
        router = new MyRouter<string>();
    });

    it("should add and retrieve routes", async () => {
        router.addResource([
            { staticRouting: { method: 'GET', path: '/test' }, filterEvent: null }
        ], 'test-resource');

        const event = {
            eventType: 'test',
            routeData: { method: 'GET', path: '/test' }
        };

        const resources = await router.getEventResources(event, {});

        expect(resources).toEqual(['test-resource']);
    });

    it("should handle dynamic filters", async () => {
        router.addResource([
            {
                staticRouting: { method: 'GET' },
                filterEvent: async (event) => event.routeData.path === '/test'
            }
        ], 'filtered-resource');

        const event1 = {
            eventType: 'test',
            routeData: { method: 'GET', path: '/test' }
        };

        const event2 = {
            eventType: 'test',
            routeData: { method: 'GET', path: '/other' }
        };

        const resources1 = await router.getEventResources(event1, {});
        const resources2 = await router.getEventResources(event2, {});

        expect(resources1).toEqual(['filtered-resource']);
        expect(resources2).toEqual([]);
    });
});
```

> **Real tests:** See [flexible-tree-router.spec.ts](../../test/unit-test/flexible/router/tree-router/flexible-tree-router.spec.ts) and [flexible-router-tests.ts](../../test/unit-test/flexible/router/flexible-router-tests.ts) for comprehensive router tests that all router implementations must pass.

### Integration Tests

```typescript
import { FlexibleAppBuilder, DummyFramework } from "flexible-core";

describe("MyRouter Integration", () => {
    it("should work with Flexible app", async () => {
        const framework = new DummyFramework();
        framework.addPipelineDefinition({
            filterStack: [
                { staticRouting: { method: 'GET' }, filterEvent: null }
            ],
            middlewareStack: [{
                activationContext: {
                    activate: async () => ({ success: true })
                },
                extractorRecipes: {}
            }]
        });

        const router = new MyRouter();

        // Use custom router
        const app = FlexibleAppBuilder.instance
            .withRouter(router)
            .addFramework(framework)
            .createApp();

        // Test...
    });
});
```

> **Real tests:** See [flexible-app.spec.ts](../../test/integration-test/flexible-app.spec.ts) for integration tests showing how routers work within the complete application. The test "Should route events correctly through flexible router" demonstrates the full routing flow.

## Best Practices

### 1. Add Logging

Use structured logging for debugging:

```typescript
async getEventResources(
    event: FlexibleEvent,
    filterBinnacle: { [key: string]: string }
): Promise<Resource[]> {
    this.logger?.debug("Router: Finding matches", {
        eventType: event.eventType,
        routeData: event.routeData,
        totalRoutes: this.routes.size
    });

    const resources = await this.findMatches(event, filterBinnacle);

    this.logger?.debug("Router: Found matches", {
        matchCount: resources.length
    });

    return resources;
}
```

### 2. Handle Edge Cases

```typescript
// Empty filters
if (!filters || filters.length === 0) {
    throw new Error("At least one filter is required");
}

// Null/undefined event
if (!event || !event.routeData) {
    return [];
}

// Duplicate routes
if (this.isDuplicate(filters, resource)) {
    this.logger?.warning("Duplicate route detected", { filters });
}
```

### 3. Optimize for Your Use Case

```typescript
// Cache compiled patterns
private patternCache: Map<string, RegExp> = new Map();

private getPattern(pattern: string): RegExp {
    if (!this.patternCache.has(pattern)) {
        this.patternCache.set(pattern, new RegExp(pattern));
    }
    return this.patternCache.get(pattern)!;
}
```

### 4. Document Performance Characteristics

```typescript
/**
 * Hash Router
 *
 * Performance:
 * - addResource: O(1)
 * - getEventResources: O(1) for exact matches
 *
 * Best for:
 * - Exact route matching
 * - High-performance requirements
 * - Simple routing logic
 *
 * Not suitable for:
 * - Pattern matching
 * - Wildcard routes
 * - Complex filter combinations
 */
export class HashRouter<Resource> implements FlexibleRouter<Resource> {
    // ...
}
```

### 5. Provide Configuration Options

```typescript
export interface RouterConfig {
    cacheSize?: number;
    enableLogging?: boolean;
    caseSensitive?: boolean;
}

export class MyRouter<Resource> implements FlexibleRouter<Resource> {
    constructor(private config: RouterConfig = {}) {
        this.cacheSize = config.cacheSize || 1000;
        this.caseSensitive = config.caseSensitive ?? true;
    }
}
```

## Working Code Examples

The router interface and implementations are proven by real working code:

**Tree Router Implementation:**
- [FlexibleTreeRouter](../../src/flexible/router/tree-router/flexible-tree-router.ts) - Production tree router (O(log n))
- [FlexibleRouter Interface](../../src/router/flexible-router.ts) - Router interface that all routers must implement

**Tests:**
- [flexible-tree-router.spec.ts](../../test/unit-test/flexible/router/tree-router/flexible-tree-router.spec.ts) - Tree router tests
- [flexible-router-tests.ts](../../test/unit-test/flexible/router/flexible-router-tests.ts) - Shared test suite for router implementations
- [flexible-app.spec.ts](../../test/integration-test/flexible-app.spec.ts) - Integration tests showing router in action

**Test Utilities:**
- [DummyFramework](../../src/test-util/dummy-framework.ts) - Framework for testing routers

## See Also

- [Architecture: Tree Router](../architecture/tree-router.md)
- [Architecture: Routing](../architecture/routing.md)
- [API Reference: FlexibleRouter](../api/flexible-router.md)
- [Guide: Creating Frameworks](creating-framework.md)
