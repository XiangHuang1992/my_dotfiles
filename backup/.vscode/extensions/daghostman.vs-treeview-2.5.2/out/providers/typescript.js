"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const ts = require("typescript-parser");
const vscode = require("vscode");
class TypescriptProvider {
    constructor() {
        this.VISIBILITY = [
            "private", "protected", "public",
        ];
        this.parser = new ts.TypescriptParser();
        this.config = vscode.workspace.getConfiguration("treeview.js");
    }
    hasSupport(langId) {
        return langId.toLowerCase() === "typescript" ||
            langId.toLowerCase() === "javascript";
    }
    refresh(document) {
        this.config = vscode.workspace.getConfiguration("treeview.js");
        const useStrict = document.getText().toString().substr(1, 10) === "use strict";
        this.tree = this.parser.parseSource(document.getText()).then((raw) => {
            const tree = {};
            tree.strict = useStrict;
            for (const ns of raw.resources) {
                if (ns instanceof ts.Namespace || ns instanceof ts.Module) {
                    for (const dec of ns.declarations) {
                        this.walk(dec, tree, ns.name);
                    }
                }
            }
            for (const dec of raw.declarations) {
                this.walk(dec, tree);
            }
            for (const imp of raw.imports) {
                if (tree.imports === undefined) {
                    tree.imports = [];
                }
                if (imp instanceof ts.NamedImport && imp.specifiers !== undefined) {
                    const classes = [];
                    for (const spec of imp.specifiers) {
                        classes.push(spec.specifier);
                    }
                    tree.imports.push({
                        name: `${imp.libraryName}: ${classes.join(", ")}`,
                        position: new vscode.Range(this.offsetToPosition(imp.start), this.offsetToPosition(imp.start)),
                    });
                }
                if (imp instanceof ts.NamespaceImport) {
                    tree.imports.push({
                        alias: imp.alias,
                        name: imp.libraryName,
                        position: new vscode.Range(this.offsetToPosition(imp.start), this.offsetToPosition(imp.start)),
                    });
                }
            }
            return Promise.resolve(tree);
        });
    }
    getTokenTree() {
        return this.tree;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve([]);
    }
    getDocumentName(entityName, includeBodies = false) {
        return vscode.window.showQuickPick([
            new QuickPickItem("JavaScript", "Will create a `.js` file", "js"),
            new QuickPickItem("TypeScript", "Will create a `.ts` file", "ts"),
        ], {
            ignoreFocusOut: true,
            placeHolder: "Chose file extension",
        }).then((r) => {
            let name = entityName;
            if (name.indexOf(".") !== -1) {
                const nsSplit = name.split(".");
                name = nsSplit.pop();
            }
            return (includeBodies ?
                `${name}.${r.detail}` : `I${name}.ts`);
        });
    }
    generate(entityName, skeleton, includeBodies, options = {}) {
        if (entityName.indexOf(".") !== -1) {
            const nsSplit = entityName.split(".");
            entityName = nsSplit.pop();
            options.ns = nsSplit.join(".");
        }
        const hasNs = (options.ns !== undefined && options.ext === "ts");
        const edits = [];
        if (options.strict !== undefined && options.strict === true) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 13)), "\"use strict\"" + os.EOL));
        }
        if (hasNs) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), `export ${this.config.get("defaultNamespaceType")} ${options.ns} {` + os.EOL));
        }
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), (hasNs ? " ".repeat(4) : "") +
            `export ${!includeBodies ? "interface" : `${skeleton.abstract ? "abstract " : ""}class`} ` +
            `${entityName} {` + os.EOL));
        if (skeleton.properties !== undefined) {
            const properties = skeleton.properties.filter((c) => c.visibility === "public");
            for (const constant of properties) {
                const line = (hasNs ? " ".repeat(4) : "") + `    ` +
                    `${includeBodies ? "public " : ""}${constant.name}` +
                    `${constant.value !== "" ? `= ${constant.value}` : ""};`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, line.length)), line + os.EOL));
                if (properties.indexOf(constant) === properties.length - 1 &&
                    skeleton.methods.length !== 0) {
                    const constantPosition = skeleton.constants.indexOf(constant);
                    edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), os.EOL));
                }
            }
        }
        if (skeleton.methods !== undefined) {
            const methods = skeleton.methods.filter((m) => m.visibility === "public");
            for (const method of methods) {
                if (!includeBodies && method.static) {
                    continue;
                }
                let body = ";";
                if (includeBodies) {
                    body = (hasNs ? " ".repeat(4) : "") +
                        `${os.EOL}    {` +
                        (hasNs ? " ".repeat(4) : "") +
                        `        throw new Error(\"Not implemented\");` +
                        (hasNs ? " ".repeat(4) : "") +
                        `${os.EOL}    }` + (methods.indexOf(method) === methods.length - 1 ? "" : os.EOL);
                }
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.name}: ${arg.type}${arg.value !== "" ? ` = ${arg.value}` : ""}`);
                }
                const returnType = method.type !== undefined && method.type !== "mixed" ?
                    method.type : "";
                const line = (hasNs ? " ".repeat(4) : "") +
                    `    ${includeBodies ? `public ${skeleton.abstract ? "abstract " : ""}` +
                        `${method.static ? "static " : ""}` : ""}` +
                    `${method.name}(${args.join(", ")})` +
                    `${returnType !== "" ? `: ${returnType}` : ""}${body}`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 2 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 2 : 0), line.length)), line + os.EOL));
            }
        }
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 2 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 2 : 0), 1024)), (hasNs ? " ".repeat(4) : "") + "}" + os.EOL));
        if (hasNs) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), "}"));
        }
        return edits;
    }
    walk(dec, tree, namespace) {
        if (dec instanceof ts.ClassDeclaration) {
            if (tree.classes === undefined) {
                tree.classes = [];
            }
            if (dec instanceof ts.ClassDeclaration && dec.ctor !== undefined) {
                dec.ctor.name = "constructor";
                dec.methods.unshift(dec.ctor);
            }
            let entityName = (namespace !== undefined ? `${namespace}.` : "") + `${dec.name}`;
            if (this.config.has("namespacePosition")) {
                if (this.config.get("namespacePosition") === "suffix") {
                    entityName =
                        `${dec.name}${namespace !== undefined ? `: ${namespace}` : ""}`;
                }
                if (this.config.get("namespacePosition") === "none") {
                    entityName = `${dec.name}`;
                }
            }
            const def = vscode.window.activeTextEditor.document.getText(new vscode.Range(this.offsetToPosition(dec.start), this.offsetToPosition(dec.end))).split(" ").slice(0, 5);
            tree.classes.push({
                abstract: (def.indexOf("abstract") > -1),
                methods: this.handleMethods(dec.methods),
                name: entityName,
                properties: this.handleProperties(dec.properties),
                visibility: dec.isExported === true ? "public" : "protected",
            });
        }
        if (dec instanceof ts.InterfaceDeclaration) {
            if (tree.interfaces === undefined) {
                tree.interfaces = [];
            }
            let entityName = (namespace !== undefined ? `${namespace}.` : "") + `${dec.name}`;
            if (this.config.has("namespacePosition")) {
                if (this.config.get("namespacePosition") === "suffix") {
                    entityName =
                        `${dec.name}${namespace !== undefined ? `: ${namespace}` : ""}`;
                }
                if (this.config.get("namespacePosition") === "none") {
                    entityName = `${dec.name}`;
                }
            }
            tree.interfaces.push({
                methods: this.handleMethods(dec.methods),
                name: entityName,
                properties: this.handleProperties(dec.properties)
                    .filter((p) => p.visibility === "public"),
                visibility: dec.isExported === true ? "public" : "protected",
            });
        }
        if (dec instanceof ts.VariableDeclaration) {
            const startPosition = vscode.window.activeTextEditor.document.positionAt(dec.start);
            if (tree.variables === undefined) {
                tree.variables = [];
            }
            let v = vscode.window.activeTextEditor.document.getText(new vscode.Range(this.offsetToPosition(dec.start), this.offsetToPosition(dec.end)));
            v = v.substr(v.indexOf("=") + 1)
                .replace(";", "")
                .trim();
            v = v.length > 32 ? v.substr(0, 32) + ".." : v;
            if (v.length === 0) {
                // well, we need to unset it
                v = undefined;
            }
            tree.variables.push({
                name: `${dec.name}`,
                position: this.generateRangeForSelection(dec.name, dec.start),
                type: dec.type === undefined ? "any" : dec.type,
                value: v,
                visibility: dec.isExported === true ? "public" : "protected",
            });
        }
        if (dec instanceof ts.FunctionDeclaration) {
            const startPosition = vscode.window.activeTextEditor.document.positionAt(dec.start);
            if (tree.functions === undefined) {
                tree.functions = [];
            }
            tree.functions.push({
                arguments: this.handleArguments(dec.parameters),
                name: dec.name,
                position: this.generateRangeForSelection(dec.name, dec.start),
                static: true,
                type: dec.type === null ? "any" : dec.type,
                visibility: dec.isExported === true ? "public" : "protected",
            });
        }
    }
    handleProperties(children) {
        const properties = [];
        for (const property of children) {
            const def = vscode.window.activeTextEditor.document.getText(new vscode.Range(this.offsetToPosition(property.start), this.offsetToPosition(property.end))).split(" ").slice(0, 5);
            properties.push({
                name: property.name,
                position: this.generateRangeForSelection(property.name, property.start),
                readonly: (def.indexOf("readonly") > -1),
                static: (def.indexOf("static") > -1),
                type: property.type === undefined ? "any" : property.type,
                value: this.normalizeType(property.value, property.type),
                visibility: this.VISIBILITY[property.visibility === undefined ? 2 : property.visibility],
            });
        }
        return properties;
    }
    normalizeType(value, type) {
        if (value === null || value === undefined) {
            return "";
        }
        let val;
        switch (type) {
            case "array":
                let arr;
                for (const x of value.items) {
                    if (x.key === null) {
                        if (arr === undefined) {
                            arr = [];
                        }
                        arr.push(x.value.value);
                    }
                    else {
                        if (arr === undefined) {
                            arr = {};
                        }
                        arr[x.key] = x.value.value;
                    }
                }
                val = JSON.stringify(arr);
                break;
            case "string":
                val = `"${value}"`;
                break;
            default:
                val = value;
                break;
        }
        return val;
    }
    handleMethods(children) {
        const methods = [];
        for (const method of children) {
            const def = vscode.window.activeTextEditor.document.getText(new vscode.Range(this.offsetToPosition(method.start), this.offsetToPosition(method.end))).split(" ").slice(0, 5);
            methods.push({
                abstract: (def.indexOf("abstract") > -1),
                arguments: this.handleArguments(method.parameters),
                name: method.name,
                position: this.generateRangeForSelection(method.name, method.start),
                static: (def.indexOf("static") > -1),
                type: method.name !== "constructor" ? (method.type === undefined ? "any" : method.type) : undefined,
                visibility: this.VISIBILITY[method.visibility === undefined ? 2 : method.visibility],
            });
        }
        return methods;
    }
    handleArguments(children) {
        const variables = [];
        for (const variable of children) {
            variables.push({
                name: variable.name,
                type: variable.type === null ? "any" : variable.type,
                value: variable.value === undefined ? "" : this.normalizeType(variable.value, variable.type),
                visibility: variable.visibility === undefined ? "public" : variable.visibility,
            });
        }
        return variables;
    }
    offsetToPosition(offset) {
        return vscode.window.activeTextEditor.document.positionAt(offset);
    }
    generateRangeForSelection(name, offset) {
        const startPosition = this.offsetToPosition(offset);
        const line = vscode.window.activeTextEditor.document.lineAt(startPosition.line).text;
        const startIndex = line.indexOf(name);
        const lastIndex = line.lastIndexOf(name);
        if (startIndex > -1 && lastIndex > -1) {
            return new vscode.Range(new vscode.Position(startPosition.line, startIndex), new vscode.Position(startPosition.line, startIndex + name.length));
        }
        return new vscode.Range(new vscode.Position(startPosition.line, startIndex > -1 ? startIndex : 0), new vscode.Position(startPosition.line, startIndex > -1 ? startIndex : 0));
    }
}
exports.TypescriptProvider = TypescriptProvider;
class QuickPickItem {
    constructor(label, description, detail) {
        this.label = label;
        this.description = description;
        this.detail = detail;
    }
}
//# sourceMappingURL=typescript.js.map