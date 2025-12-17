import { FlexibleFilter } from "../../extension-points/routing/filter.interface";
import { RouteData } from "../../extension-points/routing/route-data";
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
