import { FlexibleModule } from "../module/flexible-module";
import { FlexibleProvider } from "../module/flexible-provider";
import { FlexibleFramework } from "./flexible-framework";
import { AsyncContainerModule } from "inversify";

export interface FlexibleFrameworkModule extends FlexibleModule, FlexibleProvider<FlexibleFramework> {
    readonly isolatedContainer: AsyncContainerModule;
}