import { AsyncContainerModule, interfaces, Container } from "inversify";
import { FlexibleConsoleLogger } from "./flexible-console-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";

export class ConsoleLoggerModule implements FlexibleLoggerModule {

    public get container(): AsyncContainerModule {
        var module =  new AsyncContainerModule(async (
            bind: interfaces.Bind,
            unbind: interfaces.Unbind,
            isBound: interfaces.IsBound,
            rebind: interfaces.Rebind) => {
                
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