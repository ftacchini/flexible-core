import { DependencyContainer, container as globalContainer, InjectionToken, Lifecycle } from "tsyringe";

/**
 * Wrapper around TSyringe's DependencyContainer to provide a consistent interface
 * for flexible-core's dependency injection needs.
 *
 * This adapter maintains compatibility with the existing FlexibleModule interface
 * while leveraging TSyringe's child container capabilities.
 */
export class FlexibleContainer {
    private container: DependencyContainer;

    /**
     * Creates a new FlexibleContainer
     * @param parent Optional parent container for creating child containers
     */
    constructor(parent?: DependencyContainer) {
        if (parent) {
            this.container = parent.createChildContainer();
        } else {
            // Create a new root container
            this.container = globalContainer.createChildContainer();
        }
    }

    /**
     * Gets the underlying TSyringe container
     */
    public getContainer(): DependencyContainer {
        return this.container;
    }

    /**
     * Creates a child container that inherits bindings from this container
     */
    public createChild(): FlexibleContainer {
        return new FlexibleContainer(this.container);
    }

    /**
     * Registers a class binding
     * @param token The injection token
     * @param target The class to bind
     * @param lifecycle Optional lifecycle (singleton, transient, scoped)
     */
    public registerClass<T>(
        token: InjectionToken<T>,
        target: new (...args: any[]) => T,
        lifecycle: Lifecycle = Lifecycle.Singleton
    ): void {
        this.container.register(token, { useClass: target }, { lifecycle });
    }

    /**
     * Registers a constant value binding
     * @param token The injection token
     * @param value The value to bind
     */
    public registerValue<T>(token: InjectionToken<T>, value: T): void {
        this.container.register(token, { useValue: value });
    }

    /**
     * Registers a factory function binding
     * @param token The injection token
     * @param factory The factory function
     * Note: Factory providers do not support lifecycle management in TSyringe.
     * If you need instance caching, implement it within your factory function.
     */
    public registerFactory<T>(
        token: InjectionToken<T>,
        factory: (container: DependencyContainer) => T
    ): void {
        this.container.register(token, {
            useFactory: factory
        });
    }

    /**
     * Resolves a dependency from the container
     * @param token The injection token to resolve
     */
    public resolve<T>(token: InjectionToken<T>): T {
        return this.container.resolve(token);
    }

    /**
     * Checks if a token is registered in the container or any parent container
     * @param token The injection token to check
     */
    public isRegistered<T>(token: InjectionToken<T>): boolean {
        // First check if it's registered in this container
        if (this.container.isRegistered(token)) {
            return true;
        }

        // Try to resolve it - if it succeeds, it's available from a parent
        try {
            this.container.resolve(token);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clears all registrations from the container
     */
    public clearInstances(): void {
        this.container.clearInstances();
    }

    /**
     * Resets the container (clears all registrations and instances)
     */
    public reset(): void {
        this.container.reset();
    }
}
