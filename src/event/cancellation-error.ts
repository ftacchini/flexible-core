/**
 * Error thrown when an operation is cancelled via a cancellation token.
 *
 * CancellationError extends the standard Error class with additional context
 * about the reason for cancellation.
 *
 * @example
 * ```typescript
 * throw new CancellationError('User cancelled request', 'Operation cancelled by user');
 * ```
 */
export class CancellationError extends Error {
    /**
     * Error name identifier
     */
    public readonly name = "CancellationError";

    /**
     * Reason for cancellation, if provided by the AbortSignal
     */
    public readonly reason?: string;

    /**
     * Creates a new CancellationError.
     *
     * @param reason - Optional reason for cancellation
     * @param message - Optional custom error message
     */
    constructor(reason?: string, message?: string) {
        super(message || (reason ? `Operation cancelled: ${reason}` : 'Operation cancelled'));
        this.reason = reason;

        // Maintains proper stack trace for where error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CancellationError);
        }
    }
}
