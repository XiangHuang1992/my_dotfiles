"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const provider_1 = require("./../../provider");
const tokens_1 = require("./../../tokens");
const ruleParser_1 = require("./ruleParser");
class RuleProvider {
    constructor() {
        this.parser = new ruleParser_1.RuleParser();
    }
    hasSupport(langId) {
        return langId.toLowerCase() === "openhab" &&
            vscode.window.activeTextEditor.document.fileName.endsWith("rules");
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
                if (tree.rules && tree.rules.length) {
                    items.push(new tokens_1.SectionItem(`Rules`, tree.rules !== undefined ?
                        vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed, "rule-section"));
                }
            }
            else {
                if (element.contextValue === "rule-section") {
                    for (const rule of tree.rules) {
                        const t = new tokens_1.TraitItem(`${rule.name}`, vscode.TreeItemCollapsibleState.None);
                        items.push(provider_1.Provider.addItemCommand(provider_1.Provider.addItemIcon(t, `use`), "extension.treeview.goto", [rule.position]));
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
exports.RuleProvider = RuleProvider;
//# sourceMappingURL=rule.js.map