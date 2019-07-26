import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "inversify";

@injectable()
export class EventType implements FlexibleExtractor{
    public get staticRouting(): RouteData {
        return {};
    }

    public extractValue(event: FlexibleEvent): any {
        return event && event.eventType;
    }
}