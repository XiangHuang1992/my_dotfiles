"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const provider_1 = require("../provider");
class CssProvider {
    constructor() {
        this.tree = {};
    }
    hasSupport(lang) {
        return lang === "css";
    }
    refresh(document) {
        const raw = require("css").parse(document.getText(), {
            source: document.uri.fsPath.toString(),
        }).stylesheet;
        const variables = [];
        this.tree.nodes = {};
        for (const rule of raw.rules.filter((x) => x.type === "rule")) {
            const [r, defs] = this.handleRule(rule);
            if (this.tree.nodes[r.name] === undefined) {
                this.tree.nodes[r.name] = defs;
            }
            else {
                this.tree.nodes[r.name] = this.tree.nodes[r.name].concat(defs);
            }
        }
        this.tree.media = {};
        for (const media of raw.rules.filter((x) => x.type === "media")) {
            if (this.tree.media[media.media] === undefined) {
                this.tree.media[media.media] = {};
            }
            for (const rule of media.rules.filter((y) => y.type === "rule")) {
                const [r, defs] = this.handleRule(rule);
                if (this.tree.media[media.media][r.name] === undefined) {
                    this.tree.media[media.media][r.name] = defs;
                }
                else {
                    this.tree.media[media.media][r.name] = this.tree.media[media.media][r.name].concat(defs);
                }
            }
        }
    }
    getTokenTree() {
        return Promise.resolve(this.tree);
    }
    generate(entityName, node, includeBody, options) {
        return [];
    }
    getDocumentName(entityName, includeBody) {
        return Promise.resolve(entityName);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        const list = [];
        if (element === undefined) {
            let i = 0;
            for (const media in this.tree.media) {
                if (this.tree.media.hasOwnProperty(media)) {
                    const item = new vscode.TreeItem(media, i === 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
                    // Provider.addItemCommand(item, "extension.treeview.goto", [this.tree.media[media].position]);
                    provider_1.Provider.addItemIcon(item, "list", "public");
                    list.push(item);
                    i++;
                }
            }
            for (const selector in this.tree.nodes) {
                if (this.tree.nodes[selector] !== undefined) {
                    const item = new vscode.TreeItem(selector, vscode.TreeItemCollapsibleState.Collapsed);
                    provider_1.Provider.addItemIcon(item, "list", "public");
                    list.push(item);
                }
            }
        }
        else {
            if (this.tree.media[element.label] !== undefined) {
                for (const selector in this.tree.media[element.label]) {
                    if (this.tree.media[element.label].hasOwnProperty(selector)) {
                        const item = new vscode.TreeItem(selector, vscode.TreeItemCollapsibleState.Collapsed);
                        provider_1.Provider.addItemIcon(item, "list", "public");
                        item.contextValue = element.label;
                        list.push(item);
                    }
                }
            }
            else if (element.contextValue !== undefined && this.tree.media[element.contextValue] !== undefined) {
                for (const selector of this.tree.media[element.contextValue][element.label]) {
                    const item = new vscode.TreeItem(`${selector.name}: ${selector.value}`, vscode.TreeItemCollapsibleState.None);
                    provider_1.Provider.addItemCommand(item, "extension.treeview.goto", [selector.position]);
                    provider_1.Provider.addItemIcon(item, "property", "public");
                    list.push(item);
                }
            }
            else {
                for (const selector of this.tree.nodes[element.label]) {
                    const item = new vscode.TreeItem(`${selector.name}: ${selector.value}`, vscode.TreeItemCollapsibleState.None);
                    provider_1.Provider.addItemCommand(item, "extension.treeview.goto", [selector.position]);
                    provider_1.Provider.addItemIcon(item, "property", "public");
                    list.push(item);
                }
            }
        }
        return Promise.resolve(list);
    }
    handleRule(rule) {
        const name = rule.selectors.join(",");
        const variable = {
            name,
            position: new vscode.Range(new vscode.Position(rule.position.start.line - 1, rule.position.start.column - 1), new vscode.Position(rule.position.start.line - 1, rule.position.start.column - 1 + name.length)),
            static: true,
            visibility: "public",
        };
        const rules = [];
        for (const def of rule.declarations) {
            const prop = def.property;
            rules.push({
                name: prop,
                position: new vscode.Range(new vscode.Position(def.position.end.line - 1, def.position.end.column - 1), new vscode.Position(def.position.end.line - 1, def.position.end.column - 1 - def.value.length)),
                value: def.value,
            });
        }
        return [variable, rules];
    }
}
exports.CssProvider = CssProvider;
//# sourceMappingURL=css.js.map