/**
 * Error thrown when an operation exceeds its configured timeout duration.
 *
 * TimeoutError extends the standard Error class with additional context
 * about the timeout configuration and actual elapsed time.
 *
 * @example
 * ```typescript
 * throw new TimeoutError(5000, 5234, 'Request processing exceeded timeout');
 * ```
 */
export class TimeoutError extends Error {
    /**
     * Error name identifier
     */
    public readonly name = "TimeoutError";

    /**
     * Configured timeout duration in milliseconds
     */
    public readonly timeout: number;

    /**
     * Actual elapsed time in milliseconds when timeout occurred
     */
    public readonly elapsed: number;

    /**
     * Creates a new TimeoutError.
     *
     * @param timeout - Configured timeout duration in milliseconds
     * @param elapsed - Actual elapsed time in milliseconds
     * @param message - Optional custom error message
     */
    constructor(timeout: number, elapsed: number, message?: string) {
        super(message || `Operation timed out after ${elapsed}ms (timeout: ${timeout}ms)`);
        this.timeout = timeout;
        this.elapsed = elapsed;

        // Maintains proper stack trace for where error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }
    }
}
