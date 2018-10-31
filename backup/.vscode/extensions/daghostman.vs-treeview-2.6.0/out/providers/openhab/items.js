"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const provider_1 = require("./../../provider");
const tokens_1 = require("./../../tokens");
const itemsParser_1 = require("./itemsParser");
class ItemsProvider {
    constructor() {
        this.parser = new itemsParser_1.ItemsParser();
    }
    hasSupport(langId) {
        return langId.toLowerCase() === "openhab" &&
            vscode.window.activeTextEditor.document.fileName.endsWith("items");
    }
    refresh(document) {
        this.tree = this.parser.parseSource(document.getText()).then((parsed) => {
            return Promise.resolve(parsed);
        });
    }
    getTokenTree() {
        return this.tree;
    }
    getDocumentName(name, include = false) {
        throw new Error("Unsupported action");
    }
    generate(name, node, include, options = {}) {
        throw new Error("Unsupported action");
    }
    getChildren(element) {
        const items = [];
        return this.getTokenTree().then((tree) => {
            if (element === undefined) {
                if (tree.items && tree.items.length) {
                    items.push(new tokens_1.SectionItem(`Items`, tree.items !== undefined ?
                        vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed, "items-section"));
                }
            }
            else {
                if (element.contextValue === "items-section") {
                    for (const item of tree.items) {
                        const t = new tokens_1.TraitItem(`${item.name}`, vscode.TreeItemCollapsibleState.None);
                        items.push(provider_1.Provider.addItemCommand(provider_1.Provider.addItemIcon(t, `use`), "extension.treeview.goto", [item.position]));
                    }
                }
            }
            return Promise.resolve(items);
        });
    }
    getTreeItem(element) {
        return element;
    }
}
exports.ItemsProvider = ItemsProvider;
//# sourceMappingURL=items.js.map