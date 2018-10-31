"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const variable_1 = require("./variable");
class PropertyItem extends variable_1.VariableItem {
    constructor() {
        super(...arguments);
        this.contextValue = "property";
    }
}
exports.PropertyItem = PropertyItem;
//# sourceMappingURL=property.js.map