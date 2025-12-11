import { FlexibleEventSourceModule } from "../../event";
import { FlexibleFrameworkModule } from "../../framework";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";
import { FlexibleContainer } from "../../container/flexible-container";

export class SetupInfrastructureCommand {

    public constructor(
        private eventSourceModules: FlexibleEventSourceModule[],
        private frameworkModules: FlexibleFrameworkModule[],
        private container: FlexibleContainer
    ) {
    }

    public async execute(): Promise<void> {
        await this.bindProviders(this.eventSourceModules, FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
        await this.bindProviders(this.frameworkModules, FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
    }

    private async bindProviders(modules: (FlexibleEventSourceModule | FlexibleFrameworkModule)[], type: symbol) {
        const providers = modules.map(m => {
            // Create a child container for each module to maintain isolation
            // Child containers inherit parent bindings but keep their own bindings isolated
            const childContainer = this.container.createChild();

            // Register the module's isolated bindings in the child container
            m.registerIsolated(childContainer.getContainer());

            return () => m.getInstance(childContainer);
        });

        // Register the provider factory that returns all module instances
        this.container.registerFactory(type, () => {
            return () => providers.map(x => x());
        });
    }
}