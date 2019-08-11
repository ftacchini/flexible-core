import { FlexibleEventSource } from "../event/flexible-event-source";
import { FlexiblePipeline } from "./pipeline/flexible-pipeline";
import { FlexibleRouter } from "../router/flexible-router";
import { FlexibleLogger } from "../logging/flexible-logger";
import { SetupManager } from "./setup/setup-manager";

export class FlexibleApp {

    private logger: FlexibleLogger;
    private eventSources: FlexibleEventSource[];
    private router: FlexibleRouter<FlexiblePipeline>;
    private initialized: boolean;

    public constructor(private setupManager: SetupManager) {
    }

    public async setUp(): Promise<FlexibleRouter<FlexiblePipeline>> {

        if (!this.initialized) {
            
            try {
                var that = this;

                await this.setupManager.initialize({
                    get router() {
                        return that.router;
                    },
                    set router(router: FlexibleRouter<FlexiblePipeline>) {
                        that.router = router
                    },
                    get eventSources() {
                        return that.eventSources;
                    },
                    set eventSources(eventSources: FlexibleEventSource[]) {
                        that.eventSources = eventSources
                    },
                    get logger() {
                        return that.logger;
                    },
                    set logger(logger: FlexibleLogger) {
                        that.logger = logger
                    }
                });

                this.initialized = true;
            }
            catch (err) {
                this.logger && this.logger.emergency(JSON.stringify(err));
                this.initialized = false;
                throw err;
            }
        }

        return this.router;
    }

    public async run(): Promise<any[]> {
        var router = await this.setUp();
        var promises = this.eventSources.map(source => this.runEventSource(router, source))
        var results = await Promise.all(promises);

        return results;
    }

    private async runEventSource(router: FlexibleRouter<FlexiblePipeline>, eventSource: FlexibleEventSource): Promise<boolean> {
        eventSource.onEvent(async event => {
            //Events should be routable by event type.
            event.routeData.eventType = event.eventType;
            var pipelines = router.getEventResources(event);
            var responses = await Promise.all(pipelines.map(pipeline => pipeline.processEvent(event)));
            return responses;
        })

        return eventSource.run();
    }

    public async stop(): Promise<any[]> {
        var promises = this.eventSources.map(s => {
            return s.stop()
        })

        return Promise.all(promises);
    }
}