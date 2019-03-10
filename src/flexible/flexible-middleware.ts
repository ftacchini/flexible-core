import { FlexibleEvent, FlexibleExtractor } from "../event";
import { FlexibleActivationContext } from "../framework/flexible-activation-context";
import { FlexibleResponse } from "./flexible-response";

export class FlexibleMiddleware {

    private readonly isErrorMiddleware: boolean;

    constructor(
        private activationContext: FlexibleActivationContext, 
        private extractors: FlexibleExtractor[]) {
    }

    public async processEvent(event: FlexibleEvent, response: FlexibleResponse): Promise<any> {
        if(this.isErrorMiddleware && response.errorStack.length) {
            var params = Promise.all(this.extractors.map(e => e.extractValue(event)));
            return await this.activationContext.activate(params);
        }
    }
}