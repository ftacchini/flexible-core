import { FlexibleFilter, FlexibleEvent } from "../event";

export interface FlexibleRouter<Resource> {
    addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void;
    getEventResources(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Resource[];
}