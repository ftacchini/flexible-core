import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../platform/di/container";
import { FlexibleConsoleLogger } from "./console-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./logger-types";
import { FlexibleLoggerModule } from "../../extension-points/logging/logger-module";

export class ConsoleLoggerModule implements FlexibleLoggerModule {

    public register(container: DependencyContainer): void {
        if (!container.isRegistered(FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(FlexibleConsoleLogger.TYPE)) {
            container.register(FlexibleConsoleLogger.TYPE, { useClass: FlexibleConsoleLogger });
        }
    }

    public getInstance(container: FlexibleContainer): FlexibleConsoleLogger {
        return container.resolve(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleConsoleLogger.TYPE;
    }

}
