import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { RouteData } from "../../router";
import { injectable } from "tsyringe";

/**
 * Extractor that returns the full FlexibleEvent object.
 *
 * This is useful for composable applications where you need to forward
 * the entire event (including routeData) to another layer.
 */
@injectable()
export class FullEvent implements FlexibleExtractor {
    public get staticRouting(): RouteData<string> {
        return {};
    }

    public async extractValue(
        event: FlexibleEvent,
        response: any,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any> {
        return event;
    }
}
