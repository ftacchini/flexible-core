import "reflect-metadata";
import "jasmine";
import { FlexibleAppBuilder } from "../../src/flexible/flexible-app-builder";
import { FlexibleApp } from "../../src/flexible/flexible-app";
import { FlexibleFrameworkModule } from "../../src/framework/flexible-framework-module";
import { DummyEventSource, DummyFramework } from "../../src";
import { ContainerModule, Container } from "inversify";
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

    let container: Container;
    let frameworkIsolatedContainer: Container;;
    let eventSourceIsolatedContainer: Container;

    beforeEach(async () => {
        let eventSource = new DummyEventSource();
        let framework = new DummyFramework();

        container = new Container();

        let dependenciesModule: FlexibleModule = {
            container: new ContainerModule(({ bind }) => {
                bind(MODULE_DEPENDENCY).toConstantValue(MODULE_DEPENDENCY);
            })
        };
        let frameworkModule: FlexibleFrameworkModule = {
            getInstance: (container) => {
                frameworkIsolatedContainer = container;
                return framework
            },
            container: new ContainerModule(({ bind }) => {
                bind(F_DEPENDENCY).toConstantValue(F_DEPENDENCY);
            }),
            isolatedContainer: new ContainerModule(({ bind }) => {
                bind(IF_DEPENDENCY).toConstantValue(IF_DEPENDENCY);
            })
        };
        let eventSourceModule: FlexibleEventSourceModule = {
            getInstance: (container) => {
                eventSourceIsolatedContainer = container;
                return eventSource
            },
            container: new ContainerModule(({ bind }) => {
                bind(ES_DEPENDENCY).toConstantValue(ES_DEPENDENCY);
            }),
            isolatedContainer: new ContainerModule(({ bind }) => {
                bind(IES_DEPENDENCY).toConstantValue(IES_DEPENDENCY);
            })
        };

        app = FlexibleApp.builder()
            .withLogger(new SilentLoggerModule())
            .withContainer(container)
            .addModule(dependenciesModule)
            .addEventSource(eventSourceModule)
            .addFramework(frameworkModule)
            .createApp();

        await app.run();
        container.bind(CONTAINER_DEPENDENCY).toConstantValue(CONTAINER_DEPENDENCY);


    })


    it("should resolve container dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.get(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.get(MODULE_DEPENDENCY)

        //ASSERT
        expect(result).toBe(MODULE_DEPENDENCY);
    })

    it("should resolve framework regular dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.get(F_DEPENDENCY)

        //ASSERT
        expect(result).toBe(F_DEPENDENCY);
    })

    it("should resolve event source regular dependencies from main container correctly", () => {
        //ARRANGE
        //ACT
        const result = container.get(ES_DEPENDENCY)

        //ASSERT
        expect(result).toBe(ES_DEPENDENCY);
    })

    it("should not resolve framework isolated dependencies from main container correctly", () => {
        //ARRANGE
        let exception = true;
        //ACT
        try {
            container.get(IF_DEPENDENCY)
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
            container.get(IES_DEPENDENCY)
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
        const result = frameworkIsolatedContainer.get(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from framework container correctly", () => {
        //ARRANGE
        //ACT
        const result = frameworkIsolatedContainer.get(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve container dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.get(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve module dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.get(CONTAINER_DEPENDENCY)

        //ASSERT
        expect(result).toBe(CONTAINER_DEPENDENCY);
    })

    it("should resolve event source dependencies from event source container correctly", () => {
        //ARRANGE
        //ACT
        const result = eventSourceIsolatedContainer.get(IES_DEPENDENCY)

        //ASSERT
        expect(result).toBe(IES_DEPENDENCY);
    })

    it("should resolve framework dependencies from framework container correctly", () => {
        //ARRANGE
        //ACT
        const result = frameworkIsolatedContainer.get(IF_DEPENDENCY)

        //ASSERT
        expect(result).toBe(IF_DEPENDENCY);
    })
})