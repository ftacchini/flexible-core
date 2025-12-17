import "reflect-metadata";
import { container, DependencyContainer } from "tsyringe";
import { TimeoutService, TIMEOUT_SERVICE_TYPES, TimeoutServiceConfig } from "../../src/built-ins/middleware/timeout/timeout-service";
import { CancellationService, CANCELLATION_SERVICE_TYPES } from "../../src/built-ins/middleware/cancellation/cancellation-service";
import { FlexibleLogger } from "../../src/extension-points/logging/logger.interface";

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
 * Test utilities for TimeoutService.
 */
export class TestTimeoutService {
    /**
     * Creates a TimeoutService instance with the specified timeout.
     * Uses a silent mock logger by default.
     *
     * @param timeout - Timeout duration in milliseconds
     * @returns TimeoutService instance
     */
    static create(timeout: number): TimeoutService {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
            useValue: { timeout }
        });
        testContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        return testContainer.resolve(TimeoutService);
    }

    /**
     * Creates a TimeoutService instance with a mock logger for testing.
     * Returns both the middleware and the logger so tests can verify log calls.
     *
     * @param timeout - Timeout duration in milliseconds (default: 5000)
     * @returns Object containing middleware and mock logger
     */
    static createWithMockLogger(timeout: number = 5000): { middleware: TimeoutService; logger: MockLogger } {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(TIMEOUT_SERVICE_TYPES.CONFIG, {
            useValue: { timeout }
        });
        testContainer.register(TIMEOUT_SERVICE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        const middleware = testContainer.resolve(TimeoutService);

        return { middleware, logger: mockLogger };
    }
}

/**
 * Test utilities for CancellationService.
 */
export class TestCancellationService {
    /**
     * Creates a CancellationService instance.
     * Uses a silent mock logger by default.
     *
     * @returns CancellationService instance
     */
    static create(): CancellationService {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        return testContainer.resolve(CancellationService);
    }

    /**
     * Creates a CancellationService instance with a mock logger for testing.
     * Returns both the middleware and the logger so tests can verify log calls.
     *
     * @returns Object containing middleware and mock logger
     */
    static createWithMockLogger(): { middleware: CancellationService; logger: MockLogger } {
        const testContainer = container.createChildContainer();
        const mockLogger = createMockLogger();

        testContainer.register(CANCELLATION_SERVICE_TYPES.LOGGER, {
            useValue: mockLogger
        });

        const middleware = testContainer.resolve(CancellationService);

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
