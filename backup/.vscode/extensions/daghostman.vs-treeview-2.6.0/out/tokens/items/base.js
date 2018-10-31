"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class BaseItem extends vscode_1.TreeItem {
    constructor(label, collapsibleState, contextValue, position, visibility) {
        super(label, collapsibleState);
        this.position = position;
        this.visibility = visibility;
        this.contextValue = contextValue === undefined ? this.contextValue : contextValue;
        this.tooltip = label;
    }
}
exports.BaseItem = BaseItem;
//# sourceMappingURL=base.js.map