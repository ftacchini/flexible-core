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
        var providers = await Promise.all(modules.map(async m => {
            var isolatedContainer =  this.container.createChild();

            return isolatedContainer.loadAsync(m.isolatedContainer).then(() => {{
                return () => m.getInstance(isolatedContainer);
            }});
        }));

        this.container.bind(type).toFactory(() => {
            return () => providers.map(x => x());
        });
    }
}