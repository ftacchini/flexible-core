import "reflect-metadata";
import "jasmine";
import { FilterCascadeBuilder } from "../../../../../src/flexible/router/filter-cascade/filter-cascade-builder";
import { FlexiblePipeline } from "../../../../../src/flexible/pipeline/flexible-pipeline";
import { FlexibleFilter, FlexibleEvent } from "../../../../../src/event";
import { RouteDataHelper } from "../../../../../src/flexible/router/route-data-helper";


describe("FilterCascadeNode", () => {

    let builder: FilterCascadeBuilder<FlexiblePipeline>;

    beforeAll(() => {
        builder = new FilterCascadeBuilder(new RouteDataHelper())
    })

    afterEach(() => {
        builder.reset();
    })

    describe("routeData", () => {

        it("should return node route data if there is a single node in the cascade", () => {
            //ARRANGE
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter: FlexibleFilter = {
                staticRouting: {
                    a: "a",
                    b: [1, 2],
                    c: true
                }
            };

            var node = builder
                .addFlexibleFilters(filter)
                .withResource(pipeline)
                .build();

            //ACT
            var result = node[0].routeData;

            //ASSERT
            expect(result).toEqual(filter.staticRouting);
        })

        it("should return merged data if there are multiple nodes in the cascade", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    a: "a",
                    b: 1,
                    c: true
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    d: 1,
                    b: 1,
                    c: true
                }
            };

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();

            //ACT
            var result = node[0].routeData;

            //ASSERT
            expect(result).toEqual({
                a: "a",
                d: 1,
                b: 1,
                c: true
            });
        })

        it("should return merged data for arrays if there are multiple nodes in the cascade", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    a: ["a", "c"],
                    b: 1,
                    c: ["n", "d"]
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    a: ["a", "b"],
                    b: [2],
                    c: "n"
                }
            };

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();

            //ACT
            var result = node[0].routeData;
            (<any>result.a).sort();
            (<any>result.b).sort();
            (<any>result.c).sort();

            //ASSERT
            expect(result).toEqual({
                a: ["a", "b", "c"],
                b: [1, 2],
                c: ["d", "n"]
            });
        })

        it("should return merged data for nested objects if there are multiple nodes in the cascade", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    a: { a: "a", c: { b: "b" } },
                    b: { a: "a", c: { b: ["c"] } },
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    a: { a: "a", c: { c: "b" } },
                    b: { a: "a", c: { b: ["b"] } },
                }
            };

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();

            //ACT
            var result = node[0].routeData;
            ((<any>result).b.c.b).sort();

            //ASSERT
            expect(result).toEqual({
                a: { a: "a", c: { c: "b", b: "b" } },
                b: { a: "a", c: { b: ["b", "c"] } },
            });
        })

        it("should return null if merged data is invalid - plain properties of different types", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    d: "1",
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    d: 1,
                }
            };
            //ACT

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();


            //ASSERT
            expect(node.length).toBe(0);
        })

        it("should return null if merged data is invalid - array properties of different types", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    d: ["1"],
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    d: [1],
                }
            };
            //ACT

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();


            //ASSERT
            expect(node.length).toBe(0);
        })

        it("should return null if merged data is invalid - plain properties of different types in nested objects", () => {
            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    a: { d: "1" },
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    a: { d: 1 },
                }
            };
            //ACT

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();


            //ASSERT
            expect(node.length).toBe(0);

        })

        it("should return null if merged data is invalid - array properties of different types in nested objects", () => {

            var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

            var filter1: FlexibleFilter = {
                staticRouting: {
                    a: { d: ["1"] },
                }
            };
            var filter2: FlexibleFilter = {
                staticRouting: {
                    a: { d: [1] },
                }
            };
            //ACT

            var node = builder
                .addFlexibleFilters(filter1)
                .addFlexibleFilters(filter2)
                .withResource(pipeline)
                .build();


            //ASSERT
            expect(node.length).toBe(0);
        })
    })

    describe("getEventResources", () => {

        describe("ignoreStaticRouting is false", () => {

            it("should return pipeline if there is a single node in the cascade with static routing", async (next) => {
                //ARRANGE
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        d: { a: "d" },
                        b: [1, 2],
                        c: true
                    }
                };

                var node = builder
                    .addFlexibleFilters(filter)
                    .withResource(pipeline)
                    .build();

                var event: FlexibleEvent = {
                    routeData: {
                        a: "a",
                        d: { a: ["d", "g"] },
                        b: [1, 2, 3],
                        c: true
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {});

                //ASSERT
                expect(result).toEqual(pipeline);
                next()
            });

            it("should return pipeline if there are multiple nodes in the cascade with static routing", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    }
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    }
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                        a: "a",
                        d: 1,
                        b: 1,
                        c: true
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {});

                //ASSERT
                expect(result).toEqual(pipeline);
                next();
            });

            it("should return null if there is no static routing match", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    }
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    }
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                        a: "a",
                        d: 1,
                        c: true
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {});

                //ASSERT
                expect(result).toBeNull();
                next();
            })

            it("should return pipeline if there is a single node in the cascade with static and dynamic routing", async (next) => {
                 //ARRANGE
                 var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                 var filter: FlexibleFilter = {
                     staticRouting: {
                         a: "a",
                         d: { a: "d" },
                         b: [1, 2],
                         c: true
                     },
                     filterEvent: jasmine.createSpy("filter").and.returnValue(true)
                 };
 
                 var node = builder
                     .addFlexibleFilters(filter)
                     .withResource(pipeline)
                     .build();
 
                 var event: FlexibleEvent = {
                     routeData: {
                         a: "a",
                         d: { a: ["d", "g"] },
                         b: [1, 2, 3],
                         c: true
                     },
                     data: {},
                     eventType: "event"
                 }
 
                 //ACT
                 var result = await node[0].getEventResources(event, {});
 
                 //ASSERT
                 expect(filter.filterEvent).toHaveBeenCalledWith(event, {});
                 expect(result).toEqual(pipeline);
                 next();
            });

            it("should return pipeline if there are multiple nodes in the cascade with static and dynamic routing", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter1").and.returnValue(true)
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter2").and.returnValue(true)
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                        a: "a",
                        d: 1,
                        b: 1,
                        c: true
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {});

                //ASSERT
                expect(filter1.filterEvent).toHaveBeenCalledWith(event, {});
                expect(filter2.filterEvent).toHaveBeenCalledWith(event, {});
                expect(result).toEqual(pipeline);
                next();
            });

            it("should return null if there is no dynamic routing match", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter1").and.returnValue(true)
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter2").and.returnValue(false)
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                        a: "a",
                        d: 1,
                        b: 1,
                        c: true
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {});

                //ASSERT
                expect(filter1.filterEvent).toHaveBeenCalledWith(event, {});
                expect(filter2.filterEvent).toHaveBeenCalledWith(event, {});
                expect(result).toBeNull();
                next();
            })

        })

        describe("ignoreStaticRouting is true", () => {

            it("should return pipeline if there is a single node in the cascade with dynamic routing ignoring static routing", async (next) => {
                 //ARRANGE
                 var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                 var filter: FlexibleFilter = {
                     staticRouting: {
                         a: "a",
                         d: { a: "d" },
                         b: [1, 2],
                         c: true
                     },
                     filterEvent: jasmine.createSpy("filter").and.returnValue(true)
                 };
 
                 var node = builder
                     .addFlexibleFilters(filter)
                     .withResource(pipeline)
                     .build();
 
                 var event: FlexibleEvent = {
                     routeData: {
                     },
                     data: {},
                     eventType: "event"
                 }
 
                 //ACT
                 var result = await node[0].getEventResources(event, {}, true);
 
                 //ASSERT
                 expect(filter.filterEvent).toHaveBeenCalledWith(event, {});
                 expect(result).toEqual(pipeline);
                 next();
            });

            it("should return pipeline if there are multiple nodes in the cascade with dynamic routing ignoring static routing", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter1").and.returnValue(true)
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter2").and.returnValue(true)
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {}, true);

                //ASSERT
                expect(filter1.filterEvent).toHaveBeenCalledWith(event, {});
                expect(filter2.filterEvent).toHaveBeenCalledWith(event, {});
                expect(result).toEqual(pipeline);
                next();
            });

            it("should return null if there is no dynamic routing match", async (next) => {
                var pipeline = jasmine.createSpyObj<FlexiblePipeline>("pipeline", ["processEvent"]);

                var filter1: FlexibleFilter = {
                    staticRouting: {
                        a: "a",
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter1").and.returnValue(true)
                };
                var filter2: FlexibleFilter = {
                    staticRouting: {
                        d: 1,
                        b: 1,
                        c: true
                    },
                    filterEvent: jasmine.createSpy("filter2").and.returnValue(false)
                };

                var node = builder
                    .addFlexibleFilters(filter1)
                    .addFlexibleFilters(filter2)
                    .withResource(pipeline)
                    .build();


                var event: FlexibleEvent = {
                    routeData: {
                    },
                    data: {},
                    eventType: "event"
                }

                //ACT
                var result = await node[0].getEventResources(event, {}, true);

                //ASSERT
                expect(filter1.filterEvent).toHaveBeenCalledWith(event, {});
                expect(filter2.filterEvent).toHaveBeenCalledWith(event, {});
                expect(result).toBeNull();
                next();
            })
        })

    })


})