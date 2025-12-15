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
exports.FlexiblePipeline = void 0;
/**
 * A pipeline that processes events through a stack of middleware functions.
 *
 * The pipeline executes middleware in order, collecting responses and errors.
 * Each middleware can:
 * - Transform the event
 * - Add data to the response
 * - Throw errors (which are caught and added to the error stack)
 * - Access shared context through the contextBinnacle
 *
 * Middleware execution continues even if errors occur, allowing error handlers
 * to process errors from earlier middleware.
 *
 * @example
 * ```typescript
 * const pipeline = new FlexiblePipeline([
 *   authMiddleware,
 *   validationMiddleware,
 *   businessLogicMiddleware,
 *   errorHandlerMiddleware
 * ]);
 *
 * const response = await pipeline.processEvent(event, {}, {});
 * ```
 */
var FlexiblePipeline = /** @class */ (function () {
    function FlexiblePipeline(middlewareStack) {
        this.middlewareStack = middlewareStack;
    }
    /**
     * Processes an event through the middleware stack.
     *
     * The processing flow:
     * 1. Creates an empty response object
     * 2. Executes each middleware in order
     * 3. Collects successful responses in responseStack
     * 4. Collects errors in errorStack
     * 5. Returns the complete response with all results
     *
     * @param event - The event to process
     * @param filterBinnacle - Shared state from filter evaluation (e.g., route parameters)
     * @param contextBinnacle - Shared context across middleware (e.g., user session, request ID)
     * @returns Response object containing all middleware results and any errors
     */
    FlexiblePipeline.prototype.processEvent = function (event, filterBinnacle, contextBinnacle) {
        return __awaiter(this, void 0, void 0, function () {
            var response, i, newResponse, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        response = {
                            errorStack: [],
                            responseStack: []
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.middlewareStack.length)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.middlewareStack[i].processEvent(event, response, filterBinnacle, contextBinnacle)];
                    case 3:
                        newResponse = _a.sent();
                        response.responseStack.push(newResponse);
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _a.sent();
                        response.errorStack.push(ex_1);
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, response];
                }
            });
        });
    };
    return FlexiblePipeline;
}());
exports.FlexiblePipeline = FlexiblePipeline;
