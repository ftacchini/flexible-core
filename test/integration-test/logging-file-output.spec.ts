import "reflect-metadata";
import "jasmine";
import * as fs from "fs";
import * as path from "path";
import { FlexibleConfigurableLogger } from "../../src/flexible/logging/flexible-configurable-logger";
import { LogContext, LogLevel } from "../../src/logging/flexible-logger";
import { LoggerConfig } from "../../src/logging/logger-config";

describe("Logging File Output Integration Tests", () => {
    const testOutputDir = path.join(__dirname, "../../test-logs");
    let logFilePath: string;
    let writeStream: fs.WriteStream;
    let logger: FlexibleConfigurableLogger;

    beforeEach(() => {
        // Create test-logs directory if it doesn't exist
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }

        // Create a unique log file for this test
        logFilePath = path.join(testOutputDir, `test-${Date.now()}.log`);
        writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });

        // Create a mock console that writes to file
        const mockConsole = {
            log: (message: string) => {
                writeStream.write(message + '\n');
            }
        } as Console;

        // Use ConfigurableLogger with JSON format for better parsing
        const config: LoggerConfig = {
            minLevel: LogLevel.DEBUG,
            format: 'json',
            includeTimestamp: true
        };

        logger = new FlexibleConfigurableLogger(config, mockConsole);
    });

    afterEach((done) => {
        // Close the write stream and clean up
        writeStream.end(() => {
            if (fs.existsSync(logFilePath)) {
                fs.unlinkSync(logFilePath);
            }
            done();
        });
    });

    afterAll(() => {
        // Clean up test directory
        if (fs.existsSync(testOutputDir)) {
            const files = fs.readdirSync(testOutputDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testOutputDir, file));
            });
            fs.rmdirSync(testOutputDir);
        }
    });

    it("should write emergency logs to file in JSON format", (done) => {
        logger.emergency("Emergency test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("EMERGENCY");
            expect(log.timestamp).toBeDefined();
            done();
        });
    });

    it("should write error logs to file in JSON format", (done) => {
        logger.error("Error test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("ERROR");
            done();
        });
    });

    it("should write warning logs to file in JSON format", (done) => {
        logger.warning("Warning test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("WARNING");
            done();
        });
    });

    it("should write info logs to file in JSON format", (done) => {
        logger.info("Info test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("INFO");
            done();
        });
    });

    it("should write debug logs to file in JSON format", (done) => {
        logger.debug("Debug test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("DEBUG");
            done();
        });
    });

    it("should write logs with context to file", (done) => {
        const context: LogContext = {
            requestId: "test-123",
            userId: 456,
            action: "file-write-test"
        };

        logger.info("Test with context", context);

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            const log = JSON.parse(content.trim());
            expect(log.level).toBe("INFO");
            expect(log.requestId).toBe("test-123");
            expect(log.userId).toBe(456);
            expect(log.action).toBe("file-write-test");
            done();
        });
    });

    it("should write multiple log levels to file", (done) => {
        logger.debug("Debug message");
        logger.info("Info message");
        logger.warning("Warning message");
        logger.error("Error message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.length > 0);

            expect(lines.length).toBe(4);

            const logs = lines.map(line => JSON.parse(line));
            expect(logs[0].level).toBe("DEBUG");
            expect(logs[1].level).toBe("INFO");
            expect(logs[2].level).toBe("WARNING");
            expect(logs[3].level).toBe("ERROR");
            done();
        });
    });

    it("should filter logs based on minLevel configuration", (done) => {
        // Create a new logger with WARNING level
        const config: LoggerConfig = {
            minLevel: LogLevel.WARNING,
            format: 'json'
        };
        logger = new FlexibleConfigurableLogger(config, {
            log: (message: string) => {
                writeStream.write(message + '\n');
            }
        } as Console);

        logger.debug("Debug message");
        logger.info("Info message");
        logger.warning("Warning message");
        logger.error("Error message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.length > 0);

            // Only WARNING and ERROR should be logged
            expect(lines.length).toBe(2);

            const logs = lines.map(line => JSON.parse(line));
            expect(logs[0].level).toBe("WARNING");
            expect(logs[1].level).toBe("ERROR");
            done();
        });
    });
});
