import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { FlexibleResponse } from "../flexible-response";
import { injectable } from "tsyringe";

@injectable()
export class PreviousError implements FlexibleExtractor {
    public get staticRouting(): RouteData<string> {
        return {};
    }
    public async extractValue(event: FlexibleEvent, response: FlexibleResponse): Promise<any> {
        return response.errorStack &&
            response.errorStack.length &&
            response.errorStack[response.errorStack.length -1];
    }
}