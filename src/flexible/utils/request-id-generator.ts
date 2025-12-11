import { injectable } from "tsyringe";

/**
 * Generates unique request IDs for tracking request lifecycle.
 * Uses a combination of timestamp and random values for uniqueness.
 */
@injectable()
export class RequestIdGenerator {
    private counter: number = 0;

    /**
     * Generates a unique request ID.
     * Format: timestamp-counter-random (e.g., "1701234567890-1-a3f2")
     *
     * @returns A unique request ID string
     */
    public generate(): string {
        const timestamp = Date.now();
        const count = ++this.counter;
        const random = Math.random().toString(36).substring(2, 6);
        return `${timestamp}-${count}-${random}`;
    }
}
