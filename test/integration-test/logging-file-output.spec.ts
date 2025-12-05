import "reflect-metadata";
import "jasmine";
import * as fs from "fs";
import * as path from "path";
import { FlexibleConsoleLogger } from "../../src/flexible/logging/flexible-console-logger";
import { LogContext } from "../../src/logging/flexible-logger";

describe("Logging File Output Integration Tests", () => {
    const testOutputDir = path.join(__dirname, "../../test-logs");
    let logFilePath: string;
    let writeStream: fs.WriteStream;
    let logger: FlexibleConsoleLogger;

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

        logger = new FlexibleConsoleLogger(mockConsole);
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

    it("should write emergency logs to file", (done) => {
        logger.emergency("Emergency test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("EMERGENCY");
            done();
        });
    });

    it("should write alert logs to file", (done) => {
        logger.alert("Alert test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("ALERT");
            done();
        });
    });

    it("should write critical logs to file", (done) => {
        logger.crit("Critical test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("CRITICAL");
            done();
        });
    });

    it("should write error logs to file", (done) => {
        logger.error("Error test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("ERROR");
            done();
        });
    });

    it("should write warning logs to file", (done) => {
        logger.warning("Warning test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("WARNING");
            done();
        });
    });

    it("should write notice logs to file", (done) => {
        logger.notice("Notice test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("NOTICE");
            done();
        });
    });

    it("should write info logs to file", (done) => {
        logger.info("Info test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("INFO");
            done();
        });
    });

    it("should write debug logs to file", (done) => {
        logger.debug("Debug test message");

        writeStream.end(() => {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("DEBUG");
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
            expect(content).toContain("INFO");
            expect(content).toContain("requestId");
            expect(content).toContain("userId");
            expect(content).toContain("action");
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
            expect(content).toContain("DEBUG");
            expect(content).toContain("INFO");
            expect(content).toContain("WARNING");
            expect(content).toContain("ERROR");
            done();
        });
    });
});
