"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const variable_1 = require("./variable");
class ConstantItem extends variable_1.VariableItem {
    constructor() {
        super(...arguments);
        this.contextValue = "constant";
    }
}
exports.ConstantItem = ConstantItem;
//# sourceMappingURL=constant.js.map