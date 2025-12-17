import { FlexibleModule } from "../../platform/di/module";
import { FlexibleProvider } from "../../platform/di/provider";
import { FlexibleFramework } from "./framework.interface";
import { DependencyContainer } from "tsyringe";

export interface FlexibleFrameworkModule extends FlexibleModule, FlexibleProvider<FlexibleFramework> {
    /**
     * Registers isolated bindings for this framework module.
     * These bindings will be registered in a child container to maintain isolation.
     * @param container The child container to register bindings in
     */
    registerIsolated(container: DependencyContainer): void;
}
