import { FlexibleRouter } from "../../extension-points/routing/router.interface";
import { FlexibleProvider } from "../../platform/di/provider";
import { FlexibleContainer } from "../../platform/di/container";

export class FlexibleRouterFactory<Resource> {

    constructor(
        private container: FlexibleContainer,
        private routerProvider: FlexibleProvider<FlexibleRouter<Resource>>) {

        }

    createRouter(): FlexibleRouter<Resource> {
        return this.routerProvider.getInstance(this.container);
    }
}
