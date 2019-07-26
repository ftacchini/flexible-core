import { AsyncContainerModule } from "inversify";

export interface FlexibleModule {
    readonly container: AsyncContainerModule;
}