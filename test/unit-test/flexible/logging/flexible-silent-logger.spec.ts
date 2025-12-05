import "reflect-metadata";
import "jasmine";
import { FlexibleSilentLogger } from "../../../../src/flexible/logging/flexible-silent-logger";
import { LogContext } from "../../../../src/logging/flexible-logger";

describe("FlexibleSilentLogger", () => {
    let logger: FlexibleSilentLogger;

    beforeEach(() => {
        logger = new FlexibleSilentLogger();
    });

    it("should not throw when logging emergency messages", () => {
        expect(() => logger.emergency("Emergency message")).not.toThrow();
    });

    it("should not throw when logging alert messages", () => {
        expect(() => logger.alert("Alert message")).not.toThrow();
    });

    it("should not throw when logging critical messages", () => {
        expect(() => logger.crit("Critical message")).not.toThrow();
    });

    it("should not throw when logging error messages", () => {
        expect(() => logger.error("Error message")).not.toThrow();
    });

    it("should not throw when logging warning messages", () => {
        expect(() => logger.warning("Warning message")).not.toThrow();
    });

    it("should not throw when logging notice messages", () => {
        expect(() => logger.notice("Notice message")).not.toThrow();
    });

    it("should not throw when logging info messages", () => {
        expect(() => logger.info("Info message")).not.toThrow();
    });

    it("should not throw when logging debug messages", () => {
        expect(() => logger.debug("Debug message")).not.toThrow();
    });

    it("should not throw when logging with context", () => {
        const context: LogContext = { requestId: "abc123", userId: 42 };
        expect(() => logger.info("Message with context", context)).not.toThrow();
    });
});
