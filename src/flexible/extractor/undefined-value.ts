import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "tsyringe";

@injectable()
export class UndefinedValue implements FlexibleExtractor {

    public get staticRouting(): RouteData<string> {
        return {};
    }
    public async extractValue(event: FlexibleEvent): Promise<any> {
        return undefined;
    }
}