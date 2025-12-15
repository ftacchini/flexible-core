import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { FlexibleEvent } from "../../../src/event";
import { RouteData } from "../../../src/router/route-data";

describe("FlexibleEvent Cancellation Token Property-Based Tests", () => {

    /**
     * Feature: timeout-cancellation-support, Property 7: Cancellation token storage
     * Validates: Requirements 3.1
     */
    it("Property 7: Cancellation token storage", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                (data, eventType, routePath, requestId) => {
                    // Create an AbortController and get its signal
                    const abortController = new AbortController();
                    const cancellationToken = abortController.signal;

                    // Create a FlexibleEvent with a cancellation token
                    const event: FlexibleEvent = {
                        data,
                        routeData: { route: routePath } as RouteData<string>,
                        eventType,
                        requestId,
                        cancellationToken
                    };

                    // Verify the token is stored and accessible
                    return event.cancellationToken === cancellationToken &&
                           event.cancellationToken instanceof AbortSignal;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: timeout-cancellation-support, Property 8: AbortSignal compatibility
     * Validates: Requirements 3.4
     */
    it("Property 8: AbortSignal compatibility", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.boolean(),
                (data, eventType, routePath, shouldAbort) => {
                    // Create an AbortController
                    const abortController = new AbortController();

                    // Optionally abort it
                    if (shouldAbort) {
                        abortController.abort();
                    }

                    // Create a FlexibleEvent with the AbortSignal
                    const event: FlexibleEvent = {
                        data,
                        routeData: { route: routePath } as RouteData<string>,
                        eventType,
                        cancellationToken: abortController.signal
                    };

                    // Verify the AbortSignal interface is supported
                    const token = event.cancellationToken;
                    if (!token) return false;

                    // Check standard AbortSignal properties
                    const hasAbortedProperty = typeof token.aborted === 'boolean';
                    const abortedMatchesExpected = token.aborted === shouldAbort;
                    const hasReasonProperty = 'reason' in token;
                    const isAbortSignal = token instanceof AbortSignal;

                    return hasAbortedProperty &&
                           abortedMatchesExpected &&
                           hasReasonProperty &&
                           isAbortSignal;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should support events without cancellation tokens (backward compatibility)", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (data, eventType, routePath) => {
                    // Create a FlexibleEvent without a cancellation token
                    const event: FlexibleEvent = {
                        data,
                        routeData: { route: routePath } as RouteData<string>,
                        eventType
                    };

                    // Verify the event is valid and cancellationToken is undefined
                    return event.cancellationToken === undefined &&
                           event.data === data &&
                           event.eventType === eventType;
                }
            ),
            { numRuns: 100 }
        );
    });
});
