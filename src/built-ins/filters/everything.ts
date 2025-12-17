import { FlexibleFilter } from "../../extension-points/routing/filter.interface";
import { RouteData } from "../../extension-points/routing/route-data";

export class Everything implements FlexibleFilter {

    public get staticRouting(): RouteData<string> {
        return {};
    }
}
