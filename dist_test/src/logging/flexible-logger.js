"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["EMERGENCY"] = 0] = "EMERGENCY";
    LogLevel[LogLevel["ALERT"] = 1] = "ALERT";
    LogLevel[LogLevel["CRITICAL"] = 2] = "CRITICAL";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["WARNING"] = 4] = "WARNING";
    LogLevel[LogLevel["NOTICE"] = 5] = "NOTICE";
    LogLevel[LogLevel["INFO"] = 6] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 7] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
