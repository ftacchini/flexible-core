import { FlexibleExtractor } from "../../extension-points/routing/extractor.interface";
import { FlexibleEvent } from "../../extension-points/event-source/event";
import { RouteData } from "../../extension-points/routing/route-data";
import { FlexibleResponse } from "../../extension-points/event-source/response";
import { injectable } from "tsyringe";

/**
 * Extractor that provides access to the context binnacle.
 *
 * The context binnacle is a request-scoped storage object that middleware
 * can use to share data within a single request pipeline.
 *
 * This is useful for middleware like TimeoutService and CancellationService
 * that need to store timing information or cancellation tokens.
 *
 * @example
 * ```typescript
 * @BeforeExecution(TimeoutService, 'processEvent')
 * @Route(HttpGet)
 * public async handleRequest(
 *     @Param(ContextBinnacle) contextBinnacle: { [key: string]: any },
 *     @Param(FullEvent) event: FlexibleEvent
 * ) {
 *     // contextBinnacle is available here
 * }
 * ```
 */
@injectable()
export class ContextBinnacle implements FlexibleExtractor {
    public get staticRouting(): RouteData<string> {
        return {};
    }

    public async extractValue(
        event: FlexibleEvent,
        response: FlexibleResponse,
        filterBinnacle: { [key: string]: string },
        contextBinnacle: { [key: string]: any }
    ): Promise<any> {
        return contextBinnacle;
    }
}
