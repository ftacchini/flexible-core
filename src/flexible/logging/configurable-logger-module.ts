import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../container/flexible-container";
import { FlexibleConfigurableLogger } from "./flexible-configurable-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { LoggerConfig } from "../../logging/logger-config";

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
