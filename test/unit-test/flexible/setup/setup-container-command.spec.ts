import "reflect-metadata";
import "jasmine";
import { SetupContainerCommand } from "../../../../src/flexible/setup/setup-container-command";
import { FlexibleContainer } from "../../../../src/container/flexible-container";
import { FlexibleLoggerModule } from "../../../../src/logging/flexible-logger-module";
import { FlexibleModule } from "../../../../src/module/flexible-module";
import { FLEXIBLE_APP_TYPES } from "../../../../src/flexible/flexible-app-types";
import { DependencyContainer } from "tsyringe";

describe("SetupContainerCommand", () => {
    let container: FlexibleContainer;
    let loggerModule: FlexibleLoggerModule;
    let mockLogger: any;

    beforeEach(() => {
        container = new FlexibleContainer();

        // Create mock logger
        mockLogger = {
            info: jasmine.createSpy("info"),
            error: jasmine.createSpy("error"),
            warn: jasmine.createSpy("warn"),
            debug: jasmine.createSpy("debug")
        };

        // Create mock logger module
        loggerModule = {
            register: jasmine.createSpy("register"),
            getInstance: jasmine.createSpy("getInstance").and.returnValue(mockLogger),
            loggerType: Symbol("MockLogger")
        } as any;
    });

    afterEach(() => {
        container.reset();
    });

    describe("module loading", () => {
        it("should register logger module", async () => {
            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // Verify register was called with the underlying TSyringe container
            expect(loggerModule.register).toHaveBeenCalled();
            const callArg = (loggerModule.register as jasmine.Spy).calls.argsFor(0)[0];
            expect(callArg).toBe(container.getContainer());
        });

        it("should register all provided modules", async () => {
            const module1: FlexibleModule = {
                register: jasmine.createSpy("register1")
            };

            const module2: FlexibleModule = {
                register: jasmine.createSpy("register2")
            };

            const command = new SetupContainerCommand(
                loggerModule,
                [module1, module2],
                container
            );

            await command.execute();

            // Verify register was called with the underlying TSyringe container
            expect(module1.register).toHaveBeenCalled();
            expect(module2.register).toHaveBeenCalled();
            const tsyringeContainer = container.getContainer();
            expect((module1.register as jasmine.Spy).calls.argsFor(0)[0]).toBe(tsyringeContainer);
            expect((module2.register as jasmine.Spy).calls.argsFor(0)[0]).toBe(tsyringeContainer);
        });

        it("should register modules in order", async () => {
            const callOrder: string[] = [];

            const module1: FlexibleModule = {
                register: jasmine.createSpy("register1").and.callFake(() => {
                    callOrder.push("module1");
                })
            };

            const module2: FlexibleModule = {
                register: jasmine.createSpy("register2").and.callFake(() => {
                    callOrder.push("module2");
                })
            };

            const command = new SetupContainerCommand(
                loggerModule,
                [module1, module2],
                container
            );

            await command.execute();

            expect(callOrder).toEqual(["module1", "module2"]);
        });
    });

    describe("class binding registration", () => {
        it("should register logger factory binding", async () => {
            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // Verify logger can be resolved
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);

            const resolvedLogger = container.resolve(FLEXIBLE_APP_TYPES.LOGGER);
            expect(resolvedLogger).toBe(mockLogger);
            expect(loggerModule.getInstance).toHaveBeenCalledWith(container);
        });

        it("should call logger getInstance with container", async () => {
            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // Resolve logger to trigger factory
            container.resolve(FLEXIBLE_APP_TYPES.LOGGER);

            expect(loggerModule.getInstance).toHaveBeenCalledWith(container);
        });
    });

    describe("constant value registration", () => {
        it("should register container as constant value", async () => {
            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // Verify container is registered
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.CONTAINER)).toBe(true);

            const resolvedContainer = container.resolve(FLEXIBLE_APP_TYPES.CONTAINER);
            expect(resolvedContainer).toBe(container);
        });

        it("should return same container instance on multiple resolutions", async () => {
            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            const resolved1 = container.resolve(FLEXIBLE_APP_TYPES.CONTAINER);
            const resolved2 = container.resolve(FLEXIBLE_APP_TYPES.CONTAINER);

            expect(resolved1).toBe(resolved2);
            expect(resolved1).toBe(container);
        });
    });

    describe("container preservation", () => {
        it("should preserve user bindings when registering modules", async () => {
            // Register a test binding before command execution
            const testToken = Symbol("TestToken");
            container.registerValue(testToken, "test-value");

            expect(container.isRegistered(testToken)).toBe(true);

            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // User bindings should be preserved
            expect(container.isRegistered(testToken)).toBe(true);
            expect(container.resolve(testToken)).toBe("test-value");
        });

        it("should add framework bindings alongside user bindings", async () => {
            // Register multiple user bindings
            const token1 = Symbol("Token1");
            const token2 = Symbol("Token2");
            container.registerValue(token1, "value1");
            container.registerValue(token2, "value2");

            const command = new SetupContainerCommand(
                loggerModule,
                [],
                container
            );

            await command.execute();

            // User bindings should still exist
            expect(container.isRegistered(token1)).toBe(true);
            expect(container.isRegistered(token2)).toBe(true);
            // Framework bindings should also exist
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.CONTAINER)).toBe(true);
        });
    });

    describe("integration", () => {
        it("should complete full setup successfully", async () => {
            const module1Token = Symbol("Module1Token");
            const module2Token = Symbol("Module2Token");

            const module1: FlexibleModule = {
                register: (tsContainer: DependencyContainer) => {
                    tsContainer.register(module1Token, { useValue: "module1-value" });
                }
            };

            const module2: FlexibleModule = {
                register: (tsContainer: DependencyContainer) => {
                    tsContainer.register(module2Token, { useValue: "module2-value" });
                }
            };

            const command = new SetupContainerCommand(
                loggerModule,
                [module1, module2],
                container
            );

            await command.execute();

            // Verify all expected bindings are present
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.LOGGER)).toBe(true);
            expect(container.isRegistered(FLEXIBLE_APP_TYPES.CONTAINER)).toBe(true);
            expect(loggerModule.register).toHaveBeenCalled();

            // Verify module bindings were registered
            expect(container.isRegistered(module1Token)).toBe(true);
            expect(container.isRegistered(module2Token)).toBe(true);
            expect(container.resolve(module1Token)).toBe("module1-value");
            expect(container.resolve(module2Token)).toBe("module2-value");
        });
    });
});
