"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurableLoggerModule = void 0;
var flexible_configurable_logger_1 = require("./flexible-configurable-logger");
var flexible_logger_types_1 = require("./flexible-logger-types");
var ConfigurableLoggerModule = /** @class */ (function () {
    function ConfigurableLoggerModule(config) {
        this.config = config;
    }
    ConfigurableLoggerModule.prototype.register = function (container) {
        if (!container.isRegistered(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONFIG)) {
            container.register(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONFIG, { useValue: this.config });
        }
        if (!container.isRegistered(flexible_configurable_logger_1.FlexibleConfigurableLogger.TYPE)) {
            container.register(flexible_configurable_logger_1.FlexibleConfigurableLogger.TYPE, { useClass: flexible_configurable_logger_1.FlexibleConfigurableLogger });
        }
    };
    ConfigurableLoggerModule.prototype.getInstance = function (container) {
        return container.resolve(this.loggerType);
    };
    Object.defineProperty(ConfigurableLoggerModule.prototype, "loggerType", {
        get: function () {
            return flexible_configurable_logger_1.FlexibleConfigurableLogger.TYPE;
        },
        enumerable: false,
        configurable: true
    });
    return ConfigurableLoggerModule;
}());
exports.ConfigurableLoggerModule = ConfigurableLoggerModule;
