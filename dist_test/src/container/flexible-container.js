"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleContainer = void 0;
var tsyringe_1 = require("tsyringe");
/**
 * Wrapper around TSyringe's DependencyContainer to provide a consistent interface
 * for flexible-core's dependency injection needs.
 *
 * This adapter maintains compatibility with the existing FlexibleModule interface
 * while leveraging TSyringe's child container capabilities.
 */
var FlexibleContainer = /** @class */ (function () {
    /**
     * Creates a new FlexibleContainer
     * @param parent Optional parent container for creating child containers
     */
    function FlexibleContainer(parent) {
        if (parent) {
            this.container = parent.createChildContainer();
        }
        else {
            // Create a new root container
            this.container = tsyringe_1.container.createChildContainer();
        }
    }
    /**
     * Gets the underlying TSyringe container
     */
    FlexibleContainer.prototype.getContainer = function () {
        return this.container;
    };
    /**
     * Creates a child container that inherits bindings from this container
     */
    FlexibleContainer.prototype.createChild = function () {
        return new FlexibleContainer(this.container);
    };
    /**
     * Registers a class binding
     * @param token The injection token
     * @param target The class to bind
     * @param lifecycle Optional lifecycle (singleton, transient, scoped)
     */
    FlexibleContainer.prototype.registerClass = function (token, target, lifecycle) {
        if (lifecycle === void 0) { lifecycle = tsyringe_1.Lifecycle.Singleton; }
        this.container.register(token, { useClass: target }, { lifecycle: lifecycle });
    };
    /**
     * Registers a constant value binding
     * @param token The injection token
     * @param value The value to bind
     */
    FlexibleContainer.prototype.registerValue = function (token, value) {
        this.container.register(token, { useValue: value });
    };
    /**
     * Registers a factory function binding
     * @param token The injection token
     * @param factory The factory function
     * Note: Factory providers do not support lifecycle management in TSyringe.
     * If you need instance caching, implement it within your factory function.
     */
    FlexibleContainer.prototype.registerFactory = function (token, factory) {
        this.container.register(token, {
            useFactory: factory
        });
    };
    /**
     * Resolves a dependency from the container
     * @param token The injection token to resolve
     */
    FlexibleContainer.prototype.resolve = function (token) {
        return this.container.resolve(token);
    };
    /**
     * Checks if a token is registered in the container or any parent container
     * @param token The injection token to check
     */
    FlexibleContainer.prototype.isRegistered = function (token) {
        // First check if it's registered in this container
        if (this.container.isRegistered(token)) {
            return true;
        }
        // Try to resolve it - if it succeeds, it's available from a parent
        try {
            this.container.resolve(token);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Clears all registrations from the container
     */
    FlexibleContainer.prototype.clearInstances = function () {
        this.container.clearInstances();
    };
    /**
     * Resets the container (clears all registrations and instances)
     */
    FlexibleContainer.prototype.reset = function () {
        this.container.reset();
    };
    return FlexibleContainer;
}());
exports.FlexibleContainer = FlexibleContainer;
