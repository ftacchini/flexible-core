import "reflect-metadata";
import "jasmine";
import { ContextBinnacle } from "../../../../src/built-ins/extractors/context-binnacle";
import { FlexibleEvent } from "../../../../src/extension-points/event-source/event";
import { FlexibleResponse } from "../../../../src/extension-points/event-source/response";

describe("ContextBinnacle Extractor", () => {
    let extractor: ContextBinnacle;
    let mockEvent: FlexibleEvent;
    let mockResponse: FlexibleResponse;
    let filterBinnacle: { [key: string]: string };
    let contextBinnacle: { [key: string]: any };

    beforeEach(() => {
        extractor = new ContextBinnacle();
        mockEvent = {
            eventType: "test",
            data: { test: "data" },
            routeData: {}
        };
        mockResponse = {
            responseStack: [],
            errorStack: []
        };
        filterBinnacle = {};
        contextBinnacle = {
            testKey: "testValue",
            anotherKey: 123
        };
    });

    it("should extract the contextBinnacle", async () => {
        const result = await extractor.extractValue(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        expect(result).toBe(contextBinnacle);
        expect(result.testKey).toBe("testValue");
        expect(result.anotherKey).toBe(123);
    });

    it("should return the same contextBinnacle object reference", async () => {
        const result = await extractor.extractValue(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        // Should be the exact same object, not a copy
        expect(result).toBe(contextBinnacle);

        // Modifications should affect the original
        result.newKey = "newValue";
        expect(contextBinnacle.newKey).toBe("newValue");
    });

    it("should work with empty contextBinnacle", async () => {
        const emptyBinnacle = {};
        const result = await extractor.extractValue(mockEvent, mockResponse, filterBinnacle, emptyBinnacle);

        expect(result).toBe(emptyBinnacle);
        expect(Object.keys(result).length).toBe(0);
    });

    it("should have empty static routing", () => {
        expect(extractor.staticRouting).toEqual({});
    });
});
