import { ContainerModule, Container } from "inversify";
import { FlexibleConfigurableLogger } from "./flexible-configurable-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { LoggerConfig } from "../../logging/logger-config";

export class ConfigurableLoggerModule implements FlexibleLoggerModule {

    constructor(private config: LoggerConfig) {}

    public get container(): ContainerModule {
        const module = new ContainerModule(({ bind, unbind, isBound, rebind }) => {
            isBound(FLEXIBLE_LOGGER_TYPES.CONSOLE) ||
                bind(FLEXIBLE_LOGGER_TYPES.CONSOLE).toConstantValue(console);
            isBound(FLEXIBLE_LOGGER_TYPES.CONFIG) ||
                bind(FLEXIBLE_LOGGER_TYPES.CONFIG).toConstantValue(this.config);
            isBound(FlexibleConfigurableLogger.TYPE) ||
                bind(FlexibleConfigurableLogger.TYPE).to(FlexibleConfigurableLogger).inSingletonScope();
        });

        return module;
    }

    public getInstance(container: Container): FlexibleConfigurableLogger {
        return container.get(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleConfigurableLogger.TYPE;
    }
}
