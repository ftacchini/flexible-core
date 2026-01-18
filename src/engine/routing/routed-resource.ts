/**
 * A wrapper that combines a resource with its routing context (filterBinnacle).
 * 
 * This is used by routers to return resources along with the filter state
 * that was populated during route matching. The filterBinnacle contains
 * routing information like matched path patterns (e.g., "/users/:id").
 */
export class RoutedResource<Resource> {
    constructor(
        private resource: Resource,
        private filterBinnacle: { [key: string]: string }
    ) {}

    /**
     * Gets the underlying resource
     */
    public getResource(): Resource {
        return this.resource;
    }

    /**
     * Gets the filter context for this routed resource
     */
    public getFilterBinnacle(): { [key: string]: string } {
        return this.filterBinnacle;
    }
}
