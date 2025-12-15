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
exports.SetupEventSourcesCommand = void 0;
var lodash_1 = require("lodash");
var tsyringe_1 = require("tsyringe");
var DUPLICATE_EVENT_TYPES = function (types) { return "There is more than one eventSource that emits events with the same type: ".concat(types); };
var SetupEventSourcesCommand = function () {
    var _classDecorators = [(0, tsyringe_1.injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SetupEventSourcesCommand = _classThis = /** @class */ (function () {
        function SetupEventSourcesCommand_1(logger, eventSourcesProvider) {
            this.logger = logger;
            this.eventSourcesProvider = eventSourcesProvider;
        }
        SetupEventSourcesCommand_1.prototype.execute = function (app) {
            this.logger.debug("Setting up event sources...");
            app.eventSources = this.eventSourcesProvider();
            this.logger.debug("Analysing events for ".concat(app.eventSources.length || 0, " event sources..."));
            this.duplicateEventTypesWarning(app.eventSources);
            this.logger.debug("Setup done for ".concat(app.eventSources.length || 0, " event sources\n"));
        };
        SetupEventSourcesCommand_1.prototype.duplicateEventTypesWarning = function (eventSources) {
            var eventTypes = (0, lodash_1.flatten)(eventSources.map(function (es) { return es.availableEventTypes; }));
            var duplicates = (0, lodash_1.filter)(eventTypes, function (val, i, iteratee) { return (0, lodash_1.includes)(iteratee, val, i + 1); }).filter(function (v) { return v !== undefined; });
            if (duplicates.length) {
                this.logger.warning(DUPLICATE_EVENT_TYPES(duplicates));
            }
            this.logger.debug("Your app will process ".concat(eventTypes.length || 0, " event types..."));
        };
        return SetupEventSourcesCommand_1;
    }());
    __setFunctionName(_classThis, "SetupEventSourcesCommand");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SetupEventSourcesCommand = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SetupEventSourcesCommand = _classThis;
}();
exports.SetupEventSourcesCommand = SetupEventSourcesCommand;
