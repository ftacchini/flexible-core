import { FlexibleEvent } from "../event";
import { FlexibleMiddleware } from "./flexible-middleware";
import { FlexibleResponse } from "./flexible-response";

export class FlexiblePipeline {

    constructor(private middlewareStack: FlexibleMiddleware[]) {

    }

    public async processEvent(event: FlexibleEvent): Promise<FlexibleResponse> {
        
        let response: FlexibleResponse = {
            errorStack: [],
            responseStack: []
        }

        for(var i = 0; i < this.middlewareStack.length; i++) {
            try {
                response = await this.middlewareStack[i].processEvent(event, response);
                response.responseStack.push(response);
            }
            catch(ex) {
                response.errorStack.push(ex);
            }
        }

        return response;
    }
}