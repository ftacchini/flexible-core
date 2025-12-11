import { DependencyContainer } from "tsyringe";

/**
 * Represents a module that can register dependencies in a container.
 * This interface has been updated to work with TSyringe instead of InversifyJS.
 *
 * Modules define a registration function that is called to bind dependencies.
 */
export interface FlexibleModule {
    /**
     * Registers this module's dependencies in the provided container.
     * @param container The TSyringe DependencyContainer to register dependencies in
     */
    register(container: DependencyContainer): void;
}