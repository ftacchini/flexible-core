import { Container } from "inversify";
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
        private container: Container) {
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

    private async setupContainers(): Promise<Container> {

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

        // Create setup container
        var setupContainer = new Container();

        let setupFlexibleContainerCommand = new SetupFlexibleContainerCommand(
            this.routerModule,
            this.extractorsRouterModule,
            setupContainer
        )

        await setupFlexibleContainerCommand.execute();

        // Bind dependencies from main container AFTER setupFlexibleContainerCommand (which calls unbindAll)
        setupContainer.bind(FLEXIBLE_APP_TYPES.LOGGER).toDynamicValue(() => {
            return this.container.get(FLEXIBLE_APP_TYPES.LOGGER);
        });

        setupContainer.bind(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER).toDynamicValue(() => {
            return this.container.get(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
        });

        setupContainer.bind(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER).toDynamicValue(() => {
            return this.container.get(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
        });

        // Bind the main container so that recipe factory can access module bindings
        setupContainer.bind(FLEXIBLE_APP_TYPES.CONTAINER).toConstantValue(this.container);

        return setupContainer;
    }

    private async setupApp(container: Container, app: FlexibleAppState): Promise<void> {

        container.bind(SetupLoggerCommand).to(SetupLoggerCommand);
        container.bind(SetupRouterCommand).to(SetupRouterCommand);
        container.bind(SetupEventSourcesCommand).to(SetupEventSourcesCommand);

        await container.get<SetupLoggerCommand>(SetupLoggerCommand).execute(app);

        let setupCommands = [
            container.get<SetupEventSourcesCommand>(SetupEventSourcesCommand),
            container.get<SetupRouterCommand>(SetupRouterCommand)
        ]

        await Promise.all(setupCommands.map(command => command.execute(app)));
    }
}