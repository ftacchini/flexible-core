import { FlexibleModule } from "../../platform/di/module";
import { FlexibleProvider } from "../../platform/di/provider";
import { FlexibleRouter } from "./router.interface";

export interface FlexibleRouterModule<Resource>
    extends FlexibleModule, FlexibleProvider<FlexibleRouter<Resource>> {
}
