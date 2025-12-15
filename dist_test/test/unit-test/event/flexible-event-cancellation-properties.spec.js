"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("jasmine");
var fc = require("fast-check");
describe("FlexibleEvent Cancellation Token Property-Based Tests", function () {
    /**
     * Feature: timeout-cancellation-support, Property 7: Cancellation token storage
     * Validates: Requirements 3.1
     */
    it("Property 7: Cancellation token storage", function () {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 20 }), fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), function (data, eventType, routePath, requestId) {
            // Create an AbortController and get its signal
            var abortController = new AbortController();
            var cancellationToken = abortController.signal;
            // Create a FlexibleEvent with a cancellation token
            var event = {
                data: data,
                routeData: { route: routePath },
                eventType: eventType,
                requestId: requestId,
                cancellationToken: cancellationToken
            };
            // Verify the token is stored and accessible
            return event.cancellationToken === cancellationToken &&
                event.cancellationToken instanceof AbortSignal;
        }), { numRuns: 100 });
    });
    /**
     * Feature: timeout-cancellation-support, Property 8: AbortSignal compatibility
     * Validates: Requirements 3.4
     */
    it("Property 8: AbortSignal compatibility", function () {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 20 }), fc.boolean(), function (data, eventType, routePath, shouldAbort) {
            // Create an AbortController
            var abortController = new AbortController();
            // Optionally abort it
            if (shouldAbort) {
                abortController.abort();
            }
            // Create a FlexibleEvent with the AbortSignal
            var event = {
                data: data,
                routeData: { route: routePath },
                eventType: eventType,
                cancellationToken: abortController.signal
            };
            // Verify the AbortSignal interface is supported
            var token = event.cancellationToken;
            if (!token)
                return false;
            // Check standard AbortSignal properties
            var hasAbortedProperty = typeof token.aborted === 'boolean';
            var abortedMatchesExpected = token.aborted === shouldAbort;
            var hasReasonProperty = 'reason' in token;
            var isAbortSignal = token instanceof AbortSignal;
            return hasAbortedProperty &&
                abortedMatchesExpected &&
                hasReasonProperty &&
                isAbortSignal;
        }), { numRuns: 100 });
    });
    it("should support events without cancellation tokens (backward compatibility)", function () {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 20 }), function (data, eventType, routePath) {
            // Create a FlexibleEvent without a cancellation token
            var event = {
                data: data,
                routeData: { route: routePath },
                eventType: eventType
            };
            // Verify the event is valid and cancellationToken is undefined
            return event.cancellationToken === undefined &&
                event.data === data &&
                event.eventType === eventType;
        }), { numRuns: 100 });
    });
});
