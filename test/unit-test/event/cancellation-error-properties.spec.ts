import "reflect-metadata";
import "jasmine";
import * as fc from "fast-check";
import { CancellationError } from "../../../src/event";

describe("CancellationError Property-Based Tests", () => {

    /**
     * Feature: timeout-cancellation-support, Property 11: CancellationError structure
     * Validates: Requirements 4.3, 6.2
     */
    it("Property 11: CancellationError structure", () => {
        fc.assert(
            fc.property(
                fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                (reason, customMessage) => {
                    // Create a CancellationError
                    const error = new CancellationError(reason, customMessage);

                    // Verify the error structure
                    const extendsError = error instanceof Error;
                    const hasCorrectName = error.name === "CancellationError";
                    const hasReasonProperty = reason !== undefined
                        ? error.reason === reason
                        : error.reason === undefined;
                    const hasMessage = typeof error.message === 'string' && error.message.length > 0;
                    const hasStack = typeof error.stack === 'string';

                    // If custom message provided, verify it's used
                    // If reason provided but no custom message, verify reason is in message
                    let messageCorrect = true;
                    if (customMessage) {
                        messageCorrect = error.message === customMessage;
                    } else if (reason) {
                        messageCorrect = error.message.includes(reason);
                    } else {
                        messageCorrect = error.message === 'Operation cancelled';
                    }

                    return extendsError &&
                           hasCorrectName &&
                           hasReasonProperty &&
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
                fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                (reason) => {
                    try {
                        throw new CancellationError(reason);
                    } catch (error) {
                        return error instanceof Error &&
                               error instanceof CancellationError &&
                               (error as CancellationError).reason === reason;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should handle AbortSignal reasons", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                (reasonText) => {
                    // Simulate getting reason from AbortSignal
                    const abortController = new AbortController();
                    abortController.abort(reasonText);

                    const reason = abortController.signal.reason;
                    const error = new CancellationError(reason);

                    return error instanceof CancellationError &&
                           error.reason === reasonText;
                }
            ),
            { numRuns: 100 }
        );
    });
});
