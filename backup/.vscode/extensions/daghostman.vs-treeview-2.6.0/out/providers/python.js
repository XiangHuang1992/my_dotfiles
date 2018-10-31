"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const vscode = require("vscode");
class PythonProvider {
    constructor() {
        this.tree = {};
    }
    static handleArgument(a, m, endOffset = 0) {
        const line = vscode.window.activeTextEditor.
            document.lineAt(m.loc.start.line - 1).text;
        const ptr = line.substr(a.loc.start.column);
        const matches = ptr.split(/[(,)]{1}/i, 1);
        let val = "";
        if (matches.length > 0) {
            val = matches[0].split("=", 2)[1] || "";
        }
        const n = a.name || (a.id ? a.id.name : undefined) || (a.property ? a.property.name : undefined);
        return {
            name: n,
            position: new vscode.Range(new vscode.Position(a.loc.start.line - 1, a.loc.start.column), new vscode.Position(a.loc.start.line - 1, a.loc.start.column + endOffset + n.length)),
            type: PythonProvider.getType(val.trim()),
            value: val.trim(),
            visibility: "public",
        };
    }
    static getType(value) {
        const numMatch = value.match(/^\d+$/);
        if (numMatch !== null && numMatch.length > 0) {
            return "number";
        }
        if (value.indexOf("\"") === 0 || value.indexOf("'") === 0) {
            return "string";
        }
        if (value.indexOf("{") === 0) {
            return "dict";
        }
        if (value.indexOf("[") === 0) {
            return "list";
        }
        if (value.indexOf("(") === 0) {
            return "tuple";
        }
        return value.match(/^[A-Z]/i) !== null ? value : "any";
    }
    hasSupport(langId) {
        return langId.toLowerCase() === "python";
    }
    refresh(document) {
        this.tree = {};
        const py = require("filbert")
            .parse(vscode.window.activeTextEditor.document.getText(), {
            locations: true,
        });
        for (const node of py.body) {
            switch (node.type) {
                case "BlockStatement":
                    if (this.tree.classes === undefined) {
                        this.tree.classes = [];
                    }
                    /*
                     * A hackish solution in order to identify all properties
                     * of an object, since `filbert` does not provide a
                     * reliable way to distinguish the properties, but
                     * instead we have to traverse the method body in order
                     * to retrieve all `this.` assignments and use those
                     */
                    const propers = [];
                    const rawProps = node.body.map((prop) => {
                        if (prop.type === "FunctionDeclaration" && prop.body.type === "BlockStatement") {
                            return prop.body.body.map((funcBody) => {
                                if (funcBody.type === "ExpressionStatement" &&
                                    funcBody.expression.type === "AssignmentExpression") {
                                    if (funcBody.expression.left.type === "MemberExpression") {
                                        const l = vscode.window.activeTextEditor.document.lineAt(funcBody.expression.left.loc.start.line - 1).text;
                                        return PythonProvider.handleArgument(funcBody.expression.left, funcBody.expression, l.indexOf("self") !== -1 ? 5 : 0);
                                    }
                                }
                            }).filter((j) => j !== undefined);
                        }
                        return undefined;
                    }).filter((y) => y !== undefined).map((raw) => {
                        for (const r of raw) {
                            propers.push(r);
                        }
                    });
                    this.tree.classes.push({
                        methods: node.body.map((fu) => (this.handleFunction(fu, node.body[0].id.name)))
                            .filter((m) => m !== undefined),
                        name: node.body[0].id.name,
                        properties: this.removeDuplicatesBy((x) => x.name, propers),
                    });
                    break;
                case "FunctionDeclaration":
                    const f = this.handleFunction(node);
                    if (f) {
                        if (this.tree.functions === undefined) {
                            this.tree.functions = [];
                        }
                        this.tree.functions.push(f);
                    }
                    break;
                case "VariableDeclaration":
                    if (this.tree.variables === undefined) {
                        this.tree.variables = [];
                    }
                    this.tree.variables.push(PythonProvider.handleArgument(node.declarations[0], node));
                    break;
                default:
                    // console.log(node.type);
                    break;
            }
        }
        /*
         * Check if the first defined block is at the beginning of the file.
         * We check for `> 1` to allow handling of files that start with a
         * shebang
         */
        if (py.body.length > 0 && py.body[0].loc.start.line > 1) {
            for (let i = 0; i < py.body[0].loc.start.line; i++) {
                const line = vscode.window.activeTextEditor.document.lineAt(i).text;
                if (line.indexOf("import ") === 0) {
                    if (this.tree.imports === undefined) {
                        this.tree.imports = [];
                    }
                    /*
                     * `filbert` does not provide import nodes, hence this
                     * hackish solution is necessary in order to normalize
                     * the "imports" section to the results produced by
                     * other providers
                     */
                    // Handle `import X`
                    let importName = line.trim().indexOf("import") === 0 ? line.substr(6).trim() : line.trim();
                    const importAlias = importName.indexOf(" as ") !== -1 ?
                        importName.substr(importName.indexOf(" as ") + 4) : undefined;
                    // Handle `import X as Y`
                    if (importAlias !== undefined) {
                        importName = importName.substr(0, importName.length - (importName.indexOf(importAlias) + 4));
                    }
                    // Handle `from X import Y, Z` imports
                    if (importName.indexOf("from ") === 0) {
                        let n = importName.slice(5, importName.lastIndexOf(" import "));
                        n += `: ` + (importAlias === undefined ?
                            importName.substr(importName.indexOf(" import ") + 8) : (importName.slice(importName.indexOf(" import ") + 8, importName.indexOf(" as ")))).split(",").map((item) => item.trim()).join(", ");
                        importName = n;
                    }
                    this.tree.imports.push({
                        alias: importAlias,
                        name: importName,
                        position: new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, line.length)),
                    });
                }
            }
        }
    }
    getTokenTree() {
        return Promise.resolve(this.tree);
    }
    getChildren(offset) {
        return Promise.resolve([]);
    }
    getTreeItem(offset) {
        return offset;
    }
    getDocumentName(name, include = false) {
        return Promise.resolve(`${name}.py`);
    }
    generate(entityName, skeleton, includeBodies, options = {}) {
        const edits = [];
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), `class ${entityName}${!includeBodies ? `(${skeleton.name})` : ""}:` + os.EOL));
        if (skeleton.constants !== undefined) {
            const constants = skeleton.constants.filter((c) => c.visibility === "public" || c.visibility === undefined);
            for (const constant of constants) {
                const line = `    ` +
                    `${constant.name}` +
                    `${constant.value !== undefined ? ` = ${constant.value}` : ""}`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, line.length)), line + os.EOL));
                if (constants.indexOf(constant) === constants.length - 1 &&
                    skeleton.methods.length !== 0) {
                    const constantPosition = skeleton.constants.indexOf(constant);
                    edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), os.EOL));
                }
            }
        }
        if (skeleton.properties !== undefined) {
            const properties = skeleton.properties
                .filter((p) => p.visibility === "public" || p.visibility === undefined);
            for (const prop of properties) {
                const line = `    ${prop.name}${prop.value !== "" ? `= ${prop.value}` : ""}`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, line.length)), line + os.EOL));
                if (properties.indexOf(prop) === properties.length - 1 &&
                    skeleton.methods.length !== 0) {
                    const constantPosition = skeleton.constants.indexOf(prop);
                    edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), os.EOL));
                }
            }
        }
        if (skeleton.methods !== undefined) {
            const methods = skeleton.methods.filter((m) => m.visibility === "public" || m.visibility === undefined);
            for (const method of methods) {
                let body = os.EOL + " ".repeat(8) + "pass" + os.EOL;
                if (includeBodies) {
                    body = `${os.EOL}        raise Exception(\"Not implemented\")` +
                        `${os.EOL}        pass` + (methods.indexOf(method) === methods.length - 1 ? "" : os.EOL);
                }
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.name}${arg.value !== "" ? ` = ${arg.value}` : ""}`);
                }
                const returnType = method.type !== undefined && method.type !== "mixed" ?
                    method.type : "";
                const line = `    def ${method.name}(${args.join(", ")})${body}`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 1 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 1 : 0), line.length)), line + os.EOL));
            }
        }
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 1 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 1 : 0), 1024)), "pass" + os.EOL));
        return edits;
    }
    handleFunction(m, className) {
        let functionName;
        let args;
        switch (m.type) {
            case "ExpressionStatement":
                const expr = m.expression;
                args = expr.right.params.map((a) => {
                    return PythonProvider.handleArgument(a, m);
                });
                functionName = expr.left.property.name;
                break;
            case "FunctionDeclaration":
                functionName = m.id.name;
                args = m.params.map((a) => {
                    return PythonProvider.handleArgument(a, m);
                });
                break;
            default:
                return undefined;
        }
        if (className !== undefined && className === functionName && args.length === 0) {
            return undefined;
        }
        const typeOffset = className !== functionName ?
            4 : 6;
        return {
            arguments: args,
            name: functionName,
            position: new vscode.Range(new vscode.Position(m.loc.start.line - 1, m.loc.start.column + typeOffset), new vscode.Position(m.loc.start.line - 1, m.loc.start.column + functionName.length + typeOffset)),
            visibility: "public",
        };
    }
    removeDuplicatesBy(keyFn, array) {
        const mySet = new Set();
        return array.filter((x) => {
            const key = keyFn(x);
            const isNew = !mySet.has(key);
            if (isNew) {
                mySet.add(key);
            }
            return isNew;
        });
    }
}
exports.PythonProvider = PythonProvider;
//# sourceMappingURL=python.js.map