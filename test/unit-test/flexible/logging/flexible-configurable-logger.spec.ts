import "reflect-metadata";
import "jasmine";
import { FlexibleConfigurableLogger } from "../../../../src/flexible/logging/flexible-configurable-logger";
import { LogContext, LogLevel } from "../../../../src/logging/flexible-logger";
import { LoggerConfig } from "../../../../src/logging/logger-config";

describe("FlexibleConfigurableLogger", () => {
    let logger: FlexibleConfigurableLogger;
    let mockConsole: Console;
    let logOutput: string[];

    beforeEach(() => {
        logOutput = [];
        mockConsole = {
            log: (message: string) => {
                logOutput.push(message);
            }
        } as Console;
    });

    describe("text format", () => {
        beforeEach(() => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'text'
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);
        });

        it("should log messages in text format", () => {
            logger.info("Test message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("INFO: Test message");
        });

        it("should log messages with context in text format", () => {
            const context: LogContext = { requestId: "abc123", userId: 42 };
            logger.info("User action", context);

            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("INFO: User action");
            expect(logOutput[0]).toContain('"requestId":"abc123"');
            expect(logOutput[0]).toContain('"userId":42');
        });
    });

    describe("json format", () => {
        beforeEach(() => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'json'
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);
        });

        it("should log messages in JSON format", () => {
            logger.info("Test message");

            expect(logOutput.length).toBe(1);
            const parsed = JSON.parse(logOutput[0]);
            expect(parsed.level).toBe("INFO");
            expect(parsed.message).toBe("Test message");
        });

        it("should log messages with context in JSON format", () => {
            const context: LogContext = { requestId: "abc123", userId: 42 };
            logger.info("User action", context);

            expect(logOutput.length).toBe(1);
            const parsed = JSON.parse(logOutput[0]);
            expect(parsed.level).toBe("INFO");
            expect(parsed.message).toBe("User action");
            expect(parsed.requestId).toBe("abc123");
            expect(parsed.userId).toBe(42);
        });

        it("should include timestamp when configured", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'json',
                includeTimestamp: true
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            logger.info("Test message");

            const parsed = JSON.parse(logOutput[0]);
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it("should include hostname when configured", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'json',
                includeHostname: true
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            logger.info("Test message");

            const parsed = JSON.parse(logOutput[0]);
            expect(parsed.hostname).toBeDefined();
            expect(typeof parsed.hostname).toBe('string');
        });
    });

    describe("log level filtering", () => {
        it("should filter out logs below minimum level", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.WARNING,
                format: 'text'
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            logger.debug("Debug message");
            logger.info("Info message");
            logger.notice("Notice message");
            logger.warning("Warning message");
            logger.error("Error message");

            expect(logOutput.length).toBe(2);
            expect(logOutput[0]).toContain("WARNING");
            expect(logOutput[1]).toContain("ERROR");
        });

        it("should log all levels when minLevel is DEBUG", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'text'
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            logger.debug("Debug");
            logger.info("Info");
            logger.warning("Warning");
            logger.error("Error");

            expect(logOutput.length).toBe(4);
        });

        it("should only log emergency when minLevel is EMERGENCY", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.EMERGENCY,
                format: 'text'
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            logger.debug("Debug");
            logger.info("Info");
            logger.error("Error");
            logger.emergency("Emergency");

            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("EMERGENCY");
        });
    });

    describe("sampling", () => {
        it("should sample debug logs when configured", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'text',
                sampling: {
                    rate: 0.5,
                    levels: [LogLevel.DEBUG]
                }
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            // Log many debug messages
            for (let i = 0; i < 100; i++) {
                logger.debug(`Debug message ${i}`);
            }

            // Should have roughly 50% of logs (allow some variance)
            expect(logOutput.length).toBeGreaterThan(30);
            expect(logOutput.length).toBeLessThan(70);
        });

        it("should not sample non-configured levels", () => {
            const config: LoggerConfig = {
                minLevel: LogLevel.DEBUG,
                format: 'text',
                sampling: {
                    rate: 0.1,
                    levels: [LogLevel.DEBUG]
                }
            };
            logger = new FlexibleConfigurableLogger(config, mockConsole);

            // Log many error messages
            for (let i = 0; i < 20; i++) {
                logger.error(`Error message ${i}`);
            }

            // Should have all error logs (not sampled)
            expect(logOutput.length).toBe(20);
        });
    });
});
