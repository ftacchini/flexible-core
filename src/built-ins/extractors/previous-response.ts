import { FlexibleExtractor } from "../../extension-points/routing/extractor.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { RouteData } from "../../extension-points/routing/route-data";
import { FlexibleResponse } from "../../extension-points/event-source/response";
import { injectable } from "tsyringe";

@injectable()
export class PreviousResponse implements FlexibleExtractor {
    public get staticRouting(): RouteData<string> {
        return {};
    }

    public async extractValue(
        event: FlexibleEvent,
        response: FlexibleResponse,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any> {
        return response.responseStack &&
            response.responseStack.length &&
            response.responseStack[response.responseStack.length -1];
    }
}
