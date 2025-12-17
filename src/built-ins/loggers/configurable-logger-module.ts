import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../platform/di/container";
import { FlexibleConfigurableLogger } from "./configurable-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./logger-types";
import { FlexibleLoggerModule } from "../../extension-points/logging/logger-module";
import { LoggerConfig } from "../../extension-points/logging/logger-config";

export class ConfigurableLoggerModule implements FlexibleLoggerModule {

    constructor(private config: LoggerConfig) {}

    public register(container: DependencyContainer): void {
        if (!container.isRegistered(FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(FLEXIBLE_LOGGER_TYPES.CONFIG)) {
            container.register(FLEXIBLE_LOGGER_TYPES.CONFIG, { useValue: this.config });
        }
        if (!container.isRegistered(FlexibleConfigurableLogger.TYPE)) {
            container.register(FlexibleConfigurableLogger.TYPE, { useClass: FlexibleConfigurableLogger });
        }
    }

    public getInstance(container: FlexibleContainer): FlexibleConfigurableLogger {
        return container.resolve(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleConfigurableLogger.TYPE;
    }
}
