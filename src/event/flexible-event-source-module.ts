import { FlexibleProvider } from "../module/flexible-provider";
import { FlexibleEventSource } from "./flexible-event-source";
import { FlexibleModule } from "../module/flexible-module";
import { AsyncContainerModule } from "inversify";

export interface FlexibleEventSourceModule extends FlexibleModule, FlexibleProvider<FlexibleEventSource> {
    readonly isolatedContainer: AsyncContainerModule;
}