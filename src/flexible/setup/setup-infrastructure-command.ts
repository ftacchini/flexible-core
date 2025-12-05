import { Container } from "inversify";
import { FlexibleEventSourceModule } from "../../event";
import { FlexibleFrameworkModule } from "../../framework";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

export class SetupInfrastructureCommand {

    public constructor(
        private eventSourceModules: FlexibleEventSourceModule[],
        private frameworkModules: FlexibleFrameworkModule[],
        private container: Container
    ) {
    }

    public async execute(): Promise<void> {
        await this.bindProviders(this.eventSourceModules, FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
        await this.bindProviders(this.frameworkModules, FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
    }

    private async bindProviders(modules: (FlexibleEventSourceModule | FlexibleFrameworkModule)[], type: symbol) {
        const mainContainer = this.container;

        var providers = modules.map(m => {
            // In Inversify 7, we can't use child containers
            // Instead, we pass the main container directly to getInstance
            // The isolated module is loaded into the main container
            mainContainer.loadSync(m.isolatedContainer);

            return () => m.getInstance(mainContainer);
        });

        this.container.bind(type).toDynamicValue(() => {
            return () => providers.map(x => x());
        });
    }
}