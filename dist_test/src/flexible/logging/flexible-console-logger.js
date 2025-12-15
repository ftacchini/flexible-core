"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexibleConsoleLogger = void 0;
var tsyringe_1 = require("tsyringe");
var FlexibleConsoleLogger = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FlexibleConsoleLogger = _classThis = /** @class */ (function () {
        function FlexibleConsoleLogger_1(consoleInstance) {
            if (consoleInstance === void 0) { consoleInstance = console; }
            this.consoleInstance = consoleInstance;
        }
        FlexibleConsoleLogger_1.prototype.logToConsole = function (prefix, message, context) {
            var contextStr = context ? " ".concat(JSON.stringify(context)) : '';
            this.consoleInstance.log(prefix + FlexibleConsoleLogger.SEPARATOR + message + contextStr);
        };
        FlexibleConsoleLogger_1.prototype.emergency = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.EMERGENCY_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.alert = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.ALERT_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.crit = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.CRITICAL_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.error = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.ERROR_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.warning = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.WARNING_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.notice = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.NOTICE_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.info = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.INFO_PREFIX, message, context);
        };
        FlexibleConsoleLogger_1.prototype.debug = function (message, context) {
            this.logToConsole(FlexibleConsoleLogger.DEBUG_PREFIX, message, context);
        };
        return FlexibleConsoleLogger_1;
    }());
    __setFunctionName(_classThis, "FlexibleConsoleLogger");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlexibleConsoleLogger = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.TYPE = Symbol("FlexibleConsoleLogger");
    _classThis.EMERGENCY_PREFIX = "EMERGENCY";
    _classThis.ALERT_PREFIX = "ALERT";
    _classThis.CRITICAL_PREFIX = "CRITICAL";
    _classThis.ERROR_PREFIX = "ERROR";
    _classThis.WARNING_PREFIX = "WARNING";
    _classThis.NOTICE_PREFIX = "NOTICE";
    _classThis.INFO_PREFIX = "INFO";
    _classThis.DEBUG_PREFIX = "DEBUG";
    _classThis.SEPARATOR = ": ";
    (function () {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlexibleConsoleLogger = _classThis;
}();
exports.FlexibleConsoleLogger = FlexibleConsoleLogger;
