import { FlexibleModule } from "../module/flexible-module";
import { FlexibleProvider } from "../module/flexible-provider";
import { FlexibleLogger } from "./flexible-logger";

export interface FlexibleLoggerModule extends FlexibleModule, FlexibleProvider<FlexibleLogger> {
}