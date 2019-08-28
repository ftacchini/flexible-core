import { FlexibleExtractor, FlexibleEvent } from "../../event";
import { FlexibleRouter } from "../../router";
import { UndefinedValue } from "../extractor/undefined-value";
import { SingleValueRouter } from "../router/single-value-router";
import { FlexibleResponse } from "../flexible-response";

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

    public async extractParams(event: FlexibleEvent, response: FlexibleResponse): Promise<any[]> {
       return Promise.all(this.extractorRouters.map(async router => {
            return router.getEventResources(event, {}).then(extractors => {
                return extractors[0].extractValue(event, response);
            })
        }));
    }

}