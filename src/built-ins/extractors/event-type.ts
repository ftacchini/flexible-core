import { FlexibleExtractor } from "../../extension-points/routing/extractor.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { RouteData } from "../../extension-points/routing/route-data";
import { injectable } from "tsyringe";

@injectable()
export class EventType implements FlexibleExtractor{
    public get staticRouting(): RouteData<string> {
        return {};
    }

    public async extractValue(
        event: FlexibleEvent,
        response: any,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any> {
        return event && event.eventType;
    }
}
