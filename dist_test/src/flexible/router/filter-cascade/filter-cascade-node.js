"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterCascadeNode = void 0;
var lodash_1 = require("lodash");
var FilterCascadeNode = /** @class */ (function () {
    function FilterCascadeNode(routeDataHelper, filter, parentNode) {
        if (parentNode === void 0) { parentNode = null; }
        this.routeDataHelper = routeDataHelper;
        this.filter = filter;
        this.parentNode = parentNode;
    }
    Object.defineProperty(FilterCascadeNode.prototype, "resource", {
        set: function (resource) {
            if (this.parentNode) {
                this.parentNode.resource = resource;
            }
            else {
                this._resource = resource;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FilterCascadeNode.prototype, "isValid", {
        get: function () {
            var data = this.routeData;
            return data !== null && this.routeDataHelper.isRouteData(data);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FilterCascadeNode.prototype, "routeData", {
        get: function () {
            var _this = this;
            var routeData = {};
            if (this.parentNode) {
                var parentData = this.parentNode.routeData;
                if (parentData === null) {
                    return null;
                }
                routeData = parentData;
                if (!this.routeDataHelper.isRouteData(routeData)) {
                    return null;
                }
            }
            var isValid = this.validateMerge(routeData, this.filter.staticRouting);
            if (!isValid) {
                return null;
            }
            return (0, lodash_1.mergeWith)({}, routeData, this.filter.staticRouting, function (objValue, srcValue) {
                if (_this.routeDataHelper.isRouteDataArray(objValue) && _this.routeDataHelper.isRouteDataArray(srcValue) ||
                    _this.isArrayAndSameType(objValue, srcValue) || _this.isArrayAndSameType(srcValue, objValue)) {
                    if (!_this.routeDataHelper.isRouteDataArray(objValue)) {
                        objValue = [objValue];
                    }
                    if (!_this.routeDataHelper.isRouteDataArray(srcValue)) {
                        srcValue = [srcValue];
                    }
                    return (0, lodash_1.union)(objValue, srcValue);
                }
            });
        },
        enumerable: false,
        configurable: true
    });
    FilterCascadeNode.prototype.getEventResources = function (event_1, filterBinnacle_1) {
        return __awaiter(this, arguments, void 0, function (event, filterBinnacle, ignoreStaticRouting) {
            var pipeline, parentResult, isMatch;
            if (ignoreStaticRouting === void 0) { ignoreStaticRouting = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = this._resource;
                        if (!this.parentNode && !this._resource) {
                            throw "Parent Node without Pipeline";
                        }
                        if (!this.parentNode) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.parentNode.getEventResources(event, filterBinnacle, ignoreStaticRouting)];
                    case 1:
                        parentResult = _a.sent();
                        if (parentResult === null) {
                            return [2 /*return*/, null];
                        }
                        pipeline = parentResult;
                        _a.label = 2;
                    case 2:
                        isMatch = ignoreStaticRouting || this.isRouteMatch(this.filter.staticRouting, event.routeData);
                        if (!this.filter.filterEvent) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.filter.filterEvent(event, filterBinnacle)];
                    case 3:
                        isMatch = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!isMatch) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, pipeline];
                }
            });
        });
    };
    FilterCascadeNode.prototype.isRouteMatch = function (ownRoute, routeData) {
        var _this = this;
        return Object.keys(ownRoute).every(function (innerProperty) {
            var ownRouteValue = ownRoute[innerProperty];
            var routeValue = routeData[innerProperty];
            if (typeof ownRouteValue === typeof routeValue) {
                if (_this.routeDataHelper.isRouteData(ownRouteValue) &&
                    _this.routeDataHelper.isRouteData(routeValue) &&
                    _this.isRouteMatch(ownRouteValue, routeValue)) {
                    return true;
                }
                if (_this.routeDataHelper.isRouteDataArray(ownRouteValue) &&
                    _this.routeDataHelper.isRouteDataArray(routeValue) &&
                    (0, lodash_1.intersection)(ownRouteValue, routeValue).length === ownRouteValue.length) {
                    return true;
                }
                if (ownRouteValue === routeValue) {
                    return true;
                }
            }
            else if (_this.isArrayAndSameType(ownRouteValue, routeValue)) {
                ownRouteValue.indexOf(ownRouteValue) != -1;
            }
            else if (_this.isArrayAndSameType(routeValue, ownRouteValue)) {
                return routeValue.indexOf(ownRouteValue) != -1;
            }
            return false;
        });
    };
    FilterCascadeNode.prototype.validateMerge = function (rootData, ownRouteData) {
        var _this = this;
        return Object.keys(ownRouteData).every(function (innerProperty) {
            return _this.validateProperty(rootData[innerProperty], ownRouteData[innerProperty]);
        });
    };
    FilterCascadeNode.prototype.validateProperty = function (rootDataProperty, ownDataProperty) {
        if (rootDataProperty === undefined) {
            return true;
        }
        if (typeof rootDataProperty === typeof ownDataProperty &&
            (this.routeDataHelper.isRouteData(rootDataProperty) && this.validateMerge(rootDataProperty, ownDataProperty) ||
                this.routeDataHelper.isRouteDataArray(rootDataProperty) && this.isArrayAndSameType(ownDataProperty, rootDataProperty[0]) ||
                rootDataProperty === ownDataProperty)) {
            return true;
        }
        if (this.isArrayAndSameType(ownDataProperty, rootDataProperty) ||
            this.isArrayAndSameType(rootDataProperty, ownDataProperty)) {
            return true;
        }
        return false;
    };
    FilterCascadeNode.prototype.isArrayAndSameType = function (value1, value2) {
        return this.routeDataHelper.isRouteDataArray(value1) && (typeof value1[0] === typeof value2);
    };
    return FilterCascadeNode;
}());
exports.FilterCascadeNode = FilterCascadeNode;
