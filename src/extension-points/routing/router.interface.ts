import { FlexibleFilter } from "./filter.interface";
import { FlexibleEvent } from "../event-source/event";
import { RoutedResource } from "../../engine/routing/routed-resource";

export interface FlexibleRouter<Resource> {
    addResource(filters: (FlexibleFilter | FlexibleFilter[])[], pipelines: Resource): void;
    getEventResources(event: FlexibleEvent): Promise<RoutedResource<Resource>[]>;
}
