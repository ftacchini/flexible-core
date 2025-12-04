import "jasmine";
import { FlexibleRouter } from "../../../../src/router";
import { FlexibleFilter, FlexibleEvent } from "../../../../src/event";
import { FlexiblePipeline } from "../../../../src/flexible/pipeline/flexible-pipeline";

export function flexibleRouterTests(initializeRouter: () => FlexibleRouter<any>) {

    return () => {

        let router: FlexibleRouter<FlexiblePipeline>;

        beforeEach(() => {
            router = initializeRouter();
        })

        describe("with single filter", () => {

            it("should return pipelines for event with empty static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should return pipelines for event with plain static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should not return pipelines for event with plain static filter that do not match event", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([]);

            });

            it("should return pipelines for event with array static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should return pipelines for event with sub array static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should return pipelines for event with plain array member static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should  not return pipelines return pipelines for event with array static filter that do not match event", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([]);

            });

            it("should return pipelines for event with nested object static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should return pipelines for event with nested object and array static filter", async () => {
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
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline]);

            });

            it("should return pipelines for event with dynamic filter", async () => {
                //ARRANGE
                var pipeline1 = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);
                var pipeline2 = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                    },
                    filterEvent: async () => true
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                    },
                    filterEvent: async () => false
                };

                var event: FlexibleEvent = {
                    data: {},
                    routeData: {
                    },
                    eventType: "sample"
                };

                //ACT
                router.addResource([filter1], pipeline1);
                router.addResource([filter2], pipeline2);
                var result = await router.getEventResources(event, {});

                //ASSERT
                expect(result).toEqual([pipeline1]);

            });
        })


        // TODO: Add tests for multiple filters
        // describe("with multiple filters", () => {

        // })
    }
}