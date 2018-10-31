"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_1 = require("./function");
class MethodItem extends function_1.FunctionItem {
    constructor() {
        super(...arguments);
        this.contextValue = "method";
    }
}
exports.MethodItem = MethodItem;
//# sourceMappingURL=method.js.map