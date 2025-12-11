import "reflect-metadata";
import "jasmine";
import { FlexibleContainer } from "../../../src/container/flexible-container";
import { Lifecycle } from "tsyringe";

describe("FlexibleContainer", () => {
    let container: FlexibleContainer;

    beforeEach(() => {
        container = new FlexibleContainer();
    });

    afterEach(() => {
        container.reset();
    });

    describe("container creation", () => {
        it("should create a new container", () => {
            expect(container).toBeDefined();
            expect(container.getContainer()).toBeDefined();
        });

        it("should create independent containers", () => {
            const container1 = new FlexibleContainer();
            const container2 = new FlexibleContainer();

            const token = Symbol("TestToken");
            container1.registerValue(token, "value1");
            container2.registerValue(token, "value2");

            expect(container1.resolve(token)).toBe("value1");
            expect(container2.resolve(token)).toBe("value2");

            container1.reset();
            container2.reset();
        });
    });

    describe("binding registration", () => {
        it("should register class binding", () => {
            class TestService {
                getValue() {
                    return "test";
                }
            }

            const token = Symbol("TestService");
            container.registerClass(token, TestService);

            expect(container.isRegistered(token)).toBe(true);
        });

        it("should register value binding", () => {
            const token = Symbol("TestValue");
            const value = { data: "test" };

            container.registerValue(token, value);

            expect(container.isRegistered(token)).toBe(true);
        });

        it("should register factory binding", () => {
            const token = Symbol("TestFactory");
            const factory = () => ({ created: true });

            container.registerFactory(token, factory);

            expect(container.isRegistered(token)).toBe(true);
        });

        it("should register class with singleton lifecycle by default", () => {
            class TestService {
                id = Math.random();
            }

            const token = Symbol("TestService");
            container.registerClass(token, TestService);

            const instance1 = container.resolve(token);
            const instance2 = container.resolve(token);

            expect(instance1).toBe(instance2);
        });

        it("should register class with transient lifecycle", () => {
            class TestService {
                id = Math.random();
            }

            const token = Symbol("TestService");
            container.registerClass(token, TestService, Lifecycle.Transient);

            const instance1 = container.resolve<TestService>(token);
            const instance2 = container.resolve<TestService>(token);

            expect(instance1).not.toBe(instance2);
            expect(instance1.id).not.toBe(instance2.id);
        });
    });

    describe("dependency resolution", () => {
        it("should resolve class binding", () => {
            class TestService {
                getValue() {
                    return "test";
                }
            }

            const token = Symbol("TestService");
            container.registerClass(token, TestService);

            const instance = container.resolve<TestService>(token);

            expect(instance).toBeInstanceOf(TestService);
            expect(instance.getValue()).toBe("test");
        });

        it("should resolve value binding", () => {
            const token = Symbol("TestValue");
            const value = { data: "test" };

            container.registerValue(token, value);

            const resolved = container.resolve(token);

            expect(resolved).toBe(value);
        });

        it("should resolve factory binding", () => {
            const token = Symbol("TestFactory");
            const factory = () => ({ created: true, timestamp: Date.now() });

            container.registerFactory(token, factory);

            const resolved = container.resolve<{ created: boolean; timestamp: number }>(token);

            expect(resolved.created).toBe(true);
            expect(resolved.timestamp).toBeDefined();
        });

        it("should resolve factory with container access", () => {
            const dependencyToken = Symbol("Dependency");
            const serviceToken = Symbol("Service");

            container.registerValue(dependencyToken, "dependency-value");
            container.registerFactory(serviceToken, (c) => {
                const dep = c.resolve(dependencyToken);
                return { dependency: dep };
            });

            const resolved = container.resolve<{ dependency: string }>(serviceToken);

            expect(resolved.dependency).toBe("dependency-value");
        });

        it("should create new instances on each factory resolution", () => {
            const token = Symbol("FactoryService");
            container.registerFactory(token, () => ({ id: Math.random() }));

            const instance1 = container.resolve<{ id: number }>(token);
            const instance2 = container.resolve<{ id: number }>(token);

            // Factory providers always create new instances
            expect(instance1.id).not.toBe(instance2.id);
        });

        it("should throw when resolving unregistered token", () => {
            const token = Symbol("Unregistered");

            expect(() => container.resolve(token)).toThrow();
        });
    });

    describe("child container creation", () => {
        it("should create child container", () => {
            const child = container.createChild();

            expect(child).toBeDefined();
            expect(child).toBeInstanceOf(FlexibleContainer);
            expect(child).not.toBe(container);
        });

        it("should inherit parent bindings in child", () => {
            const token = Symbol("ParentBinding");
            container.registerValue(token, "parent-value");

            const child = container.createChild();

            expect(child.resolve(token)).toBe("parent-value");
        });

        it("should allow child to override parent bindings", () => {
            const token = Symbol("OverridableBinding");
            container.registerValue(token, "parent-value");

            const child = container.createChild();
            child.registerValue(token, "child-value");

            expect(container.resolve(token)).toBe("parent-value");
            expect(child.resolve(token)).toBe("child-value");
        });

        it("should isolate child bindings from parent", () => {
            const token = Symbol("ChildOnlyBinding");

            const child = container.createChild();
            child.registerValue(token, "child-value");

            expect(child.resolve(token)).toBe("child-value");
            expect(container.isRegistered(token)).toBe(false);
        });

        it("should support multiple child containers", () => {
            const token = Symbol("SharedToken");
            container.registerValue(token, "parent");

            const child1 = container.createChild();
            const child2 = container.createChild();

            child1.registerValue(token, "child1");
            child2.registerValue(token, "child2");

            expect(container.resolve(token)).toBe("parent");
            expect(child1.resolve(token)).toBe("child1");
            expect(child2.resolve(token)).toBe("child2");
        });

        it("should support nested child containers", () => {
            const token = Symbol("NestedToken");
            container.registerValue(token, "root");

            const child = container.createChild();
            child.registerValue(token, "child");

            const grandchild = child.createChild();
            grandchild.registerValue(token, "grandchild");

            expect(container.resolve(token)).toBe("root");
            expect(child.resolve(token)).toBe("child");
            expect(grandchild.resolve(token)).toBe("grandchild");
        });
    });

    describe("container management", () => {
        it("should check if token is registered", () => {
            const token = Symbol("TestToken");

            expect(container.isRegistered(token)).toBe(false);

            container.registerValue(token, "value");

            expect(container.isRegistered(token)).toBe(true);
        });

        it("should clear instances", () => {
            class TestService {
                id = Math.random();
            }

            const token = Symbol("TestService");
            container.registerClass(token, TestService);

            const instance1 = container.resolve<TestService>(token);
            const id1 = instance1.id;

            container.clearInstances();

            const instance2 = container.resolve<TestService>(token);
            const id2 = instance2.id;

            // After clearing instances, a new singleton should be created
            expect(id1).not.toBe(id2);
        });

        it("should reset container", () => {
            const token = Symbol("TestToken");
            container.registerValue(token, "value");

            expect(container.isRegistered(token)).toBe(true);

            container.reset();

            expect(container.isRegistered(token)).toBe(false);
        });
    });
});
