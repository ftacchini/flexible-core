import "reflect-metadata";
import "jasmine";
import { SetupLoggerCommand } from "../../../../src/flexible/setup/setup-logger-command";
import { FlexibleAppState } from "../../../../src/flexible/flexible-app-state";
import { FlexibleLogger } from "../../../../src/logging/flexible-logger";

describe("SetupLoggerCommand", () => {
    let mockLogger: FlexibleLogger;
    let appState: FlexibleAppState;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            info: jasmine.createSpy("info"),
            error: jasmine.createSpy("error"),
            warn: jasmine.createSpy("warn"),
            debug: jasmine.createSpy("debug")
        } as any;

        // Create app state
        appState = {
            logger: null as any,
            eventSources: [],
            router: null as any
        };
    });

    describe("logger resolution", () => {
        it("should use injected logger", () => {
            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            // Verify the injected logger was used
            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up logger...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Logger setup done\n");
        });

        it("should set the same logger instance on app state", () => {
            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            // Verify the logger set on appState is the same instance
            expect(appState.logger).toBe(mockLogger);
        });
    });

    describe("logger initialization", () => {
        it("should set logger on app state", () => {
            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            expect(appState.logger).toBe(mockLogger);
        });

        it("should log debug messages during setup", () => {
            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up logger...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Logger setup done\n");
            expect(mockLogger.debug).toHaveBeenCalledTimes(2);
        });

        it("should log setup start before setting logger on app state", () => {
            const command = new SetupLoggerCommand(mockLogger);
            const callOrder: string[] = [];

            (mockLogger.debug as jasmine.Spy).and.callFake((msg: string) => {
                if (msg === "Setting up logger...") {
                    callOrder.push("start");
                    // At this point, appState.logger should not be set yet
                    expect(appState.logger).toBeNull();
                } else if (msg === "Logger setup done\n") {
                    callOrder.push("end");
                    // At this point, appState.logger should be set
                    expect(appState.logger).toBe(mockLogger);
                }
            });

            command.execute(appState);

            expect(callOrder).toEqual(["start", "end"]);
        });

        it("should handle multiple executions", () => {
            const command = new SetupLoggerCommand(mockLogger);
            const appState1 = {
                logger: null as any,
                eventSources: [],
                router: null as any
            };
            const appState2 = {
                logger: null as any,
                eventSources: [],
                router: null as any
            };

            command.execute(appState1);
            command.execute(appState2);

            expect(appState1.logger).toBe(mockLogger);
            expect(appState2.logger).toBe(mockLogger);
            expect(mockLogger.debug).toHaveBeenCalledTimes(4); // 2 calls per execution
        });

        it("should replace existing logger on app state", () => {
            const oldLogger = {
                info: jasmine.createSpy("oldInfo"),
                error: jasmine.createSpy("oldError"),
                warn: jasmine.createSpy("oldWarn"),
                debug: jasmine.createSpy("oldDebug")
            } as any;

            appState.logger = oldLogger;

            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            expect(appState.logger).toBe(mockLogger);
            expect(appState.logger).not.toBe(oldLogger);
        });
    });

    describe("integration", () => {
        it("should complete full setup successfully", () => {
            const command = new SetupLoggerCommand(mockLogger);

            command.execute(appState);

            // Verify logger was set
            expect(appState.logger).toBe(mockLogger);

            // Verify logging occurred in correct order
            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up logger...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Logger setup done\n");
            expect(mockLogger.debug).toHaveBeenCalledTimes(2);
        });
    });
});
