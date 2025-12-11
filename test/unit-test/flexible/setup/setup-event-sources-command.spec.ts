import "reflect-metadata";
import "jasmine";
import { SetupEventSourcesCommand } from "../../../../src/flexible/setup/setup-event-sources-command";
import { FlexibleAppState } from "../../../../src/flexible/flexible-app-state";
import { FlexibleEventSource } from "../../../../src/event/flexible-event-source";
import { FlexibleLogger } from "../../../../src/logging/flexible-logger";

describe("SetupEventSourcesCommand", () => {
    let mockLogger: FlexibleLogger;
    let mockEventSourcesProvider: jasmine.Spy;
    let mockEventSources: FlexibleEventSource[];
    let appState: FlexibleAppState;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            info: jasmine.createSpy("info"),
            error: jasmine.createSpy("error"),
            warning: jasmine.createSpy("warning"),
            debug: jasmine.createSpy("debug")
        } as any;

        // Create mock event sources
        mockEventSources = [
            {
                availableEventTypes: ["http.request", "http.response"],
                run: jasmine.createSpy("run1"),
                stop: jasmine.createSpy("stop1"),
                onEvent: jasmine.createSpy("onEvent1")
            } as any,
            {
                availableEventTypes: ["websocket.connect", "websocket.message"],
                run: jasmine.createSpy("run2"),
                stop: jasmine.createSpy("stop2"),
                onEvent: jasmine.createSpy("onEvent2")
            } as any
        ];

        // Create mock event sources provider
        mockEventSourcesProvider = jasmine.createSpy("eventSourcesProvider").and.returnValue(mockEventSources);

        // Create app state
        appState = {
            logger: mockLogger,
            eventSources: [],
            router: null as any
        };
    });

    describe("event source resolution", () => {
        it("should resolve event sources from provider", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockEventSourcesProvider).toHaveBeenCalled();
            expect(appState.eventSources).toBe(mockEventSources);
        });

        it("should handle empty event sources array", () => {
            mockEventSourcesProvider.and.returnValue([]);

            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(appState.eventSources).toEqual([]);
            expect(mockLogger.debug).toHaveBeenCalledWith("Analysing events for 0 event sources...");
        });

        it("should handle multiple event sources", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(appState.eventSources.length).toBe(2);
            expect(appState.eventSources).toEqual(mockEventSources);
        });
    });

    describe("event source initialization", () => {
        it("should log setup start", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up event sources...");
        });

        it("should log event source count during analysis", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Analysing events for 2 event sources...");
        });

        it("should log setup completion", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Setup done for 2 event sources\n");
        });

        it("should log total event types count", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.debug).toHaveBeenCalledWith("Your app will process 4 event types...");
        });
    });

    describe("duplicate event type detection", () => {
        it("should not warn when event types are unique", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.warning).not.toHaveBeenCalled();
        });

        it("should warn when duplicate event types exist", () => {
            // Create new event sources with duplicates
            const duplicateEventSources: FlexibleEventSource[] = [
                {
                    availableEventTypes: ["http.request", "http.response"],
                    run: jasmine.createSpy("run1"),
                    stop: jasmine.createSpy("stop1"),
                    onEvent: jasmine.createSpy("onEvent1")
                } as any,
                {
                    availableEventTypes: ["http.request", "custom.event"],
                    run: jasmine.createSpy("run2"),
                    stop: jasmine.createSpy("stop2"),
                    onEvent: jasmine.createSpy("onEvent2")
                } as any
            ];
            mockEventSourcesProvider.and.returnValue(duplicateEventSources);

            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.warning).toHaveBeenCalled();
            const warningCall = (mockLogger.warning as jasmine.Spy).calls.mostRecent().args[0];
            expect(warningCall).toContain("There is more than one eventSource that emits events with the same type");
            expect(warningCall).toContain("http.request");
        });

        it("should detect multiple duplicate event types", () => {
            // Create new event sources with multiple duplicates
            const duplicateEventSources: FlexibleEventSource[] = [
                {
                    availableEventTypes: ["http.request", "http.response"],
                    run: jasmine.createSpy("run1"),
                    stop: jasmine.createSpy("stop1"),
                    onEvent: jasmine.createSpy("onEvent1")
                } as any,
                {
                    availableEventTypes: ["http.request", "http.response"],
                    run: jasmine.createSpy("run2"),
                    stop: jasmine.createSpy("stop2"),
                    onEvent: jasmine.createSpy("onEvent2")
                } as any
            ];
            mockEventSourcesProvider.and.returnValue(duplicateEventSources);

            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(mockLogger.warning).toHaveBeenCalled();
            const warningCall = (mockLogger.warning as jasmine.Spy).calls.mostRecent().args[0];
            expect(warningCall).toContain("http.request");
            expect(warningCall).toContain("http.response");
        });

        it("should handle event sources without availableEventTypes", () => {
            mockEventSources.push({
                run: jasmine.createSpy("run3"),
                stop: jasmine.createSpy("stop3"),
                onEvent: jasmine.createSpy("onEvent3")
            } as any);

            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            expect(appState.eventSources.length).toBe(3);
            expect(mockLogger.warning).not.toHaveBeenCalled();
        });
    });

    describe("integration", () => {
        it("should complete full setup successfully", () => {
            const command = new SetupEventSourcesCommand(mockLogger, mockEventSourcesProvider);

            command.execute(appState);

            // Verify provider was called
            expect(mockEventSourcesProvider).toHaveBeenCalled();

            // Verify event sources were set
            expect(appState.eventSources).toBe(mockEventSources);

            // Verify logging occurred
            expect(mockLogger.debug).toHaveBeenCalledWith("Setting up event sources...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Analysing events for 2 event sources...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Your app will process 4 event types...");
            expect(mockLogger.debug).toHaveBeenCalledWith("Setup done for 2 event sources\n");

            // Verify no warnings for unique event types
            expect(mockLogger.warning).not.toHaveBeenCalled();
        });
    });
});
