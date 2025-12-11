import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../container/flexible-container";
import { FlexibleSilentLogger } from "./flexible-silent-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";

export class SilentLoggerModule implements FlexibleLoggerModule {

    public register(container: DependencyContainer): void {
        if (!container.isRegistered(FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(FlexibleSilentLogger.TYPE)) {
            container.register(FlexibleSilentLogger.TYPE, { useClass: FlexibleSilentLogger });
        }
    }

    public getInstance(container: FlexibleContainer): FlexibleSilentLogger {
        return container.resolve(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleSilentLogger.TYPE;
    }

}