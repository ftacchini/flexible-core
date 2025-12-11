# Migration Guide: InversifyJS to TSyringe

This guide helps you migrate from flexible-core v0.1.x (InversifyJS) to v0.2.0+ (TSyringe).

## Overview

Flexible-core v0.2.0 replaces InversifyJS with TSyringe as the dependency injection container. This change brings:

- **Child Container Support**: Create hierarchical container structures
- **Smaller Bundle Size**: TSyringe is lighter than InversifyJS
- **Simpler API**: More intuitive registration and resolution
- **Better Performance**: Faster dependency resolution
- **Microsoft Backing**: Enterprise-grade reliability

## Breaking Changes

### 1. Package Dependencies

**Update package.json:**

```json
{
  "dependencies": {
    "flexible-core": "^0.2.0",
    "flexible-decorators": "^0.2.0",
    "flexible-http": "^0.2.0",
    "tsyringe": "^4.8.0",
    "reflect-metadata": "^0.2.2"
  }
}
```

**Remove InversifyJS:**

```bash
npm uninstall inversify
npm install tsyringe
```

### 2. Import Changes

**Before (InversifyJS):**
```typescript
import { Container, inject, injectable, multiInject } from "inversify";
```

**After (TSyringe):**
```typescript
import { inject, injectable, injectAll } from "tsyringe";
import { FlexibleContainer } from "flexible-core";
```

### 3. Container Creation

**Before (InversifyJS):**
```typescript
import { Container } from "inversify";

const container = new Container();
```

**After (TSyringe):**
```typescript
import { FlexibleContainer } from "flexible-core";

const container = new FlexibleContainer();
```

### 4. Service Registration

**Before (InversifyJS):**
```typescript
// Class binding
container.bind(TYPES.UserService).to(UserService);

// Constant value
container.bind(TYPES.Logger).toConstantValue(logger);

// Dynamic value
container.bind(TYPES.Config).toDynamicValue(() => loadConfig());

// Singleton
container.bind(TYPES.Database).to(Database).inSingletonScope();
```

**After (TSyringe):**
```typescript
// Class binding (singleton by default)
container.registerClass(UserService.TYPE, UserService);

// Constant value
container.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);

// Factory function
container.registerFactory(Config.TYPE, () => loadConfig());

// Explicit lifecycle control
container.registerClass(Database.TYPE, Database, Lifecycle.Singleton);
```

### 5. Service Resolution

**Before (InversifyJS):**
```typescript
const userService = container.get<UserService>(TYPES.UserService);
```

**After (TSyringe):**
```typescript
const userService = container.resolve(UserService.TYPE);
```

### 6. Multi-Injection

**Before (InversifyJS):**
```typescript
import { multiInject } from "inversify";

constructor(@multiInject(TYPES.Plugin) private plugins: Plugin[]) {}
```

**After (TSyringe):**
```typescript
import { injectAll } from "tsyringe";

constructor(@injectAll(Plugin.TYPE) private plugins: Plugin[]) {}
```

### 7. Controller Decorators

**Before (InversifyJS):**
```typescript
import { inject, injectable } from "inversify";

@injectable()
@Controller()
export class UserController {
    constructor(@inject(TYPES.UserService) private userService: UserService) {}
}
```

**After (TSyringe):**
```typescript
import { inject, injectable } from "tsyringe";

@injectable()
@Controller()
export class UserController {
    constructor(@inject(UserService.TYPE) private userService: UserService) {}
}
```

## New Features

### Child Containers

TSyringe brings back child container support that was removed in InversifyJS v7:

```typescript
// Create main container with shared services
const mainContainer = new FlexibleContainer();
mainContainer.registerClass(UserService.TYPE, UserService);
mainContainer.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);

// Create child container that inherits parent bindings
const childContainer = mainContainer.createChild();

// Child can override parent bindings
childContainer.registerValue("NextLayer", businessEventSource);

// Child can access parent bindings
const userService = childContainer.resolve(UserService.TYPE); // Works!
const logger = childContainer.resolve(FLEXIBLE_APP_TYPES.LOGGER); // Works!
```

### Composable Architecture

Use child containers for layered applications:

```typescript
// Security layer
const securityContainer = mainContainer.createChild();
securityContainer.registerValue("NextLayer", businessEventSource);

const securityApp = FlexibleApp.builder()
    .withContainer(securityContainer)
    .addEventSource(httpModule)
    .addFramework(securityFramework)
    .createApp();

// Business layer
const businessContainer = mainContainer.createChild();

const businessApp = FlexibleApp.builder()
    .withContainer(businessContainer)
    .addEventSource(businessEventSource)
    .addFramework(businessFramework)
    .createApp();
```

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
npm uninstall inversify
npm install tsyringe@^4.8.0
npm update flexible-core flexible-decorators flexible-http
```

### Step 2: Update Imports

Find and replace across your codebase:

```bash
# Replace InversifyJS imports
sed -i 's/from "inversify"/from "tsyringe"/g' src/**/*.ts

