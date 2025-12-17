import "reflect-metadata";
import "jasmine";
import { FlexibleMiddleware } from "../../../../src/engine/pipeline/middleware.interface";
import { FlexibleParametersExtractor } from "../../../../src/engine/pipeline/parameters-extractor";
import { FlexibleActivationContext } from "../../../../src/extension-points/framework/activation-context";
import { FlexibleEvent } from "../../../../src/extension-points/event-source/event";
import { FlexibleResponse } from "../../../../src/extension-points/event-source/response";

describe("FlexibleMiddleware", () => {
    let middleware: FlexibleMiddleware;
    let mockActivationContext: FlexibleActivationContext;
    let mockParamsExtractor: FlexibleParametersExtractor;
    let mockEvent: FlexibleEvent;
    let mockResponse: FlexibleResponse;
    let filterBinnacle: { [key: string]: string };
    let contextBinnacle: { [key: string]: any };

    beforeEach(() => {
        mockEvent = {
            eventType: "test",
            data: { test: "data" },
            routeData: {}
        };
        mockResponse = {
            responseStack: [],
            errorStack: []
        };
        filterBinnacle = { filterKey: "filterValue" };
        contextBinnacle = { contextKey: "contextValue" };

        mockActivationContext = {
            activate: jasmine.createSpy('activate').and.returnValue(Promise.resolve({ result: "success" }))
        };

        mockParamsExtractor = {
            extractParams: jasmine.createSpy('extractParams').and.returnValue(Promise.resolve(["param1", "param2"]))
        } as any;

        middleware = new FlexibleMiddleware(mockActivationContext, mockParamsExtractor);
    });

    it("should pass contextBinnacle to extractParams", async () => {
        await middleware.processEvent(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        expect(mockParamsExtractor.extractParams).toHaveBeenCalledWith(
            mockEvent,
            mockResponse,
            filterBinnacle,
            contextBinnacle
        );
    });

    it("should pass contextBinnacle and extracted params to activation context", async () => {
        await middleware.processEvent(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        expect(mockActivationContext.activate).toHaveBeenCalledWith(
            contextBinnacle,
            "param1",
            "param2"
        );
    });

    it("should not execute when response has errors and middleware is not error middleware", async () => {
        mockResponse.errorStack.push(new Error("test error"));

        await middleware.processEvent(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        expect(mockParamsExtractor.extractParams).not.toHaveBeenCalled();
        expect(mockActivationContext.activate).not.toHaveBeenCalled();
    });

    it("should return the result from activation context", async () => {
        const result = await middleware.processEvent(mockEvent, mockResponse, filterBinnacle, contextBinnacle);

        expect(result).toEqual({ result: "success" });
    });
});
