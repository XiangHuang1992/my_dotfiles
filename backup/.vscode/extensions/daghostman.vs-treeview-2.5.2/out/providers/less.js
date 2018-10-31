"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const provider_1 = require("../provider");
class LessProvider {
    constructor() {
        this.tree = {};
    }
    hasSupport(lang) {
        return lang === "less";
    }
    refresh(document) {
        const less = require("less");
        let raw;
        less.parse(document.getText(), (err, tree) => {
            raw = tree;
        });
        const variables = [];
        for (const v of raw.rules.filter((x) => x.selectors === undefined && x.params === undefined)) {
            variables.push({
                name: v.name,
                static: true,
                value: v.value.value,
                visibility: "public",
            });
        }
        this.tree.variables = variables;
        this.tree.nodes = {};
        for (const rule of raw.rules.filter((x) => x.selectors !== undefined && x.params === undefined)) {
            const [r, defs] = this.handleRule(rule);
            if (this.tree.nodes[r.name] === undefined) {
                this.tree.nodes[r.name] = defs;
            }
            else {
                this.tree.nodes[r.name] = this.tree.nodes[r.name].concat(defs);
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
            for (const selector in this.tree.nodes) {
                if (this.tree.nodes[selector] !== undefined) {
                    const item = new vscode.TreeItem(selector, vscode.TreeItemCollapsibleState.Collapsed);
                    provider_1.Provider.addItemIcon(item, "list", "public");
                    list.push(item);
                }
            }
        }
        else if (this.tree.nodes[element.label] !== undefined) {
            for (const selector of this.tree.nodes[element.label]) {
                const sign = selector.name.indexOf("@") === 0 ?
                    " = " : ": ";
                const item = new vscode.TreeItem(`${selector.name}${sign}${selector.value}`, vscode.TreeItemCollapsibleState.None);
                provider_1.Provider.addItemIcon(item, "property", "public");
                list.push(item);
            }
        }
        return Promise.resolve(list);
    }
    handleRule(rule) {
        const name = rule.selectors.map((x) => {
            return x.elements.map((y) => {
                return y.value;
            }).join(" ");
        }).join(", ");
        const variable = {
            name,
            static: true,
            visibility: "public",
        };
        const rules = [];
        for (const def of rule.rules) {
            if (def.rules !== undefined) {
                continue;
            }
            if (def.name !== undefined) {
                const prop = def.name;
                rules.push({
                    name: prop,
                    value: `${def.value.value}`,
                });
            }
            else {
                const prop = def.selector.elements[0].value;
                rules.push({
                    name: prop,
                    value: `(${def.arguments.map((x) => this.handleValue(x)).join(", ")})`,
                });
            }
        }
        return [variable, rules];
    }
    handleValue(x) {
        let v = x.name !== null ? x.name : `${x.value.value[0].value}`;
        if (x.value.value[0].unit) {
            v = `${v}${x.value.value[0].unit.backupUnit || ""}`;
        }
        if (x.value.value[0].rgb) {
            v = `{${x.value.value[0].rgb.join(", ")}@${x.value.value[0].alpha || ""}}`;
        }
        return v;
    }
}
exports.LessProvider = LessProvider;
//# sourceMappingURL=less.js.map