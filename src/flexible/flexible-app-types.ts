/**
 * Injection tokens for flexible-core's dependency injection system.
 *
 * These symbols are used as injection tokens with TSyringe's DI container.
 * TSyringe's InjectionToken type supports: constructor<T> | string | symbol | DelayedConstructor<T>
 *
 * Using symbols provides type-safe, collision-free identifiers for dependency injection.
 * Each symbol is unique and cannot be accidentally duplicated, unlike string-based tokens.
 */
export const FLEXIBLE_APP_TYPES = {
    /** Injection token for the FlexibleContainer instance */
    CONTAINER: Symbol.for("FlexibleContainer"),

    /** Injection token for the FlexibleLogger instance */
    LOGGER: Symbol.for("FlexibleLogger"),

    /** Injection token for the event sources provider function */
    EVENT_SOURCES_PROVIDER: Symbol.for("FlexibleEventSourcesProvider"),

    /** Injection token for the frameworks provider function */
    FRAMEWORKS_PROVIDER: Symbol.for("FlexibleFrameworksProvider"),

    /** Injection token for the router factory */
    ROUTER_FACTORY: Symbol.for("FlexibleRouterFactory"),

    /** Injection token for the extractor router factory */
    EXTRACTOR_ROUTER_FACTORY: Symbol.for("FlexibleExtractorRouterFactory"),

    /** Injection token for the recipe factory */
    RECIPE_FACTORY: Symbol.for("RecipeFactory"),

    /** Injection token for the middleware factory */
    MIDDLEWARE_FACTORY: Symbol.for("MiddlewareFactory"),

    /** Injection token for the pipeline factory */
    PIPELINE_FACTORY: Symbol.for("PipelineFactory"),
} as const;