import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "inversify";

@injectable()
export class EventData implements FlexibleExtractor{
    public get staticRouting(): RouteData<string> {
        return {};
    }
    public async extractValue(event: FlexibleEvent): Promise<any> {
        return event && event.data;
    }
}