import { FlexibleEvent } from "../../event";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleResponse } from "../flexible-response";

export class FlexiblePipeline {

    constructor(private middlewareStack: FlexibleMiddleware[]) {

    }

    public async processEvent(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Promise<FlexibleResponse> {
        
        let response: FlexibleResponse = {
            errorStack: [],
            responseStack: []
        }

        for(var i = 0; i < this.middlewareStack.length; i++) {
            try {
                var newResponse = await this.middlewareStack[i].processEvent(event, response, filterBinnacle);
                response.responseStack.push(newResponse);
            }
            catch(ex) {
                response.errorStack.push(ex);
            }
        }

        return response;
    }
}