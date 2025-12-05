import "reflect-metadata";
import "jasmine";
import { FlexibleConsoleLogger } from "../../../../src/flexible/logging/flexible-console-logger";
import { LogContext } from "../../../../src/logging/flexible-logger";

describe("FlexibleConsoleLogger", () => {
    let logger: FlexibleConsoleLogger;
    let mockConsole: Console;
    let logOutput: string[];

    beforeEach(() => {
        logOutput = [];
        mockConsole = {
            log: (message: string) => {
                logOutput.push(message);
            }
        } as Console;
        logger = new FlexibleConsoleLogger(mockConsole);
    });

    describe("without context", () => {
        it("should log emergency messages", () => {
            logger.emergency("Emergency message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("EMERGENCY: Emergency message");
        });

        it("should log alert messages", () => {
            logger.alert("Alert message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("ALERT: Alert message");
        });

        it("should log critical messages", () => {
            logger.crit("Critical message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("CRITICAL: Critical message");
        });

        it("should log error messages", () => {
            logger.error("Error message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("ERROR: Error message");
        });

        it("should log warning messages", () => {
            logger.warning("Warning message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("WARNING: Warning message");
        });

        it("should log notice messages", () => {
            logger.notice("Notice message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("NOTICE: Notice message");
        });

        it("should log info messages", () => {
            logger.info("Info message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("INFO: Info message");
        });

        it("should log debug messages", () => {
            logger.debug("Debug message");
            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("DEBUG: Debug message");
        });
    });

    describe("with context", () => {
        it("should log messages with JSON context", () => {
            const context: LogContext = {
                requestId: "abc123",
                userId: 42,
                action: "test"
            };
            logger.info("User action", context);

            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("INFO: User action");
            expect(logOutput[0]).toContain('"requestId":"abc123"');
            expect(logOutput[0]).toContain('"userId":42');
            expect(logOutput[0]).toContain('"action":"test"');
        });

        it("should handle nested context objects", () => {
            const context: LogContext = {
                user: {
                    id: 123,
                    name: "Test User"
                },
                metadata: {
                    timestamp: 1234567890
                }
            };
            logger.debug("Complex context", context);

            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("DEBUG: Complex context");
            expect(logOutput[0]).toContain('"user"');
            expect(logOutput[0]).toContain('"metadata"');
        });

        it("should handle empty context", () => {
            logger.warning("Warning with empty context", {});

            expect(logOutput.length).toBe(1);
            expect(logOutput[0]).toContain("WARNING: Warning with empty context");
            expect(logOutput[0]).toContain("{}");
        });
    });
});
