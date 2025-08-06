"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
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
var ErrorHandling;
(function (ErrorHandling) {
    var AppError = /** @class */ (function (_super) {
        __extends(AppError, _super);
        function AppError(message, code, userMessage) {
            var _this = _super.call(this, message) || this;
            _this.code = code;
            _this.userMessage = userMessage;
            _this.name = 'AppError';
            return _this;
        }
        return AppError;
    }(Error));
    ErrorHandling.AppError = AppError;
    /**
     * Handle errors and return appropriate response - show Settings card with error info
     */
    function handleError(error) {
        AppLogger.error('Error occurred', error);
        // Log user-friendly error message for debugging
        var userMessage = 'An unexpected error occurred';
        if (error instanceof AppError) {
            userMessage = error.userMessage || error.message;
        }
        else if (error instanceof Error) {
            // Don't expose internal error messages to users
            if (error.message.includes('API')) {
                userMessage = 'Failed to connect to AI service - Check your API key in Settings';
            }
            else if (error.message.includes('Gmail')) {
                userMessage = 'Failed to access email - Try refreshing Gmail';
            }
        }
        AppLogger.info('User-friendly error message', userMessage);
        // Return settings card - errors are handled via notifications in action handlers
        var settings = Config.getSettings();
        return UI.buildSettingsCard(settings);
    }
    ErrorHandling.handleError = handleError;
    /**
     * Wrap function with error handling
     */
    function withErrorHandling(fn, errorResponse) {
        return (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                return fn.apply(void 0, __spreadArray([], __read(args), false));
            }
            catch (error) {
                AppLogger.error("Error in ".concat(fn.name), error);
                return errorResponse;
            }
        });
    }
    ErrorHandling.withErrorHandling = withErrorHandling;
    /**
     * Validate required fields
     */
    function validateRequired(data, fields) {
        var missing = fields.filter(function (field) { return !data[field]; });
        if (missing.length > 0) {
            throw new AppError("Missing required fields: ".concat(missing.join(', ')), 'VALIDATION_ERROR', 'Please fill in all required fields');
        }
    }
    ErrorHandling.validateRequired = validateRequired;
})(ErrorHandling || (ErrorHandling = {}));
//# sourceMappingURL=error-handling.js.map