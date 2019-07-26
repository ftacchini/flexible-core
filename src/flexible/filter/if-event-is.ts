import { FlexibleFilter } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "inversify";

@injectable()
export class IfEventIs implements FlexibleFilter {

    public eventType: string | string[] = [];

    public get staticRouting(): RouteData {
        return {
            eventType: this.eventType
        };
    }
}