import { FlexibleContainer } from "../../container/flexible-container";
import { FlexibleModule } from "../../module/flexible-module";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

export class SetupContainerCommand {

    public constructor(
        private loggerModule: FlexibleLoggerModule,
        private modules: FlexibleModule[],
        private container: FlexibleContainer
    ) {
    }

    public async execute(): Promise<void> {
        // Get the underlying TSyringe container
        const tsyringeContainer = this.container.getContainer();

        // Register logger module
        this.loggerModule.register(tsyringeContainer);

        // Register all other modules
        for (const module of this.modules) {
            module.register(tsyringeContainer);
        }

        // Register logger using factory (equivalent to toDynamicValue)
        this.container.registerFactory(FLEXIBLE_APP_TYPES.LOGGER, () => {
            return this.loggerModule.getInstance(this.container);
        });

        // Register container as constant value (equivalent to toConstantValue)
        this.container.registerValue(FLEXIBLE_APP_TYPES.CONTAINER, this.container as any);
    }

}