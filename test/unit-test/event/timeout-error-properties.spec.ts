import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { TimeoutError } from "../../../src/event";

describe("TimeoutError Property-Based Tests", () => {

    /**
     * Feature: timeout-cancellation-support, Property 3: TimeoutError structure
     * Validates: Requirements 1.3, 6.1
     */
    it("Property 3: TimeoutError structure", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 300000 }), // timeout: 1ms to 5 minutes
                fc.integer({ min: 1, max: 300000 }), // elapsed: 1ms to 5 minutes
                fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                (timeout, elapsed, customMessage) => {
                    // Create a TimeoutError
                    const error = new TimeoutError(timeout, elapsed, customMessage);

                    // Verify the error structure
                    const extendsError = error instanceof Error;
                    const hasCorrectName = error.name === "TimeoutError";
                    const hasTimeoutProperty = typeof error.timeout === 'number' && error.timeout === timeout;
                    const hasElapsedProperty = typeof error.elapsed === 'number' && error.elapsed === elapsed;
                    const hasMessage = typeof error.message === 'string' && error.message.length > 0;
                    const hasStack = typeof error.stack === 'string';

                    // If custom message provided, verify it's used
                    const messageCorrect = customMessage
                        ? error.message === customMessage
                        : error.message.includes(`${elapsed}ms`) && error.message.includes(`${timeout}ms`);

                    return extendsError &&
                           hasCorrectName &&
                           hasTimeoutProperty &&
                           hasElapsedProperty &&
                           hasMessage &&
                           messageCorrect &&
                           hasStack;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should be catchable as Error", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10000 }),
                fc.integer({ min: 1, max: 10000 }),
                (timeout, elapsed) => {
                    try {
                        throw new TimeoutError(timeout, elapsed);
                    } catch (error) {
                        return error instanceof Error &&
                               error instanceof TimeoutError &&
                               (error as TimeoutError).timeout === timeout &&
                               (error as TimeoutError).elapsed === elapsed;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
