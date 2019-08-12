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

    public extractParams(event: FlexibleEvent, response: FlexibleResponse): any[] {
       return this.extractorRouters.map(router => {
            let extractors = router.getEventResources(event, {})
            return extractors[0].extractValue(event, response);
        });
    }

}