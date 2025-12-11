import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { FlexibleResponse } from "../flexible-response";
import { injectable } from "tsyringe";

@injectable()
export class PreviousResponse implements FlexibleExtractor {
    public get staticRouting(): RouteData<string> {
        return {};
    }

    public async extractValue(event: FlexibleEvent, response: FlexibleResponse): Promise<any> {
        return response.responseStack &&
            response.responseStack.length &&
            response.responseStack[response.responseStack.length -1];
    }
}