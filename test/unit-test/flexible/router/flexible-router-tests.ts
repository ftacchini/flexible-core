import "jasmine";
import { FlexibleRouter } from "../../../../src/router";
import { FlexibleFilter, FlexibleEvent } from "../../../../src/event";
import { FlexiblePipeline } from "../../../../src/flexible/flexible-pipeline";

export function flexibleRouterTests(initializeRouter: () => FlexibleRouter<any>) {

    return () => {

        let router: FlexibleRouter<FlexiblePipeline>;

        beforeEach(() => {
            router = initializeRouter();
        })

        describe("with single filter", () => {

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
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

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
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

            it("should not return pipelines for event with plain static filter that do not match event", () => {
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
                        c: true
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([]);
            });

            it("should return pipelines for event with array static filter", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: ["a", "b", "c"]
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: ["a", "b", "c"]
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

            it("should return pipelines for event with sub array static filter", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: ["c", "b"]
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: ["a", "b", "c"]
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

            it("should return pipelines for event with plain array member static filter", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: "c"
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: ["a", "b", "c"]
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

            it("should  not return pipelines return pipelines for event with array static filter that do not match event", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: ["c", "b"]
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: ["a", "b"]
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([]);
            });

            it("should return pipelines for event with nested object static filter", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: { b: { c: true } }
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: { b: { c: true } }
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

            it("should return pipelines for event with nested object and array static filter", () => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: {
                            b: {
                                c: true,
                                a: ["b", "c"]
                            }
                        }
                    }
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                        a: {
                            b: {
                                c: true,
                                a: ["a", "b", "c"]
                            }
                        }
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter], pipeline);
                var result = router.getEventResources(event);

                //ASSERT
                expect(result).toEqual([pipeline]);
            });

        });

        describe("with multiple filters", () => {

        })
    }
}