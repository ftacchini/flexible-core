import { FlexibleExtractor } from "../../extension-points/routing/extractor.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { FlexibleRouter } from "../../extension-points/routing/router.interface";
import { UndefinedValue } from "../../built-ins/extractors/undefined-value";
import { SingleValueRouter } from "../routing/single-value-router";
import { FlexibleResponse } from "../../extension-points/event-source/response";

export class FlexibleParametersExtractor {

    private extractorRouters: FlexibleRouter<FlexibleExtractor>[] = [];

    constructor(extractorRoutersMap: {
        [paramIndex: number]: FlexibleRouter<FlexibleExtractor>
    }) {
        var keys = Object.keys(extractorRoutersMap).sort();

        for(let i = 0; i <= parseInt(keys[keys.length -1]); i++) {
            this.extractorRouters.push(extractorRoutersMap[i] || (extractorRoutersMap[i] = new SingleValueRouter(new UndefinedValue())))
        }
    }

    public async extractParams(
        event: FlexibleEvent,
        response: FlexibleResponse,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any[]> {
       return Promise.all(this.extractorRouters.map(async router => {
            return router.getEventResources(event, filterBinnacle).then(extractors => {
                return extractors[0].extractValue(event, response, filterBinnacle, contextBinnacle);
            })
        }));
    }

}
