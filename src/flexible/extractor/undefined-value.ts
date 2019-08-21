import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";

export class UndefinedValue implements FlexibleExtractor {

    public get staticRouting(): RouteData<string> {
        return {};
    }
    public extractValue(event: FlexibleEvent): any {
        return undefined;
    }
}