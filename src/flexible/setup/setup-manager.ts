import { FlexibleContainer } from "../../container/flexible-container";
import { FlexibleModule } from "../../module/flexible-module";
import { FlexibleExtractor, FlexibleEventSourceModule } from "../../event";
import { FlexibleRouterModule } from "../../router/flexible-router-module";
import { FlexiblePipeline } from "../pipeline/flexible-pipeline";
import { FlexibleLoggerModule } from "../../logging/flexible-logger-module";
import { FlexibleFrameworkModule } from "../../framework/flexible-framework-module";
import { SetupContainerCommand } from "./setup-container-command";
import { SetupRouterCommand } from "./setup-router-command";
import { FlexibleAppState } from "../flexible-app-state";
import { SetupFlexibleContainerCommand } from "./setup-flexible-container-command";
import { SetupEventSourcesCommand } from "./setup-event-sources-command";
import { SetupLoggerCommand } from "./setup-logger-command";
import { SetupInfrastructureCommand } from "./setup-infrastructure-command";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

const NO_FRAMEWORK_DEFINED = "Cannot build a flexible app without any framework";
const NO_SERVER_DEFINED = "Cannot build a flexible app without any server";
const NO_CONTAINER_DEFINED = "Cannot build a flexible app without a container";
const NO_LOGGER_DEFINED = "Cannot build a flexible app without a logger";
const NO_ROUTER_DEFINED = "Cannot build a flexible app without a router";
const NO_EXTRACTORS_ROUTER_DEFINED = "Cannot build a flexible app without an extrators router";

export class SetupManager {

    constructor(
        private frameworkModules: FlexibleFrameworkModule[],
        private eventSourceModules: FlexibleEventSourceModule[],
        private loggerModule: FlexibleLoggerModule,
        private routerModule: FlexibleRouterModule<FlexiblePipeline>,
        private extractorsRouterModule: FlexibleRouterModule<FlexibleExtractor>,
        private modules: FlexibleModule[],
        private container: FlexibleContainer) {
            if (!loggerModule) {
                throw NO_LOGGER_DEFINED;
            }

            if (!routerModule) {
                throw NO_ROUTER_DEFINED;
            }

            if (!extractorsRouterModule) {
                throw NO_EXTRACTORS_ROUTER_DEFINED;
            }

            if (!frameworkModules || !frameworkModules.length) {
                throw NO_FRAMEWORK_DEFINED;
            }

            if (!eventSourceModules || !eventSourceModules.length) {
                throw NO_SERVER_DEFINED;
            }

            if (!container) {
                throw NO_CONTAINER_DEFINED;
            }
        }

    public async initialize(app: FlexibleAppState): Promise<void> {
        var setupContainer = await this.setupContainers();
        await this.setupApp(setupContainer, app);
    }

    private async setupContainers(): Promise<FlexibleContainer> {

        let setupContainerCommand = new SetupContainerCommand(
            this.loggerModule,
            [
                ...this.modules,
                ...this.eventSourceModules,
                ...this.frameworkModules
            ],
            this.container);

        await setupContainerCommand.execute();

        let setupInfrastructureCommand = new SetupInfrastructureCommand(
            this.eventSourceModules,
            this.frameworkModules,
            this.container
        );

        await setupInfrastructureCommand.execute();

        // Create setup container as a child of the main container
        var setupContainer = this.container.createChild();

        let setupFlexibleContainerCommand = new SetupFlexibleContainerCommand(
            this.routerModule,
            this.extractorsRouterModule,
            setupContainer
        )

        await setupFlexibleContainerCommand.execute();

        // Bind dependencies from main container using factory functions
        setupContainer.registerFactory(FLEXIBLE_APP_TYPES.LOGGER, () => {
            return this.container.resolve(FLEXIBLE_APP_TYPES.LOGGER);
        });

        setupContainer.registerFactory(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER, () => {
            return this.container.resolve(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
        });

        setupContainer.registerFactory(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER, () => {
            return this.container.resolve(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
        });

        // Bind the main container so that recipe factory can access module bindings
        setupContainer.registerValue(FLEXIBLE_APP_TYPES.CONTAINER, this.container);

        return setupContainer;
    }

    private async setupApp(container: FlexibleContainer, app: FlexibleAppState): Promise<void> {

        container.registerClass(SetupLoggerCommand, SetupLoggerCommand);
        container.registerClass(SetupRouterCommand, SetupRouterCommand);
        container.registerClass(SetupEventSourcesCommand, SetupEventSourcesCommand);

        await container.resolve<SetupLoggerCommand>(SetupLoggerCommand).execute(app);

        let setupCommands = [
            container.resolve<SetupEventSourcesCommand>(SetupEventSourcesCommand),
            container.resolve<SetupRouterCommand>(SetupRouterCommand)
        ]

        await Promise.all(setupCommands.map(command => command.execute(app)));
    }
}