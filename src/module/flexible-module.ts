import { ContainerModule } from "inversify";

export interface FlexibleModule {
    readonly container: ContainerModule;
}