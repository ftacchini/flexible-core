import { FlexibleModule } from "../../platform/di/module";
import { FlexibleProvider } from "../../platform/di/provider";
import { FlexibleLogger } from "./logger.interface";

export interface FlexibleLoggerModule extends FlexibleModule, FlexibleProvider<FlexibleLogger> {
}
