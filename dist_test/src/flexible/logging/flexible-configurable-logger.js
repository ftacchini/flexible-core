"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.FlexibleConfigurableLogger = void 0;
var flexible_logger_1 = require("../../logging/flexible-logger");
var tsyringe_1 = require("tsyringe");
var os = require("os");
var FlexibleConfigurableLogger = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FlexibleConfigurableLogger = _classThis = /** @class */ (function () {
        function FlexibleConfigurableLogger_1(config, consoleInstance) {
            if (consoleInstance === void 0) { consoleInstance = console; }
            this.config = config;
            this.consoleInstance = consoleInstance;
            this.hostname = os.hostname();
        }
        FlexibleConfigurableLogger_1.prototype.shouldLog = function (level) {
            var _a;
            // Check if level is enabled
            if (level > this.config.minLevel) {
                return false;
            }
            // Check sampling
            if (this.config.sampling && ((_a = this.config.sampling.levels) === null || _a === void 0 ? void 0 : _a.includes(level))) {
                return Math.random() < this.config.sampling.rate;
            }
            return true;
        };
        FlexibleConfigurableLogger_1.prototype.logStructured = function (level, message, context) {
            if (!this.shouldLog(level)) {
                return;
            }
            if (this.config.format === 'json') {
                var logEntry = __assign({ level: flexible_logger_1.LogLevel[level], message: message }, context);
                if (this.config.includeTimestamp) {
                    logEntry.timestamp = new Date().toISOString();
                }
                if (this.config.includeHostname) {
                    logEntry.hostname = this.hostname;
                }
                this.consoleInstance.log(JSON.stringify(logEntry));
            }
            else {
                // Text format
                var prefix = flexible_logger_1.LogLevel[level];
                var contextStr = context ? " ".concat(JSON.stringify(context)) : '';
                var timestamp = this.config.includeTimestamp ? "[".concat(new Date().toISOString(), "] ") : '';
                this.consoleInstance.log("".concat(timestamp).concat(prefix, ": ").concat(message).concat(contextStr));
            }
        };
        FlexibleConfigurableLogger_1.prototype.emergency = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.EMERGENCY, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.alert = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.ALERT, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.crit = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.CRITICAL, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.error = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.ERROR, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.warning = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.WARNING, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.notice = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.NOTICE, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.info = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.INFO, message, context);
        };
        FlexibleConfigurableLogger_1.prototype.debug = function (message, context) {
            this.logStructured(flexible_logger_1.LogLevel.DEBUG, message, context);
        };
        return FlexibleConfigurableLogger_1;
    }());
    __setFunctionName(_classThis, "FlexibleConfigurableLogger");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlexibleConfigurableLogger = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.TYPE = Symbol("FlexibleConfigurableLogger");
    (function () {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlexibleConfigurableLogger = _classThis;
}();
exports.FlexibleConfigurableLogger = FlexibleConfigurableLogger;
