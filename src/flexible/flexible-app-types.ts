export const FLEXIBLE_APP_TYPES = {
    CONTAINER: Symbol("FlexibleContainer"),
    LOGGER: Symbol("FlexibleLogger"),
    EVENT_SOURCES_PROVIDER: Symbol("FlexibleEventSourcesProvider"),
    FRAMEWORKS_PROVIDER: Symbol("FlexibleFrameworksProvider"),
    
    ROUTER_FACTORY: Symbol("FlexibleRouterFactory"),
    EXTRACTOR_ROUTER_FACTORY: Symbol("FlexibleExtractorRouterFactory"),
    RECIPE_FACTORY: Symbol("RecipeFactory"),
    MIDDLEWARE_FACTORY: Symbol("MiddlewareFactory"),
    PIPELINE_FACTORY: Symbol("PipelineFactory"),
}