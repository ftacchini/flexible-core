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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteDataHelper = void 0;
var util_1 = require("util");
var tsyringe_1 = require("tsyringe");
var lodash_1 = require("lodash");
var SEPARATOR = "@";
var RouteDataHelper = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RouteDataHelper = _classThis = /** @class */ (function () {
        function RouteDataHelper_1() {
        }
        RouteDataHelper_1.prototype.isBoolean = function (object) {
            return (0, util_1.isBoolean)(object);
        };
        RouteDataHelper_1.prototype.isNumber = function (object) {
            return (0, util_1.isNumber)(object);
        };
        RouteDataHelper_1.prototype.isString = function (object) {
            return (0, util_1.isString)(object);
        };
        RouteDataHelper_1.prototype.isRouteData = function (object) {
            return (0, util_1.isObject)(object) && !(0, util_1.isArray)(object);
        };
        RouteDataHelper_1.prototype.isArrayString = function (object) {
            return (0, util_1.isArray)(object) && !!object.length && (0, util_1.isString)(object[0]);
        };
        RouteDataHelper_1.prototype.isArrayNumber = function (object) {
            return (0, util_1.isArray)(object) && !!object.length && (0, util_1.isNumber)(object[0]);
        };
        RouteDataHelper_1.prototype.isRouteDataArray = function (object) {
            return this.isArrayNumber(object) || this.isArrayString(object);
        };
        RouteDataHelper_1.prototype.turnIntoPlainRouteData = function (routeData, propertyChain) {
            var _this = this;
            if (propertyChain === void 0) { propertyChain = []; }
            var plainRouteData = {};
            Object.keys(routeData).forEach(function (property) {
                var value = routeData[property];
                if (_this.isRouteData(value)) {
                    plainRouteData = __assign(__assign({}, plainRouteData), _this.turnIntoPlainRouteData(value, __spreadArray([property], propertyChain, true)));
                }
                else {
                    plainRouteData[_this.getPropertyString(propertyChain, property)] = value;
                }
            });
            return plainRouteData;
        };
        RouteDataHelper_1.prototype.getPropertyString = function (propertyChain, property) {
            return (0, lodash_1.join)(__spreadArray([property], propertyChain, true), SEPARATOR);
        };
        return RouteDataHelper_1;
    }());
    __setFunctionName(_classThis, "RouteDataHelper");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RouteDataHelper = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RouteDataHelper = _classThis;
}();
exports.RouteDataHelper = RouteDataHelper;
