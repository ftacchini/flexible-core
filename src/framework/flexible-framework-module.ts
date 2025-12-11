import { FlexibleModule } from "../module/flexible-module";
import { FlexibleProvider } from "../module/flexible-provider";
import { FlexibleFramework } from "./flexible-framework";
import { DependencyContainer } from "tsyringe";

export interface FlexibleFrameworkModule extends FlexibleModule, FlexibleProvider<FlexibleFramework> {
    /**
     * Registers isolated bindings for this framework module.
     * These bindings will be registered in a child container to maintain isolation.
     * @param container The child container to register bindings in
     */
    registerIsolated(container: DependencyContainer): void;
}