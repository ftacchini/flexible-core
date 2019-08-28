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

            it("should return pipelines for event with empty static filter", async (next) => {
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
                next();
            });

            it("should return pipelines for event with plain static filter", async (next) => {
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
                next();
            });

            it("should not return pipelines for event with plain static filter that do not match event", async (next) => {
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
                next();
            });

            it("should return pipelines for event with array static filter", async (next) => {
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
                next();
            });

            it("should return pipelines for event with sub array static filter", async (next) => {
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
                next();
            });

            it("should return pipelines for event with plain array member static filter", async (next) => {
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
                next();
            });

            it("should  not return pipelines return pipelines for event with array static filter that do not match event", async (next) => {
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
                next();
            });

            it("should return pipelines for event with nested object static filter", async (next) => {
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
                next();
            });

            it("should return pipelines for event with nested object and array static filter", async (next) => {
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
                next();
            });

        });

        describe("with multiple filters", () => {

        })
    }
}