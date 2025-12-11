import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { FlexibleFrameworkModule } from "../../src/framework/flexible-framework-module";
import { DummyEventSource, DummyFramework } from "../../src";
import { DependencyContainer } from "tsyringe";
import { FlexibleContainer } from "../../src/container/flexible-container";
import { FlexibleEventSourceModule } from "../../src/event";
import { FlexibleModule } from "../../src";
import { SilentLoggerModule } from "../../src/flexible/logging/silent-logger-module";

const [
    CONTAINER_DEPENDENCY,
    MODULE_DEPENDENCY,
    F_DEPENDENCY,
    IF_DEPENDENCY,
    ES_DEPENDENCY,
    IES_DEPENDENCY
] = [
    "CONTAINER_DEPENDENCY",
    "MODULE_DEPENDENCY",
    "F_DEPENDENCY",
    "IF_DEPENDENCY",
    "ES_DEPENDENCY",
    "IES_DEPENDENCY"
]

describe("ContainerSystem", () => {

    let app: FlexibleApp;

    let container: FlexibleContainer;
    let frameworkIsolatedContainer: FlexibleContainer;
    let eventSourceIsolatedContainer: FlexibleContainer;

    beforeEach(async () => {
        let eventSource = new DummyEventSource();
        let framework = new DummyFramework();

        container = new FlexibleContainer();

        let dependenciesModule: FlexibleModule = {
            register: (container: DependencyContainer) => {
                container.register(MODULE_DEPENDENCY, { useValue: MODULE_DEPENDENCY });
            }
        };
        let frameworkModule: FlexibleFrameworkModule = {
            getInstance: (container) => {
                frameworkIsolatedContainer = container;
                return framework
            },
            register: (container: DependencyContainer) => {
                container.register(F_DEPENDENCY, { useValue: F_DEPENDENCY });
            },
            registerIsolated: (container: DependencyContainer) => {
                container.register(IF_DEPENDENCY, { useValue: IF_DEPENDENCY });
            }
        };
        let eventSourceModule: FlexibleEventSourceModule = {
            getInstance: (container) => {
                eventSourceIsolatedContainer = container;
                return eventSource
            },
            register: (container: DependencyContainer) => {
                container.register(ES_DEPENDENCY, { useValue: ES_DEPENDENCY });
            },
            registerIsolated: (container: DependencyContainer) => {
                container.register(IES_DEPENDENCY, { useValue: IES_DEPENDENCY });
            }
        };

        app = FlexibleApp.builder()
            .withLogger(new SilentLoggerModule())
            .withContainer(container)
            .addModule(dependenciesModule)
            .addEventSource(eventSourceModule)
            .addFramework(frameworkModule)
            .createApp();

        await app.run();
        container.registerValue(CONTAINER_DEPENDENCY, CONTAINER_DEPENDENCY);


    })


    it("should resolve container dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.resolve(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.resolve(MODULE_DEPENDENCY)

        //ASSERT
        expect(result).toBe(MODULE_DEPENDENCY);
    })

    it("should resolve framework regular dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.resolve(F_DEPENDENCY)

        //ASSERT
        expect(result).toBe(F_DEPENDENCY);
    })

    it("should resolve event source regular dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.resolve(ES_DEPENDENCY)

        //ASSERT
        expect(result).toBe(ES_DEPENDENCY);
    })

    it("should not resolve framework isolated dependencies from main container correctly", () => {
        //ARRANGE
        let exception = true;
        //ACT
        try {
            container.resolve(IF_DEPENDENCY)
        }
        catch(ex) {
            exception = true;
        }


        //ASSERT
        expect(exception).toBeTruthy();
    })

    it("should not resolve event source isolated dependencies from main container correctly", () => {
        //ARRANGE
        let exception = true;
        //ACT
        try {
            container.resolve(IES_DEPENDENCY)
        }
        catch(ex) {
            exception = true;
        }


        //ASSERT
        expect(exception).toBeTruthy();
    })

    it("should resolve container dependencies from framework container correctly", () => {
        //ARRANGE
        //ACT
        const result = frameworkIsolatedContainer.resolve(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from framework container correctly", () => {
        //ARRANGE
        //ACT
        const result = frameworkIsolatedContainer.resolve(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve container dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.resolve(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.resolve(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve event source dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.resolve(IES_DEPENDENCY)

        //ASSERT
        expect(result).toBe(IES_DEPENDENCY);
    })

    it("should resolve framework dependencies from framework container correctly", () => {
        //ARRANGE
        //ACT
        const result = frameworkIsolatedContainer.resolve(IF_DEPENDENCY)

        //ASSERT
        expect(result).toBe(IF_DEPENDENCY);
    })
})