import "jasmine";
import { FlexibleRouter } from "../../../../src/router";
import { FlexibleFilter, FlexibleEvent } from "../../../../src/event";
import { FlexiblePipeline } from "../../../../src/flexible/flexible-pipeline";

export function flexibleRouterTests(initializeRouter: () => FlexibleRouter) {

    return () => {

        let router: FlexibleRouter;

        beforeEach(() => {
            router = initializeRouter();
        })

        it("should return pipelines for event with empty static filter", () => {
            //ARRANGE
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter: FlexibleFilter = {
                staticRouting: {}
            };

            var event: FlexibleEvent = {
                data: {},
                routeData: {
                    something: "a"
                },
                eventType: "sample"
            };

            //ACT
            router.addPipeline([filter], pipeline);
            var result = router.getEventPipelines(event);

            //ASSERT
            expect(result).toEqual([pipeline]);
        });

        it("should return pipelines for event with plain static filter", () => {
            //ARRANGE
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter: FlexibleFilter = {
                staticRouting: {
                    a: "a",
                    b: 1,
                    c: true
                }
            };

            var event: FlexibleEvent = {
                data: {},
                routeData: {
                    a: "a",
                    b: 1,
                    c: true
                },
                eventType: "sample"
            };

            //ACT
            router.addPipeline([filter], pipeline);
            var result = router.getEventPipelines(event);

            //ASSERT
            expect(result).toEqual([pipeline]);
        });
    }
}