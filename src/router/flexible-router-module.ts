import { FlexibleModule } from "../module/flexible-module";
import { FlexibleProvider } from "../module/flexible-provider";
import { FlexibleRouter } from ".";

export interface FlexibleRouterModule<Resource> 
    extends FlexibleModule, FlexibleProvider<FlexibleRouter<Resource>> {
}