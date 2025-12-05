import { ContainerModule, Container } from "inversify";
import { FlexibleConsoleLogger } from "./flexible-console-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";

export class ConsoleLoggerModule implements FlexibleLoggerModule {

    public get container(): ContainerModule {
        var module =  new ContainerModule(({ bind, unbind, isBound, rebind }) => {
            isBound(FLEXIBLE_LOGGER_TYPES.CONSOLE) ||
                bind(FLEXIBLE_LOGGER_TYPES.CONSOLE).toConstantValue(console);
            isBound(FlexibleConsoleLogger.TYPE) ||
                bind(FlexibleConsoleLogger.TYPE).to(FlexibleConsoleLogger).inSingletonScope();
        });

        return module;
    }

    public getInstance(container: Container): FlexibleConsoleLogger {
        return container.get(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleConsoleLogger.TYPE;
    }

}