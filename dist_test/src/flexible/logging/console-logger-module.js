"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLoggerModule = void 0;
var flexible_console_logger_1 = require("./flexible-console-logger");
var flexible_logger_types_1 = require("./flexible-logger-types");
var ConsoleLoggerModule = /** @class */ (function () {
    function ConsoleLoggerModule() {
    }
    ConsoleLoggerModule.prototype.register = function (container) {
        if (!container.isRegistered(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(flexible_console_logger_1.FlexibleConsoleLogger.TYPE)) {
            container.register(flexible_console_logger_1.FlexibleConsoleLogger.TYPE, { useClass: flexible_console_logger_1.FlexibleConsoleLogger });
        }
    };
    ConsoleLoggerModule.prototype.getInstance = function (container) {
        return container.resolve(this.loggerType);
    };
    Object.defineProperty(ConsoleLoggerModule.prototype, "loggerType", {
        get: function () {
            return flexible_console_logger_1.FlexibleConsoleLogger.TYPE;
        },
        enumerable: false,
        configurable: true
    });
    return ConsoleLoggerModule;
}());
exports.ConsoleLoggerModule = ConsoleLoggerModule;
