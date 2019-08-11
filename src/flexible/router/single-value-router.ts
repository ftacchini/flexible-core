import { FlexibleRouter } from "../../router";
import { FlexibleFilter, FlexibleEvent } from "../../event";

export class SingleValueRouter<Resource> implements FlexibleRouter<Resource> {

    constructor(private resource: Resource) {
    }
    
    public addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void {
        throw "Cannot add resources to a single value router"
    }
    
    public getEventResources(event: FlexibleEvent): Resource[] {
        return [this.resource]
    }
}