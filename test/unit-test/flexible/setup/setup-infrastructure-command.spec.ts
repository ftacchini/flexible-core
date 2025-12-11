import "reflect-metadata";
import "jasmine";
import { SetupInfrastructureCommand } from "../../../../src/flexible/setup/setup-infrastructure-command";
import { FlexibleContainer } from "../../../../src/container/flexible-container";
import { FlexibleEventSourceModule } from "../../../../src/event/flexible-event-source-module";
import { FlexibleFrameworkModule } from "../../../../src/framework/flexible-framework-module";
import { FLEXIBLE_APP_TYPES } from "../../../../src/flexible/flexible-app-types";
import { DependencyContainer } from "tsyringe";

describe("SetupInfrastructureCommand", () => {
    let container: FlexibleContainer;
    let mockEventSource: any;
    let mockFramework: any;

    beforeEach(() => {
        container = new FlexibleContainer();

        mockEventSource = {
            start: jasmine.createSpy("start"),
            stop: jasmine.createSpy("stop")
        };

        mockFramework = {
            activate: jasmine.createSpy("activate")
        };
    });

    afterEach(() => {
        container.reset();
    });

    describe("child container creation for event source modules", () => {
        it("should create child container for each event source module", async () => {
            const childContainerSpy = spyOn(container, "createChild").and.callThrough();

            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Verify child container was created
            expect(childContainerSpy).toHaveBeenCalledTimes(1);
        });

        it("should call registerIsolated with child container", async () => {
            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Verify registerIsolated was called
            expect(eventSourceModule.registerIsolated).toHaveBeenCalledTimes(1);

            // Verify it was called with a DependencyContainer
            const callArg = (eventSourceModule.registerIsolated as jasmine.Spy).calls.argsFor(0)[0];
            expect(callArg).toBeDefined();
            expect(typeof callArg.register).toBe("function");
            expect(typeof callArg.resolve).toBe("function");
        });

        it("should pass child container to getInstance", async () => {
            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Resolve the provider to trigger getInstance
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
            provider();

            // Verify getInstance was called with a FlexibleContainer
            expect(eventSourceModule.getInstance).toHaveBeenCalledTimes(1);
            const instanceArg = (eventSourceModule.getInstance as jasmine.Spy).calls.argsFor(0)[0];
            expect(instanceArg).toBeInstanceOf(FlexibleContainer);
        });

        it("should create separate child containers for multiple event source modules", async () => {
            const childContainerSpy = spyOn(container, "createChild").and.callThrough();

            const eventSourceModule1: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register1"),
                registerIsolated: jasmine.createSpy("registerIsolated1"),
                getInstance: jasmine.createSpy("getInstance1").and.returnValue(mockEventSource)
            };

            const eventSourceModule2: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register2"),
                registerIsolated: jasmine.createSpy("registerIsolated2"),
                getInstance: jasmine.createSpy("getInstance2").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule1, eventSourceModule2],
                [],
                container
            );

            await command.execute();

            // Verify child containers were created for each module
            expect(childContainerSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe("child container creation for framework modules", () => {
        it("should create child container for each framework module", async () => {
            const childContainerSpy = spyOn(container, "createChild").and.callThrough();

            const frameworkModule: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockFramework)
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule],
                container
            );

            await command.execute();

            // Verify child container was created
            expect(childContainerSpy).toHaveBeenCalledTimes(1);
        });

        it("should call registerIsolated with child container", async () => {
            const frameworkModule: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockFramework)
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule],
                container
            );

            await command.execute();

            // Verify registerIsolated was called
            expect(frameworkModule.registerIsolated).toHaveBeenCalledTimes(1);

            // Verify it was called with a DependencyContainer
            const callArg = (frameworkModule.registerIsolated as jasmine.Spy).calls.argsFor(0)[0];
            expect(callArg).toBeDefined();
            expect(typeof callArg.register).toBe("function");
            expect(typeof callArg.resolve).toBe("function");
        });

        it("should pass child container to getInstance", async () => {
            const frameworkModule: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockFramework)
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule],
                container
            );

            await command.execute();

            // Resolve the provider to trigger getInstance
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
            provider();

            // Verify getInstance was called with a FlexibleContainer
            expect(frameworkModule.getInstance).toHaveBeenCalledTimes(1);
            const instanceArg = (frameworkModule.getInstance as jasmine.Spy).calls.argsFor(0)[0];
            expect(instanceArg).toBeInstanceOf(FlexibleContainer);
        });
    });

    describe("isolation between child containers", () => {
        it("should isolate bindings between event source module child containers", async () => {
            const token1 = Symbol("Token1");
            const token2 = Symbol("Token2");

            const eventSourceModule1: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register1"),
                registerIsolated: (container: DependencyContainer) => {
                    container.register(token1, { useValue: "value1" });
                },
                getInstance: jasmine.createSpy("getInstance1").and.callFake((container: FlexibleContainer) => {
                    // Verify token1 is available in this child container
                    expect(container.isRegistered(token1)).toBe(true);
                    // Verify token2 is NOT available (isolated from other child)
                    expect(container.isRegistered(token2)).toBe(false);
                    return mockEventSource;
                })
            };

            const eventSourceModule2: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register2"),
                registerIsolated: (container: DependencyContainer) => {
                    container.register(token2, { useValue: "value2" });
                },
                getInstance: jasmine.createSpy("getInstance2").and.callFake((container: FlexibleContainer) => {
                    // Verify token2 is available in this child container
                    expect(container.isRegistered(token2)).toBe(true);
                    // Verify token1 is NOT available (isolated from other child)
                    expect(container.isRegistered(token1)).toBe(false);
                    return mockEventSource;
                })
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule1, eventSourceModule2],
                [],
                container
            );

            await command.execute();

            // Trigger getInstance by resolving the provider
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
            provider();

            // Verify both getInstance were called (assertions inside will verify isolation)
            expect(eventSourceModule1.getInstance).toHaveBeenCalled();
            expect(eventSourceModule2.getInstance).toHaveBeenCalled();
        });

        it("should isolate bindings between framework module child containers", async () => {
            const token1 = Symbol("Token1");
            const token2 = Symbol("Token2");

            const frameworkModule1: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register1"),
                registerIsolated: (container: DependencyContainer) => {
                    container.register(token1, { useValue: "value1" });
                },
                getInstance: jasmine.createSpy("getInstance1").and.callFake((container: FlexibleContainer) => {
                    expect(container.isRegistered(token1)).toBe(true);
                    expect(container.isRegistered(token2)).toBe(false);
                    return mockFramework;
                })
            };

            const frameworkModule2: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register2"),
                registerIsolated: (container: DependencyContainer) => {
                    container.register(token2, { useValue: "value2" });
                },
                getInstance: jasmine.createSpy("getInstance2").and.callFake((container: FlexibleContainer) => {
                    expect(container.isRegistered(token2)).toBe(true);
                    expect(container.isRegistered(token1)).toBe(false);
                    return mockFramework;
                })
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule1, frameworkModule2],
                container
            );

            await command.execute();

            // Trigger getInstance by resolving the provider
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
            provider();

            expect(frameworkModule1.getInstance).toHaveBeenCalled();
            expect(frameworkModule2.getInstance).toHaveBeenCalled();
        });

        it("should not pollute parent container with child bindings", async () => {
            const childToken = Symbol("ChildToken");

            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: (container: DependencyContainer) => {
                    container.register(childToken, { useValue: "child-value" });
                },
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Verify the child token is NOT registered in the parent container
            expect(container.isRegistered(childToken)).toBe(false);
        });
    });

    describe("parent binding inheritance", () => {
        it("should inherit parent bindings in event source child containers", async () => {
            const parentToken = Symbol("ParentToken");
            container.registerValue(parentToken, "parent-value");

            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.callFake((container: FlexibleContainer) => {
                    // Verify parent binding is accessible in child
                    expect(container.isRegistered(parentToken)).toBe(true);
                    expect(container.resolve(parentToken)).toBe("parent-value");
                    return mockEventSource;
                })
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Trigger getInstance
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
            provider();

            expect(eventSourceModule.getInstance).toHaveBeenCalled();
        });

        it("should inherit parent bindings in framework child containers", async () => {
            const parentToken = Symbol("ParentToken");
            container.registerValue(parentToken, "parent-value");

            const frameworkModule: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.callFake((container: FlexibleContainer) => {
                    // Verify parent binding is accessible in child
                    expect(container.isRegistered(parentToken)).toBe(true);
                    expect(container.resolve(parentToken)).toBe("parent-value");
                    return mockFramework;
                })
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule],
                container
            );

            await command.execute();

            // Trigger getInstance
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
            provider();

            expect(frameworkModule.getInstance).toHaveBeenCalled();
        });

        it("should allow child containers to override parent bindings", async () => {
            const sharedToken = Symbol("SharedToken");
            container.registerValue(sharedToken, "parent-value");

            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: (container: DependencyContainer) => {
                    // Override parent binding in child
                    container.register(sharedToken, { useValue: "child-override" });
                },
                getInstance: jasmine.createSpy("getInstance").and.callFake((container: FlexibleContainer) => {
                    // Verify child override is used
                    expect(container.resolve(sharedToken)).toBe("child-override");
                    return mockEventSource;
                })
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            // Trigger getInstance
            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
            provider();

            // Verify parent still has original value
            expect(container.resolve(sharedToken)).toBe("parent-value");
        });
    });

    describe("provider registration", () => {
        it("should register event sources provider", async () => {
            const eventSourceModule: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockEventSource)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule],
                [],
                container
            );

            await command.execute();

            expect(container.isRegistered(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER)).toBe(true);
        });

        it("should register frameworks provider", async () => {
            const frameworkModule: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register"),
                registerIsolated: jasmine.createSpy("registerIsolated"),
                getInstance: jasmine.createSpy("getInstance").and.returnValue(mockFramework)
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule],
                container
            );

            await command.execute();

            expect(container.isRegistered(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER)).toBe(true);
        });

        it("should return all event source instances from provider", async () => {
            const mockEventSource1 = { start: jasmine.createSpy("start1") };
            const mockEventSource2 = { start: jasmine.createSpy("start2") };

            const eventSourceModule1: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register1"),
                registerIsolated: jasmine.createSpy("registerIsolated1"),
                getInstance: jasmine.createSpy("getInstance1").and.returnValue(mockEventSource1)
            };

            const eventSourceModule2: FlexibleEventSourceModule = {
                register: jasmine.createSpy("register2"),
                registerIsolated: jasmine.createSpy("registerIsolated2"),
                getInstance: jasmine.createSpy("getInstance2").and.returnValue(mockEventSource2)
            };

            const command = new SetupInfrastructureCommand(
                [eventSourceModule1, eventSourceModule2],
                [],
                container
            );

            await command.execute();

            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
            const instances = provider();

            expect(instances).toEqual([mockEventSource1, mockEventSource2]);
        });

        it("should return all framework instances from provider", async () => {
            const mockFramework1 = { activate: jasmine.createSpy("activate1") };
            const mockFramework2 = { activate: jasmine.createSpy("activate2") };

            const frameworkModule1: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register1"),
                registerIsolated: jasmine.createSpy("registerIsolated1"),
                getInstance: jasmine.createSpy("getInstance1").and.returnValue(mockFramework1)
            };

            const frameworkModule2: FlexibleFrameworkModule = {
                register: jasmine.createSpy("register2"),
                registerIsolated: jasmine.createSpy("registerIsolated2"),
                getInstance: jasmine.createSpy("getInstance2").and.returnValue(mockFramework2)
            };

            const command = new SetupInfrastructureCommand(
                [],
                [frameworkModule1, frameworkModule2],
                container
            );

            await command.execute();

            const provider = container.resolve<() => any[]>(FLEXIBLE_APP_TYPES.FRAMEWORKS_PROVIDER);
            const instances = provider();

            expect(instances).toEqual([mockFramework1, mockFramework2]);
        });
    });
});


