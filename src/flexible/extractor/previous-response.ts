import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { FlexibleResponse } from "../flexible-response";

export class PreviousResponse implements FlexibleExtractor {
    public get staticRouting(): RouteData {
        return {};
    }
    public extractValue(event: FlexibleEvent, response: FlexibleResponse): any {
        return response.responseStack && 
            response.responseStack.length && 
            response.responseStack[response.responseStack.length -1];
    }
}