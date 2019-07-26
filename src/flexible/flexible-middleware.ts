import { FlexibleEvent, FlexibleExtractor } from "../event";
import { FlexibleActivationContext } from "../framework/flexible-activation-context";
import { FlexibleResponse } from "./flexible-response";
import { FlexibleRouter } from "../router";

export class FlexibleMiddleware {

    private readonly isErrorMiddleware: boolean;

    constructor(
        private activationContext: FlexibleActivationContext, 
        private extractorRouter: FlexibleRouter<FlexibleExtractor>) {
    }

    public async processEvent(event: FlexibleEvent, response: FlexibleResponse): Promise<any> {
        if(this.isErrorMiddleware && response.errorStack.length) {
        
        }

        var extractors = this.extractorRouter.getEventResources(event);
        var params = await Promise.all(extractors.map(e => e.extractValue(event)));
        return await this.activationContext.activate(params);
    }
}