import { FlexibleProvider } from "../../platform/di/provider";
import { FlexibleEventSource } from "./event-source.interface";
import { FlexibleModule } from "../../platform/di/module";
import { DependencyContainer } from "tsyringe";

export interface FlexibleEventSourceModule extends FlexibleModule, FlexibleProvider<FlexibleEventSource> {
    /**
     * Registers isolated bindings for this event source module.
     * These bindings will be registered in a child container to maintain isolation.
     * @param container The child container to register bindings in
     */
    registerIsolated(container: DependencyContainer): void;
}
