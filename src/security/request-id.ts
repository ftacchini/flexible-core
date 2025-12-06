import { randomBytes } from 'crypto';
import { SecurityError, SecurityErrorCodes } from './security-error';

/**
 * Configuration options for Request ID validation.
 */
export interface RequestIdConfig {
    /**
     * Maximum length of request ID (default: 256)
     */
    maxLength?: number;

    /**
     * Regular expression pattern for valid characters
     * Default: alphanumeric + hyphens + underscores
     */
    pattern?: RegExp;
}

/**
 * Value object representing a validated Request ID.
 *
 * RequestId is an immutable value object following Domain-Driven Design principles.
 * It encapsulates a request ID string and ensures it meets security requirements
 * to prevent header injection and log injection attacks.
 *
 * ## Security Considerations
 *
 * - **Length limits**: Prevents memory exhaustion and header size attacks
 * - **Character restrictions**: Prevents header injection and log injection
 * - **Immutability**: Once created, the ID cannot be changed
 * - **Validation**: All IDs are validated at creation time
 *
 * ## Default Rules
 *
 * - Maximum 256 characters
 * - Alphanumeric characters, hyphens, and underscores only
 * - No control characters or special characters
 *
 * @example
 * ```typescript
 * // Create from existing ID
 * const requestId = RequestId.from('abc-123_xyz');
 * console.log(requestId.value); // 'abc-123_xyz'
 *
 * // Generate new ID
 * const newId = RequestId.generate();
 *
 * // Create or generate if invalid
 * const id = RequestId.fromOrGenerate(userProvidedId);
 *
 * // Use in headers
 * response.setHeader('X-Request-ID', requestId.toString());
 * ```
 */
export class RequestId {
    private readonly _value: string;

    /**
     * Default pattern: alphanumeric + hyphens + underscores
     */
    public static readonly DEFAULT_PATTERN = /^[a-zA-Z0-9\-_]+$/;

    /**
     * Default maximum length
     */
    public static readonly DEFAULT_MAX_LENGTH = 256;

    /**
     * Private constructor to enforce factory method pattern.
     * Use static factory methods to create instances.
     *
     * @param value - The validated request ID string
     */
    private constructor(value: string) {
        this._value = value;
    }

    /**
     * Gets the request ID value.
     */
    public get value(): string {
        return this._value;
    }

    /**
     * Creates a RequestId from an existing string.
     *
     * Validates the string and throws an error if invalid.
     *
     * @param value - The request ID string to validate
     * @param config - Optional validation configuration
     * @returns A new RequestId instance
     * @throws SecurityError if the value is invalid
     *
     * @example
     * ```typescript
     * try {
     *     const requestId = RequestId.from('abc-123_xyz');
     *     console.log(requestId.value);
     * } catch (error) {
     *     console.error('Invalid request ID:', error.message);
     * }
     * ```
     */
    public static from(value: string, config: RequestIdConfig = {}): RequestId {
        const maxLength = config.maxLength ?? RequestId.DEFAULT_MAX_LENGTH;
        const pattern = config.pattern ?? RequestId.DEFAULT_PATTERN;

        // Validate
        if (!value || value.length === 0) {
            throw new SecurityError(
                'Request ID cannot be empty',
                SecurityErrorCodes.INVALID_REQUEST_ID,
                400,
                { value }
            );
        }

        if (value.length > maxLength) {
            throw new SecurityError(
                `Request ID exceeds maximum length of ${maxLength} characters`,
                SecurityErrorCodes.INVALID_REQUEST_ID,
                400,
                { value: value.substring(0, 50) + '...', length: value.length, maxLength }
            );
        }

        if (!pattern.test(value)) {
            throw new SecurityError(
                'Request ID contains invalid characters',
                SecurityErrorCodes.INVALID_REQUEST_ID,
                400,
                { value: value.substring(0, 50) }
            );
        }

        return new RequestId(value);
    }

    /**
     * Attempts to create a RequestId from a string, returning null if invalid.
     *
     * This is useful when you want to handle validation failures without exceptions.
     *
     * @param value - The request ID string to validate
     * @param config - Optional validation configuration
     * @returns A new RequestId instance or null if invalid
     *
     * @example
     * ```typescript
     * const requestId = RequestId.tryFrom(userInput);
     * if (requestId) {
     *     console.log('Valid ID:', requestId.value);
     * } else {
     *     console.log('Invalid ID, generating new one');
     *     const newId = RequestId.generate();
     * }
     * ```
     */
    public static tryFrom(value: string, config: RequestIdConfig = {}): RequestId | null {
        try {
            return RequestId.from(value, config);
        } catch (error) {
            return null;
        }
    }

    /**
     * Creates a RequestId from a string, or generates a new one if invalid.
     *
     * This ensures you always get a valid RequestId without throwing errors.
     *
     * @param value - The request ID string to validate (optional)
     * @param config - Optional validation configuration
     * @returns A new RequestId instance (validated or generated)
     *
     * @example
     * ```typescript
     * // Always returns a valid RequestId
     * const requestId = RequestId.fromOrGenerate(req.headers['x-request-id']);
     * ```
     */
    public static fromOrGenerate(value?: string, config: RequestIdConfig = {}): RequestId {
        if (!value) {
            return RequestId.generate();
        }

        const requestId = RequestId.tryFrom(value, config);
        return requestId ?? RequestId.generate();
    }

    /**
     * Generates a new cryptographically secure RequestId.
     *
     * Uses crypto.randomBytes to generate a URL-safe base64 string.
     *
     * @returns A new RequestId instance
     *
     * @example
     * ```typescript
     * const requestId = RequestId.generate();
     * console.log(requestId.value);
     * // Returns something like: 'a1b2c3d4e5f6g7h8i9j0'
     * ```
     */
    public static generate(): RequestId {
        // Generate 16 random bytes and convert to URL-safe base64
        const value = randomBytes(16)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return new RequestId(value);
    }

    /**
     * Returns the string representation of the RequestId.
     *
     * @returns The request ID string
     */
    public toString(): string {
        return this._value;
    }

    /**
     * Checks equality with another RequestId.
     *
     * @param other - The other RequestId to compare
     * @returns True if the values are equal
     *
     * @example
     * ```typescript
     * const id1 = RequestId.from('abc-123');
     * const id2 = RequestId.from('abc-123');
     * console.log(id1.equals(id2)); // true
     * ```
     */
    public equals(other: RequestId): boolean {
        return this._value === other._value;
    }

    /**
     * Returns a JSON representation of the RequestId.
     *
     * @returns The request ID string
     */
    public toJSON(): string {
        return this._value;
    }
}
