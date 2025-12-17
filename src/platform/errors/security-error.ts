/**
 * Error codes for security-related errors.
 *
 * These codes help identify the specific security issue that occurred
 * and can be used for logging, monitoring, and error handling.
 */
export const SecurityErrorCodes = {
    /** Rate limit exceeded */
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    /** Invalid request ID format */
    INVALID_REQUEST_ID: 'INVALID_REQUEST_ID',

    /** Request size exceeds limits */
    REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',

    /** Invalid input format or pattern */
    INVALID_INPUT: 'INVALID_INPUT',

    /** CORS validation failed */
    CORS_VALIDATION_FAILED: 'CORS_VALIDATION_FAILED',

    /** Generic security validation failed */
    SECURITY_VALIDATION_FAILED: 'SECURITY_VALIDATION_FAILED',
} as const;

export type SecurityErrorCode = typeof SecurityErrorCodes[keyof typeof SecurityErrorCodes];

/**
 * Base error class for security-related errors.
 *
 * SecurityError extends the standard Error class with additional context
 * for security violations, including error codes, HTTP status codes,
 * and structured metadata.
 *
 * @example
 * ```typescript
 * throw new SecurityError(
 *     'Rate limit exceeded',
 *     SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
 *     429,
 *     { limit: 100, window: '1m', clientId: 'abc123' }
 * );
 * ```
 */
export class SecurityError extends Error {
    /**
     * Security-specific error code for categorization
     */
    public readonly code: SecurityErrorCode;

    /**
     * HTTP status code to return (e.g., 429, 413, 400)
     */
    public readonly statusCode: number;

    /**
     * Additional metadata about the error
     */
    public readonly metadata?: Record<string, any>;

    /**
     * Creates a new SecurityError.
     *
     * @param message - Human-readable error message
     * @param code - Security error code from SecurityErrorCodes
     * @param statusCode - HTTP status code (default: 400)
     * @param metadata - Additional context about the error
     */
    constructor(
        message: string,
        code: SecurityErrorCode,
        statusCode: number = 400,
        metadata?: Record<string, any>
    ) {
        super(message);
        this.name = 'SecurityError';
        this.code = code;
        this.statusCode = statusCode;
        this.metadata = metadata;

        // Maintains proper stack trace for where error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SecurityError);
        }
    }

    /**
     * Converts the error to a JSON-serializable object.
     *
     * Useful for logging and API responses.
     *
     * @returns Object representation of the error
     */
    public toJSON(): Record<string, any> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            metadata: this.metadata,
        };
    }
}
