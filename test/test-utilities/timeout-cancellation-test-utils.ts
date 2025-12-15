import "reflect-metadata";
import { container, DependencyContainer } from "tsyringe";
import { TimeoutMiddleware, TIMEOUT_MIDDLEWARE_TYPES, TimeoutMiddlewareConfig } from "../../src/security/timeout-middleware";
import { CancellationMiddleware, CANCELLATION_MIDDLEWARE_TYPES } from "../../src/security/cancellation-middleware";
import { FlexibleLogger } from "../../src/logging/flexible-logger";

/**
 * Mock logger for testing purposes.
 */
export interface MockLogger extends FlexibleLogger {
    emergency: jasmine.Spy;
    alert: jasmine.Spy;
    crit: jasmine.Spy;
    error: jasmine.Spy;
    warning: jasmine.Spy;
    notice: jasmine.Spy;
    info: jasmine.Spy;
    debug: jasmine.Spy;
}

/**
 * Creates a mock logger with jasmine spies for all log methods.
 */
export function createMockLogger(): MockLogger {
    return {
        emergency: jasmine.createSpy('emergency'),
        alert: jasmine.createSpy('alert'),
        crit: jasmine.createSpy('crit'),
        error: jasmine.createSpy('error'),
        warning: jasmine.createSpy('warning'),
        notice: jasmine.createSpy('notice'),
        info: jasmine.createSpy('info'),
        debug: jasmine.createSpy('debug')
    };
}

/**
 * Test utilities for TimeoutMiddleware.
 */
export class TestTimeoutMiddleware {
    /**
     * Creates a TimeoutMiddleware instance with the specified timeout.
     * Uses a silent mock logger by default.
     *
     * @param timeout - Timeout duration in milliseconds
     * @returns TimeoutMiddleware instance
     */
    static create(timeout: number): TimeoutMiddleware {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
            useValue: { timeout }
        });
        testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        return testContainer.resolve(TimeoutMiddleware);
    }

    /**
     * Creates a TimeoutMiddleware instance with a mock logger for testing.
     * Returns both the middleware and the logger so tests can verify log calls.
     *
     * @param timeout - Timeout duration in milliseconds (default: 5000)
     * @returns Object containing middleware and mock logger
     */
    static createWithMockLogger(timeout: number = 5000): { middleware: TimeoutMiddleware; logger: MockLogger } {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.CONFIG, {
            useValue: { timeout }
        });
        testContainer.register(TIMEOUT_MIDDLEWARE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        const middleware = testContainer.resolve(TimeoutMiddleware);

        return { middleware, logger: mockLogger };
    }
}

/**
 * Test utilities for CancellationMiddleware.
 */
export class TestCancellationMiddleware {
    /**
     * Creates a CancellationMiddleware instance.
     * Uses a silent mock logger by default.
     *
     * @returns CancellationMiddleware instance
     */
    static create(): CancellationMiddleware {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        return testContainer.resolve(CancellationMiddleware);
    }

    /**
     * Creates a CancellationMiddleware instance with a mock logger for testing.
     * Returns both the middleware and the logger so tests can verify log calls.
     *
     * @returns Object containing middleware and mock logger
     */
    static createWithMockLogger(): { middleware: CancellationMiddleware; logger: MockLogger } {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(CANCELLATION_MIDDLEWARE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        const middleware = testContainer.resolve(CancellationMiddleware);

        return { middleware, logger: mockLogger };
    }
}

/**
 * Test utilities for AbortController.
 */
export class TestAbortController {
    /**
     * Creates an AbortController with an already-aborted signal.
     *
     * @param reason - Optional reason for the abort
     * @returns AbortController with aborted signal
     */
    static createAborted(reason?: string): AbortController {
        const controller = new AbortController();
        controller.abort(reason);
        return controller;
    }

    /**
     * Creates an AbortController that will abort after a specified delay.
     *
     * @param delayMs - Delay in milliseconds before aborting
     * @param reason - Optional reason for the abort
     * @returns AbortController that will abort after delay
     */
    static createWithDelay(delayMs: number, reason?: string): AbortController {
        const controller = new AbortController();

        setTimeout(() => {
            controller.abort(reason);
        }, delayMs);

        return controller;
    }

    /**
     * Creates a promise that resolves when the given signal is aborted.
     * Useful for testing async cancellation scenarios.
     *
     * @param signal - AbortSignal to monitor
     * @returns Promise that resolves when signal is aborted
     */
    static waitForAbort(signal: AbortSignal): Promise<void> {
        if (signal.aborted) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
        });
    }

    /**
     * Creates an AbortController and returns both the controller and a promise
     * that resolves when the signal is aborted.
     *
     * @returns Object containing controller and abort promise
     */
    static createWithAbortPromise(): { controller: AbortController; abortPromise: Promise<void> } {
        const controller = new AbortController();
        const abortPromise = TestAbortController.waitForAbort(controller.signal);

        return { controller, abortPromise };
    }
}
