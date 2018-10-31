"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class CFamilyProvider {
    constructor() {
        this.tree = {};
    }
    hasSupport(langId) {
        return ["csharp", "c", "cpp"].indexOf(langId) !== -1;
    }
    refresh(document) {
        this.config = vscode.workspace.getConfiguration("treeview.cfamily");
        vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", document.uri).then((symbols) => {
            this.tree = {
                strict: true,
            };
            for (const symbol of symbols) {
                const namespace = this.tree.namespace;
                const startLine = symbol.location.range.start.line;
                const def = vscode.window.activeTextEditor.document.getText(new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(startLine, 2048))).trim().slice(0, -1);
                switch (symbol.kind) {
                    case vscode.SymbolKind.Namespace:
                        this.tree.namespace = symbol.name;
                        break;
                    case vscode.SymbolKind.Module:
                    case vscode.SymbolKind.Package:
                        this.tree.imports = this.tree.imports || [];
                        this.tree.imports.push({
                            name: symbol.name,
                            position: symbol.location.range,
                        });
                        break;
                    case vscode.SymbolKind.Class:
                        if (namespace) {
                            symbol.name = `${namespace}.${symbol.name}`;
                            if (this.config.has("namespacePosition")) {
                                if (this.config.get("namespacePosition") === "suffix") {
                                    symbol.name = `${symbol.name}${this.tree.namespace !== undefined ?
                                        `: ${this.tree.namespace}` : ""}`;
                                }
                                if (this.config.get("namespacePosition") === "none") {
                                    symbol.name = `${symbol.name}`;
                                }
                            }
                        }
                        const classKeys = def.split(" ").slice(0, 20);
                        this.tree.classes = this.tree.classes || [];
                        this.tree.classes.push({
                            abstract: (classKeys.indexOf("abstract") !== -1),
                            name: symbol.name,
                            position: symbol.location.range,
                            readonly: (classKeys.indexOf("final") !== -1),
                            visibility: "public",
                        });
                        break;
                    case vscode.SymbolKind.Interface:
                        if (namespace) {
                            symbol.name = `${namespace}.${symbol.name}`;
                            if (this.config.has("namespacePosition")) {
                                if (this.config.get("namespacePosition") === "suffix") {
                                    symbol.name = `${symbol.name}${this.tree.namespace !== undefined ?
                                        `: ${this.tree.namespace}` : ""}`;
                                }
                                if (this.config.get("namespacePosition") === "none") {
                                    symbol.name = `${symbol.name}`;
                                }
                            }
                        }
                        this.tree.interfaces = this.tree.interfaces || [];
                        this.tree.interfaces.push({
                            name: `${this.tree.namespace}.${symbol.name}`,
                            position: symbol.location.range,
                            visibility: "public",
                        });
                        break;
                    case vscode.SymbolKind.Property:
                    case vscode.SymbolKind.Field:
                        const propertyParent = this.tree.classes.find((c) => c.name === symbol.containerName) ||
                            this.tree.interfaces.find((i) => i.name === symbol.containerName);
                        if (propertyParent) {
                            const propKeys = def.split(" ").filter((i) => i.trim().length > 0).slice(0, 20);
                            propertyParent.properties = propertyParent.properties || [];
                            propertyParent.properties.push(this.handleVar(def, symbol));
                        }
                        break;
                    case vscode.SymbolKind.Constructor:
                    case vscode.SymbolKind.Method:
                        const methodParent = this.tree.classes.find((c) => c.name === symbol.containerName) ||
                            this.tree.interfaces.find((i) => i.name === symbol.containerName);
                        if (methodParent) {
                            methodParent.methods = methodParent.methods || [];
                            methodParent.methods.push(this.handleFunc(def, symbol));
                        }
                        break;
                    case vscode.SymbolKind.Variable:
                        this.tree.variables = this.tree.variables || [];
                        const v = this.handleVar(def, symbol);
                        if (v.value === "") {
                            v.value = undefined;
                        }
                        this.tree.variables.push(v);
                        break;
                    case vscode.SymbolKind.Function:
                        this.tree.functions = this.tree.functions || [];
                        this.tree.functions.push(this.handleFunc(def, symbol));
                        break;
                }
            }
        });
    }
    getTokenTree() {
        return Promise.resolve(this.tree);
    }
    getTreeItem(item) {
        return item;
    }
    getChildren(item) {
        return Promise.resolve([]);
    }
    generate(entityName, node, includeBody, options) {
        return [];
    }
    getDocumentName(entityName, includeBody) {
        return Promise.reject("C/C++/C# Generation is currently not supported :/ ");
    }
    handleVar(def, symbol) {
        const propKeys = def.split(" ").filter((i) => i.trim().length > 0).slice(0, 20);
        return {
            name: symbol.name,
            position: symbol.location.range,
            readonly: (propKeys.indexOf("readonly") !== -1),
            static: (propKeys.indexOf("static") !== -1),
            type: propKeys.indexOf("=") !== -1 ?
                propKeys[propKeys.indexOf(symbol.name) - 1] :
                propKeys[propKeys.indexOf(propKeys.find((x) => x.substr(0, symbol.name.length) === symbol.name)) - 1],
            value: (propKeys.indexOf("=") !== -1) ? propKeys.slice(propKeys.indexOf("=") + 1)
                .join(" ")
                .trim() : "",
            visibility: propKeys.find((v) => {
                return v === "public" || v === "protected" || v === "private";
            }) || "public",
        };
    }
    handleFunc(def, symbol) {
        const propKeys = def.split(" ").filter((i) => i.trim().length > 0).slice(0, 20);
        const type = propKeys.indexOf(symbol.name) !== -1 ?
            propKeys[propKeys.indexOf(symbol.name) - 1] :
            propKeys[propKeys.indexOf(propKeys.find((x) => {
                x = x.indexOf("(") !== -1 ?
                    x.substr(0, x.indexOf("(")) : x;
                const d = symbol.name.indexOf("(");
                return x === symbol.name.substr(0, d !== -1 ? d : undefined);
            })) - 1];
        const dest = symbol.name.indexOf("(");
        return {
            abstract: (propKeys.indexOf("abstract") !== -1),
            arguments: def.slice(def.indexOf("(") + 1, def.indexOf(")") !== -1 ? def.indexOf(")") : def.length)
                .split(",")
                .filter((x) => x.trim().length > 0).map((a) => {
                const split = a.trim().split("=");
                const p = split[0].trim().split(" ").filter((i) => i.trim().length > 0);
                return {
                    name: p[1],
                    type: p[0],
                    value: split[1] || "",
                };
            }) || [],
            name: symbol.name.slice(0, dest !== -1 ? dest : undefined),
            position: symbol.location.range,
            readonly: (propKeys.indexOf("final") !== -1),
            static: (propKeys.indexOf("static") !== -1),
            type,
            value: (propKeys.indexOf("=") !== -1) ? propKeys.slice(propKeys.indexOf("=") + 1)
                .join(" ")
                .trim() : "",
            visibility: propKeys.find((v) => {
                return v === "public" || v === "protected" || v === "private";
            }) || "public",
        };
    }
}
exports.CFamilyProvider = CFamilyProvider;
//# sourceMappingURL=cfamily.js.map