import { FlexibleRouter } from "../../extension-points/routing/router.interface";
import { FlexibleFilter } from "../../extension-points/routing/filter.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";

export class SingleValueRouter<Resource> implements FlexibleRouter<Resource> {

    constructor(private resource: Resource) {
    }

    public addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void {
        throw "Cannot add resources to a single value router"
    }

    public async getEventResources(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Promise<Resource[]> {
        return [this.resource]
    }
}
