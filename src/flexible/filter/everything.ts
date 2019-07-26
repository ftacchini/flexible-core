import { FlexibleFilter } from "../../event";
import { RouteData } from "../../router";

export class Everything implements FlexibleFilter {
    
    public get staticRouting(): RouteData {
        return {};
    }
}