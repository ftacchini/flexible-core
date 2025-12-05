import { ContainerModule, Container } from "inversify";
import { FlexibleSilentLogger } from "./flexible-silent-logger";
import { FLEXIBLE_LOGGER_TYPES } from "./flexible-logger-types";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";

export class SilentLoggerModule implements FlexibleLoggerModule {


    public get container(): ContainerModule {
        var module =  new ContainerModule(({ bind, unbind, isBound, rebind }) => {
            isBound(FLEXIBLE_LOGGER_TYPES.CONSOLE) ||
                bind(FLEXIBLE_LOGGER_TYPES.CONSOLE).toConstantValue(console);
            isBound(FlexibleSilentLogger.TYPE) ||
                bind(FlexibleSilentLogger.TYPE).to(FlexibleSilentLogger).inSingletonScope();
        });

        return module;
    }

    public getInstance(container: Container): FlexibleSilentLogger {
        return container.get(this.loggerType);
    }

    public get loggerType(): symbol {
        return FlexibleSilentLogger.TYPE;
    }

}