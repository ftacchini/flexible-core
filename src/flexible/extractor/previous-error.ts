import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { FlexibleResponse } from "../flexible-response";

export class PreviousError implements FlexibleExtractor {
    public get staticRouting(): RouteData {
        return {};
    }
    public extractValue(event: FlexibleEvent, response: FlexibleResponse): any {
        return response.errorStack && 
            response.errorStack.length && 
            response.errorStack[response.errorStack.length -1];
    }
}