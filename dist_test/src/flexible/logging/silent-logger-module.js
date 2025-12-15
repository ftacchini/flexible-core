"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SilentLoggerModule = void 0;
var flexible_silent_logger_1 = require("./flexible-silent-logger");
var flexible_logger_types_1 = require("./flexible-logger-types");
var SilentLoggerModule = /** @class */ (function () {
    function SilentLoggerModule() {
    }
    SilentLoggerModule.prototype.register = function (container) {
        if (!container.isRegistered(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE)) {
            container.register(flexible_logger_types_1.FLEXIBLE_LOGGER_TYPES.CONSOLE, { useValue: console });
        }
        if (!container.isRegistered(flexible_silent_logger_1.FlexibleSilentLogger.TYPE)) {
            container.register(flexible_silent_logger_1.FlexibleSilentLogger.TYPE, { useClass: flexible_silent_logger_1.FlexibleSilentLogger });
        }
    };
    SilentLoggerModule.prototype.getInstance = function (container) {
        return container.resolve(this.loggerType);
    };
    Object.defineProperty(SilentLoggerModule.prototype, "loggerType", {
        get: function () {
            return flexible_silent_logger_1.FlexibleSilentLogger.TYPE;
        },
        enumerable: false,
        configurable: true
    });
    return SilentLoggerModule;
}());
exports.SilentLoggerModule = SilentLoggerModule;
