import { FlexibleEvent } from "../../event";
import { FlexibleActivationContext } from "../../framework/flexible-activation-context";
import { FlexibleResponse } from "../flexible-response";
import { FlexibleParametersExtractor } from "./flexible-parameters-extractor";

export class FlexibleMiddleware {

    private readonly isErrorMiddleware: boolean;

    constructor(
        private activationContext: FlexibleActivationContext, 
        private paramsExtractor: FlexibleParametersExtractor) {
    }

    public async processEvent(event: FlexibleEvent, response: FlexibleResponse): Promise<any> {
        if(!this.isErrorMiddleware && !response.errorStack.length ||
            this.isErrorMiddleware && response.errorStack.length) {
                var params = await this.paramsExtractor.extractParams(event, response);
                return await this.activationContext.activate.apply(this.activationContext, params);
        }
    }
}