"use strict";
var Types;
(function (Types) {
    /**
     * Response generation modes
     */
    var ResponseMode;
    (function (ResponseMode) {
        ResponseMode["DRAFT"] = "draft";
        ResponseMode["SUGGEST"] = "suggest";
        ResponseMode["TEMPLATE"] = "template";
        ResponseMode["AUTO"] = "auto";
    })(ResponseMode = Types.ResponseMode || (Types.ResponseMode = {}));
    /**
     * Response length preferences
     */
    var ResponseLength;
    (function (ResponseLength) {
        ResponseLength["SHORT"] = "short";
        ResponseLength["MEDIUM"] = "medium";
        ResponseLength["LONG"] = "long";
    })(ResponseLength = Types.ResponseLength || (Types.ResponseLength = {}));
})(Types || (Types = {}));
//# sourceMappingURL=types.js.map