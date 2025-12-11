import { FlexibleRouter } from "../../router";
import { FlexibleProvider } from "../../module/flexible-provider";
import { FlexibleContainer } from "../../container/flexible-container";

export class FlexibleRouterFactory<Resource> {

    constructor(
        private container: FlexibleContainer,
        private routerProvider: FlexibleProvider<FlexibleRouter<Resource>>) {

        }

    createRouter(): FlexibleRouter<Resource> {
        return this.routerProvider.getInstance(this.container);
    }
}