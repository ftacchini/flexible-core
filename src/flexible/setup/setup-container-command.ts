import { Container } from "inversify";
import { FlexibleModule } from "../../module/flexible-module";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

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

        this.container.loadSync(...dependencies);
        this.container.bind(FLEXIBLE_APP_TYPES.LOGGER).toDynamicValue(() => {
            return this.loggerModule.getInstance(this.container);
        });

        this.container.bind(FLEXIBLE_APP_TYPES.CONTAINER).toConstantValue(this.container);
    }

}