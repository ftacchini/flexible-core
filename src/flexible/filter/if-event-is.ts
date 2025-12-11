import { FlexibleFilter } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "tsyringe";

@injectable()
export class IfEventIs implements FlexibleFilter {

    public eventType: string | string[] = [];

    public get staticRouting(): RouteData<"eventType"> {
        return {
            eventType: this.eventType
        };
    }
}