# Add FlexibleContainer import where needed
# (Manual step - add where you create containers)
```

### Step 3: Update Container Creation

**Before:**
```typescript
import { Container } from "inversify";
const container = new Container();
```

**After:**
```typescript
import { FlexibleContainer } from "flexible-core";
const container = new FlexibleContainer();
```

### Step 4: Update Service Registration

**Before:**
```typescript
container.bind(TYPES.UserService).to(UserService);
container.bind(TYPES.Logger).toConstantValue(logger);
```

**After:**
```typescript
container.registerClass(UserService.TYPE, UserService);
container.registerValue(FLEXIBLE_APP_TYPES.LOGGER, logger);
```

### Step 5: Update Multi-Injection

**Before:**
```typescript
import { multiInject } from "inversify";
constructor(@multiInject(TYPES.Plugin) private plugins: Plugin[]) {}
```

**After:**
```typescript
import { injectAll } from "tsyringe";
constructor(@injectAll(Plugin.TYPE) private plugins: Plugin[]) {}
```

### Step 6: Test Your Application

```bash
npm run build
npm test
npm start
```

## Common Issues

### Issue: "Cannot resolve dependency"

**Cause:** Service not registered or wrong token used.

**Solution:** Ensure all services are registered with correct tokens:

```typescript
// Make sure service is registered
container.registerClass(UserService.TYPE, UserService);

// Use correct token in injection
constructor(@inject(UserService.TYPE) private userService: UserService) {}
```

### Issue: "Circular dependency detected"

**Cause:** TSyringe has stricter circular dependency detection.

**Solution:** Refactor to remove circular dependencies or use factory functions:

```typescript
// Instead of direct injection, use factory
container.registerFactory(UserService.TYPE, (container) => {
    return new UserService(container.resolve(EmailService.TYPE));
});
```

### Issue: "@injectable() decorator missing"

**Cause:** TSyringe requires @injectable() on all injected classes.

**Solution:** Add @injectable() to all classes that receive dependencies:

```typescript
import { injectable } from "tsyringe";

@injectable()
export class UserService {
    constructor(private emailService: EmailService) {}
}
```

## Performance Improvements

TSyringe typically provides better performance than InversifyJS:

- **Faster Resolution**: ~2-3x faster dependency resolution
- **Smaller Bundle**: ~40% smaller minified size
- **Lower Memory**: Reduced memory footprint
- **Startup Time**: Faster application startup

## Compatibility

### Supported Node.js Versions
- Node.js 14+
- TypeScript 4.5+

### Supported Flexible Packages
- flexible-core ^0.2.0
- flexible-decorators ^0.2.0
- flexible-http ^0.2.0
- flexible-example-app ^1.1.0

## Getting Help

If you encounter issues during migration:

1. Check the [TSyringe documentation](https://github.com/microsoft/tsyringe)
2. Review the [flexible-example-app](https://github.com/ftacchini/flexible-example-app) for working examples
3. Open an issue on [GitHub](https://github.com/ftacchini/flexible-core/issues)

## Example Migration

Here's a complete before/after example:

### Before (InversifyJS)

```typescript
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";
import { FlexibleApp } from "flexible-core";

const TYPES = {
    UserService: Symbol("UserService"),
    Logger: Symbol("Logger")
};

@injectable()
export class UserService {
    constructor(@inject(TYPES.Logger) private logger: any) {}
}

@injectable()
@Controller()
export class UserController {
    constructor(@inject(TYPES.UserService) private userService: UserService) {}
}

const container = new Container();
container.bind(TYPES.UserService).to(UserService);
container.bind(TYPES.Logger).toConstantValue(console);

const app = FlexibleApp.builder()
    .withContainer(container)
    .addEventSource(httpModule)
    .addFramework(decoratorsFramework)
    .createApp();
```

### After (TSyringe)

```typescript
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { FlexibleApp, FlexibleContainer, FLEXIBLE_APP_TYPES } from "flexible-core";

@injectable()
export class UserService {
    static readonly TYPE = Symbol("UserService");

    constructor(@inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: any) {}
}

@injectable()
@Controller()
export class UserController {
    constructor(@inject(UserService.TYPE) private userService: UserService) {}
}

const container = new FlexibleContainer();
container.registerClass(UserService.TYPE, UserService);
container.registerValue(FLEXIBLE_APP_TYPES.LOGGER, console);

const app = FlexibleApp.builder()
    .withContainer(container)
    .addEventSource(httpModule)
    .addFramework(decoratorsFramework)
    .createApp();
```

## Summary

The migration to TSyringe brings significant benefits:

- ✅ Child container support for composable architecture
- ✅ Better performance and smaller bundle size
- ✅ Simpler, more intuitive API
- ✅ Microsoft backing and enterprise reliability
- ✅ Maintained compatibility with existing patterns

The migration effort is moderate but worthwhile for the improved capabilities and performance.