describe("Property-Based Tests", () => {
    describe("**Feature: di-container-replacement, Property: Child container isolation** - **Validates: Requirements 3.3**", () => {
        it("for any binding in a child container, it should not affect the parent container", async () => {
            const fc = require("fast-check");

            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),  // Generate random token names
                    fc.anything(),                 // Generate random values
                    async (tokenName: string, value: any) => {
                        // Create a fresh container for each test
                        const testContainer = new FlexibleContainer();
                        const childToken = Symbol(tokenName);

                        // Create a module that registers a binding in its child container
                        const eventSourceModule: FlexibleEventSourceModule = {
                            register: jasmine.createSpy("register"),
                            registerIsolated: (container: DependencyContainer) => {
                                // Register the random binding in the child container
                                container.register(childToken, { useValue: value });
                            },
                            getInstance: jasmine.createSpy("getInstance").and.returnValue({ start: () => {}, stop: () => {} })
                        };

                        const command = new SetupInfrastructureCommand(
                            [eventSourceModule],
                            [],
                            testContainer
                        );

                        await command.execute();

                        // Property: The child binding should NOT be registered in the parent container
                        expect(testContainer.isRegistered(childToken)).toBe(false);

                        // Cleanup
                        testContainer.reset();
                    }
                ),
                { numRuns: 100 } // Run 100 iterations as specified in the design document
            );
        });

        it("for any binding in a child container, child containers should remain isolated from each other", async () => {
            const fc = require("fast-check");

            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),  // Token name for first child
                    fc.string({ minLength: 1 }),  // Token name for second child
                    fc.anything(),                 // Value for first child
                    fc.anything(),                 // Value for second child
                    async (tokenName1: string, tokenName2: string, value1: any, value2: any) => {
                        // Skip if token names are the same (not a valid test case)
                        fc.pre(tokenName1 !== tokenName2);

                        const testContainer = new FlexibleContainer();
                        const childToken1 = Symbol(tokenName1);
                        const childToken2 = Symbol(tokenName2);

                        let child1Container: FlexibleContainer | null = null;
                        let child2Container: FlexibleContainer | null = null;

                        const eventSourceModule1: FlexibleEventSourceModule = {
                            register: jasmine.createSpy("register1"),
                            registerIsolated: (container: DependencyContainer) => {
                                container.register(childToken1, { useValue: value1 });
                            },
                            getInstance: jasmine.createSpy("getInstance1").and.callFake((container: FlexibleContainer) => {
                                child1Container = container;
                                return { start: () => {}, stop: () => {} };
                            })
                        };

                        const eventSourceModule2: FlexibleEventSourceModule = {
                            register: jasmine.createSpy("register2"),
                            registerIsolated: (container: DependencyContainer) => {
                                container.register(childToken2, { useValue: value2 });
                            },
                            getInstance: jasmine.createSpy("getInstance2").and.callFake((container: FlexibleContainer) => {
                                child2Container = container;
                                return { start: () => {}, stop: () => {} };
                            })
                        };

                        const command = new SetupInfrastructureCommand(
                            [eventSourceModule1, eventSourceModule2],
                            [],
                            testContainer
                        );

                        await command.execute();

                        // Trigger getInstance to get the child containers
                        const provider = testContainer.resolve<() => any[]>(FLEXIBLE_APP_TYPES.EVENT_SOURCES_PROVIDER);
                        provider();

                        // Property: Each child should only have its own binding, not the other's
                        expect(child1Container).not.toBeNull();
                        expect(child2Container).not.toBeNull();

                        if (child1Container && child2Container) {
                            // Child 1 should have token1 but not token2
                            expect((child1Container as FlexibleContainer).isRegistered(childToken1)).toBe(true);
                            expect((child1Container as FlexibleContainer).isRegistered(childToken2)).toBe(false);

                            // Child 2 should have token2 but not token1
                            expect((child2Container as FlexibleContainer).isRegistered(childToken2)).toBe(true);
                            expect((child2Container as FlexibleContainer).isRegistered(childToken1)).toBe(false);
                        }

                        // Cleanup
                        testContainer.reset();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
