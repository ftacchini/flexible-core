import { FlexibleRouter } from "../../router";
import { Container } from "inversify";
import { FlexibleProvider } from "../../module/flexible-provider";

export class FlexibleRouterFactory<Resource> {

    constructor(
        private container: Container,
        private routerProvider: FlexibleProvider<FlexibleRouter<Resource>>) {

        }

    createRouter(): FlexibleRouter<Resource> {
        return this.routerProvider.getInstance(this.container);
    }
}