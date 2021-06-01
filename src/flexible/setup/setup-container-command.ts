import { Container } from "inversify";
import { FlexibleModule } from "../../module/flexible-module";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";
import { FLEXIBLE_LOGGER_TYPES } from "../logging/flexible-logger-types";
import { FlexibleLoggerProxy } from "../logging/flexible-logger-proxy";

export class SetupContainerCommand {

    public constructor(
        private loggerModule: FlexibleLoggerModule,
        private modules: FlexibleModule[],
        private container: Container
    ) {
    }

    public async execute(): Promise<void> {
        this.container.unbindAll();

        var dependencies = [
            this.loggerModule.container,
            ...this.modules.map(x => x.container)];

        await Promise.all(dependencies.map(x => this.container.loadAsync(x)));

        this.container.bind(FLEXIBLE_APP_TYPES.LOGGER).to(FlexibleLoggerProxy);
        this.container.bind(FLEXIBLE_LOGGER_TYPES.LOGGER_PROVIDER).toDynamicValue(() => {
            return this.loggerModule.getInstance(this.container);
        });

        this.container.bind(FLEXIBLE_APP_TYPES.CONTAINER).toConstantValue(this.container);
    }

}