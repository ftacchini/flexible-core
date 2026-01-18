import { FlexibleRouter } from "../../extension-points/routing/router.interface";
import { FlexibleFilter } from "../../extension-points/routing/filter.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { RoutedResource } from "./routed-resource";

export class SingleValueRouter<Resource> implements FlexibleRouter<Resource> {

    constructor(private resource: Resource) {
    }

    public addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void {
        throw "Cannot add resources to a single value router"
    }

    public async getEventResources(event: FlexibleEvent): Promise<RoutedResource<Resource>[]> {
        // For single value routers (typically used for extractors), wrap the resource
        // with an empty filterBinnacle since extractors don't need routing context
        return [new RoutedResource(this.resource, {})];
    }
}
