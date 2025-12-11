import { FlexibleAppState } from "../flexible-app-state";
import { FlexibleLogger } from "../../logging/flexible-logger";
import { FlexibleEventSource } from "../../event";
import { flatten, filter, includes } from "lodash";
import { injectable, inject } from "tsyringe";
import { FLEXIBLE_APP_TYPES } from "../flexible-app-types";

const DUPLICATE_EVENT_TYPES = (types: String[]) => `There is more than one eventSource that emits events with the same type: ${types}`;

@injectable()
export class SetupEventSourcesCommand {

    constructor(
        @inject(FLEXIBLE_APP_TYPES.LOGGER) private logger: FlexibleLogger,
        @inject(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER) private eventSourcesProvider: () => FlexibleEventSource[]) {

    }

    public execute(app: FlexibleAppState) {
        this.logger.debug("Setting up event sources...");
        app.eventSources = this.eventSourcesProvider();
        this.logger.debug(`Analysing events for ${app.eventSources.length || 0} event sources...`);
        this.duplicateEventTypesWarning(app.eventSources);
        this.logger.debug(`Setup done for ${app.eventSources.length || 0} event sources\n`);
    }

    private duplicateEventTypesWarning(eventSources: FlexibleEventSource[]): void {
        var eventTypes = flatten(eventSources.map(es => es.availableEventTypes));
        var duplicates = filter(eventTypes, (val, i, iteratee) => includes(iteratee, val, i + 1)).filter((v): v is String => v !== undefined);

        if (duplicates.length) {
            this.logger.warning(DUPLICATE_EVENT_TYPES(duplicates));
        }

        this.logger.debug(`Your app will process ${eventTypes.length || 0} event types...`);
    }
}