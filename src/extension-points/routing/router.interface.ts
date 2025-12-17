import { FlexibleFilter } from "./filter.interface";
import { FlexibleEvent } from "../event-source/event";

export interface FlexibleRouter<Resource> {
    addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void;
    getEventResources(event: FlexibleEvent, filterBinnacle: { [key: string]: string }): Promise<Resource[]>;
}
