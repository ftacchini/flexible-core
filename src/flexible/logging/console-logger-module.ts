import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../container/flexible-container";
import { FlexibleConsoleLogger } from "./flexible-console-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";

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