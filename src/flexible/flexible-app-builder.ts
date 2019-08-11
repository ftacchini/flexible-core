import { FlexibleApp } from "./flexible-app";
import { Container } from "inversify";
import { FlexibleFrameworkModule } from "../framework/flexible-framework-module";
import { FlexibleEventSourceModule } from "../event/flexible-event-source-module";
import { FlexibleLoggerModule } from "../logging/flexible-logger-module";
import { ConsoleLoggerModule } from "./logging/console-logger-module";
import { FlexibleRouterModule } from "../router/flexible-router-module";
import { FlexibleTreeRouterModule } from "./router/tree-router/flexible-tree-router-module";
import { FlexibleModule } from "../module/flexible-module";
import { FlexiblePipeline } from "./pipeline/flexible-pipeline";
import { FlexibleExtractor } from "../event";
import { SetupManager } from "./setup/setup-manager";


export class FlexibleAppBuilder {

    private frameworks: FlexibleFrameworkModule[] = [];
    private eventSources: FlexibleEventSourceModule[] = [];
    private modules: FlexibleModule[] = [];
    
    protected logger: FlexibleLoggerModule;
    protected router: FlexibleRouterModule<FlexiblePipeline>;
    protected extractorsRouter: FlexibleRouterModule<FlexibleExtractor>;
    protected container: Container;

    private static _instance: FlexibleAppBuilder;
    public static get instance() {
        return this._instance || (this._instance = new FlexibleAppBuilder());
    }

    private constructor() {
        this.reset();
    }

    createApp(): FlexibleApp {

        this.container || (this.container = new Container());
        this.logger || (this.logger = new ConsoleLoggerModule());
        this.router || (this.router = new FlexibleTreeRouterModule());
        this.extractorsRouter || (this.extractorsRouter = new FlexibleTreeRouterModule());

        var app =  new FlexibleApp(
            new SetupManager(
                this.frameworks,
                this.eventSources,
                this.logger,
                this.router,
                this.extractorsRouter,
                this.modules,
                this.container)
        );

        this.reset();
        return app;
    }

    
    addModule(fmodule: FlexibleModule): this {
        this.modules.push(fmodule);
        return this;
    }

    addFramework(framework: FlexibleFrameworkModule): this {
        this.frameworks.push(framework);
        return this;
    }

    addEventSource(eventSource: FlexibleEventSourceModule): this {
        this.eventSources.push(eventSource);
        return this;
    }

    withRouter(router: FlexibleRouterModule<FlexiblePipeline>): this {
        this.router = router;
        return this;
    }

    withExtractorsRouter(router: FlexibleRouterModule<FlexibleExtractor>): this {
        this.extractorsRouter = router;
        return this;
    }

    withContainer(container: Container): this {
        this.container = container;
        return this;
    }

    withLogger(logger: FlexibleLoggerModule): this {
        this.logger = logger;
        return this;
    }

    reset(): this {
        this.frameworks = [];
        this.eventSources = [];
        this.container = null;
        this.logger = null;
        this.router = null;
        this.extractorsRouter = null;
        return this;
    }
}