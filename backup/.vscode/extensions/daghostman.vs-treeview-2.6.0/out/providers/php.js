"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const vscode = require("vscode");
class PhpProvider {
    constructor() {
        this.tree = {};
        this.tokens = [
            "declare",
            "namespace",
            "class",
            "interface",
            "trait",
            "usegroup",
            "function",
            "variable",
            "assign",
        ];
    }
    hasSupport(language) { return language.toLowerCase() === "php"; }
    refresh(document) {
        this.config = vscode.workspace.getConfiguration("treeview.php");
        this.tree = {};
        if (document !== undefined) {
            this.tree = this.walk(require("php-parser").create({ ast: { withPositions: true } })
                .parseCode(document.getText()).children);
        }
    }
    getTokenTree() {
        return Promise.resolve(this.tree);
    }
    getTreeItem(element) { return element; }
    getChildren(element) {
        return Promise.resolve([]);
    }
    getDocumentName(entityName, includeBodies = false) {
        let name = entityName;
        if (name.indexOf("\\") !== -1) {
            const nsSplit = name.split("\\");
            name = nsSplit.pop();
        }
        return Promise.resolve((name + (includeBodies ? "" : "Interface")) + ".php");
    }
    generate(entityName, skeleton, includeBodies, options = {}) {
        if (entityName.indexOf("\\") !== -1) {
            const nsSplit = entityName.split("\\");
            entityName = nsSplit.pop();
            options.ns = nsSplit.join("\\");
        }
        const edits = [
            new vscode.TextEdit(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 5)), "<?php" + os.EOL),
        ];
        if (options.strict !== undefined && options.strict === true) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 25)), "declare(strict_types=1);" + os.EOL));
        }
        if (options.ns !== undefined) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), `namespace ${options.ns};` + os.EOL + os.EOL));
        }
        if (includeBodies && skeleton.name.indexOf(":")) {
            edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), `use ${skeleton.name.split(":").reverse().join("\\").trim()};` + os.EOL + os.EOL));
        }
        const defLine = (!includeBodies ?
            "interface" : (skeleton.readonly
            ? "final " : (skeleton.abstract ? "abstract " : "")) + "class") +
            ` ${entityName}` + os.EOL;
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), defLine));
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1024)), "{" + os.EOL));
        if (skeleton.constants !== undefined) {
            const constants = skeleton.constants.filter((c) => c.visibility === "public");
            for (const constant of constants) {
                const line = `    ` +
                    `${constant.visibility !== "public" ? `${constant.visibility} ` : ""}const ${constant.name}` +
                    `${constant.value !== undefined ? ` = ${constant.value}` : ""};`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, line.length)), line + os.EOL));
                if (constants.indexOf(constant) === constants.length - 1 &&
                    skeleton.methods.length !== 0) {
                    const constantPosition = skeleton.constants.indexOf(constant);
                    edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length, 0), new vscode.Position(edits.length, 1)), os.EOL));
                }
            }
        }
        if (skeleton.methods !== undefined) {
            const methods = skeleton.methods.filter((m) => m.visibility === "public" && m.name.search(/^__/i) === -1);
            for (const method of methods) {
                if (!includeBodies && method.static) {
                    continue;
                }
                let body = ";";
                if (includeBodies) {
                    body = `${os.EOL}    {${os.EOL}` +
                        `        throw new \\BadMethodCallException(\"\${__METHOD__} Not implemented\");`
                        + `${os.EOL}    }` + (methods.indexOf(method) === methods.length - 1 ? "" : os.EOL);
                }
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.type !== "mixed" ? `${arg.type} ` : ""}` +
                        `${arg.name}${arg.value !== "" ? ` = ${arg.value}` : ""}`);
                }
                const returnType = method.type !== undefined && method.type !== "mixed" ?
                    method.type : "";
                const line = `    public ` + (includeBodies ? (method.abstract ? "abstract " : (method.readonly ? "final " : "")) : "") +
                    `${!method.abstract && method.static ? "static " : ""}` +
                    `function ${method.name}(${args.join(", ")})` +
                    `${returnType !== "" ? `: ${returnType}` : ""}${body}`;
                edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 4 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 4 : 0), line.length)), line + os.EOL));
            }
        }
        edits.push(new vscode.TextEdit(new vscode.Range(new vscode.Position(edits.length + (includeBodies ? 4 : 0), 0), new vscode.Position(edits.length + (includeBodies ? 4 : 0), 1024)), "}" + os.EOL));
        return edits;
    }
    walk(ast, parentNode) {
        let tree = (parentNode === undefined ? {} : parentNode);
        if (ast.length === 0) {
            return tree;
        }
        for (const node of ast) {
            if (this.tokens.indexOf(node.kind) === -1) {
                continue;
            }
            switch (node.kind) {
                case "interface":
                    if (tree.interfaces === undefined) {
                        tree.interfaces = [];
                    }
                    const interfaceEntity = {};
                    interfaceEntity.name = (tree.namespace !== undefined ? `${tree.namespace}\\` : "") + `${node.name}`;
                    if (this.config.has("namespacePosition")) {
                        if (this.config.get("namespacePosition") === "suffix") {
                            interfaceEntity.name =
                                `${node.name}${tree.namespace !== undefined ? `: ${tree.namespace}` : ""}`;
                        }
                        if (this.config.get("namespacePosition") === "none") {
                            interfaceEntity.name = `${node.name}`;
                        }
                    }
                    interfaceEntity.constants = this.handleConstants(node.body.filter((x) => x.kind === "classconstant"));
                    interfaceEntity.methods = this.handleMethods(node.body.filter((x) => x.kind === "method"));
                    tree.interfaces.push(interfaceEntity);
                    break;
                case "class":
                    if (tree.classes === undefined) {
                        tree.classes = [];
                    }
                    const classEntity = {};
                    classEntity.name = (tree.namespace !== undefined ? `${tree.namespace}\\` : "") + `${node.name}`;
                    classEntity.readonly = node.isFinal || false;
                    classEntity.abstract = node.isAbstract || false;
                    if (this.config.has("namespacePosition")) {
                        if (this.config.get("namespacePosition") === "suffix") {
                            classEntity.name =
                                `${node.name}${tree.namespace !== undefined ? `: ${tree.namespace}` : ""}`;
                        }
                        if (this.config.get("namespacePosition") === "none") {
                            classEntity.name = `${node.name}`;
                        }
                    }
                    classEntity.traits = this.handleUseTraits(node.body.filter((x) => x.kind === "traituse"));
                    classEntity.constants = this.handleConstants(node.body.filter((x) => x.kind === "classconstant"));
                    classEntity.properties = this.handleProperties(node.body.filter((x) => x.kind === "property"));
                    classEntity.methods = this.handleMethods(node.body.filter((x) => x.kind === "method"));
                    tree.classes.push(classEntity);
                    break;
                case "trait":
                    if (tree.traits === undefined) {
                        tree.traits = [];
                    }
                    const traitEntity = {};
                    traitEntity.name = (tree.namespace !== undefined ? `${tree.namespace}\\` : "") + `${node.name}`;
                    if (this.config.has("namespacePosition")) {
                        if (this.config.get("namespacePosition") === "suffix") {
                            traitEntity.name =
                                `${node.name}${tree.namespace !== undefined ? `: ${tree.namespace}` : ""}`;
                        }
                        if (this.config.get("namespacePosition") === "none") {
                            traitEntity.name = `${node.name}`;
                        }
                    }
                    traitEntity.traits = this.handleUseTraits(node.body.filter((x) => x.kind === "traituse"));
                    traitEntity.constants = this.handleConstants(node.body.filter((x) => x.kind === "classconstant"));
                    traitEntity.properties = this.handleProperties(node.body.filter((x) => x.kind === "property"));
                    traitEntity.methods = this.handleMethods(node.body.filter((x) => x.kind === "method"));
                    tree.traits.push(traitEntity);
                    break;
                case "namespace":
                    tree.namespace = node.kind === "namespace" ? node.name : "\\";
                    tree = this.walk(node.children, tree);
                    break;
                case "declare":
                    const strict = node.what.strict_types;
                    tree.strict = (strict !== undefined ? (strict.value === "1" ? true : false) : false);
                    tree = this.walk(node.children, tree);
                    break;
                case "usegroup":
                    if (tree.imports === undefined) {
                        tree.imports = [];
                    }
                    const imp = {
                        alias: node.items[0].alias,
                        name: node.items[0].name,
                        position: new vscode.Range(new vscode.Position(node.loc.start.line - 1, node.loc.start.column), new vscode.Position(node.loc.end.line - 1, node.loc.end.column)),
                    };
                    tree.imports.push(imp);
                    break;
                case "function":
                    if (tree.functions === undefined) {
                        tree.functions = [];
                    }
                    let ty = node.type === null ? "mixed" : node.type.name;
                    if (ty.substr(0, 1) === "\\") {
                        ty = ty.substr(1);
                    }
                    const func = {
                        arguments: this.handleArguments(node.arguments),
                        name: node.name,
                        position: new vscode.Range(new vscode.Position(node.loc.start.line - 1, node.loc.start.column + 9), new vscode.Position(node.loc.start.line - 1, node.loc.end.column + 8 + node.name.length)),
                        static: true,
                        type: ty,
                        visibility: "public",
                    };
                    tree.functions.push(func);
                    break;
                case "assign":
                case "variable":
                    if (tree.variables === undefined) {
                        tree.variables = [];
                    }
                    const val = node.right !== undefined ?
                        (node.right.value === undefined ? (node.right.name || node.right) : node.right) : "null";
                    if (node.left && node.left.kind === "offsetlookup") {
                        continue;
                    }
                    const v = node.left !== undefined ? node.left : node;
                    tree.variables.push({
                        name: v.name,
                        position: new vscode.Range(new vscode.Position(v.loc.start.line - 1, v.loc.start.column), new vscode.Position(v.loc.end.line - 1, v.loc.end.column)),
                        type: this.getUntypedType(val),
                        value: this.normalizeType(val),
                        visibility: "public",
                    });
                    break;
            }
        }
        return tree;
    }
    normalizeType(value) {
        if (value == null) {
            return "";
        }
        let val;
        switch (value.kind) {
            case "array":
                const arr = [];
                for (const x of value.items) {
                    if (value.items.indexOf(x) === 2) {
                        arr.push("..");
                        break;
                    }
                    if (x.value.items !== undefined) {
                        x.value.value = "[..]";
                    }
                    if (x.key === null) {
                        arr.push(x.value.value);
                    }
                    else {
                        arr.push(`${x.key.value}: ${x.value.value}`);
                    }
                }
                val = `[${arr.join(", ")}]`;
                break;
            case "string":
                val = `"${value.value}"`;
                break;
            case "constref":
                val = value.name.name;
                break;
            case "number":
                val = value.value;
                break;
            case "staticlookup":
                let qn = value.what.name;
                if (this.tree.imports !== undefined) {
                    const filteredImports = this.tree.imports.filter((i) => i.name === qn);
                    if (filteredImports.length > 0) {
                        qn = qn.split("\\").pop();
                    }
                }
                val = `${qn}::${value.offset.name}`;
                break;
            case "new":
                val = `new ${value.what.name}`;
                break;
            case "bin":
                const left = this.normalizeType(value.left);
                const right = this.normalizeType(value.right);
                val = `${left} ${value.type} ${right}`;
                break;
            default:
                val = value.value;
                break;
        }
        return val;
    }
    getUntypedType(value) {
        if (!(value instanceof Object) || value == null) {
            return "mixed";
        }
        let val = "mixed";
        switch (value.kind) {
            case "array":
                val = "array";
                break;
            case "string":
                val = "string";
                break;
            case "number":
                val = "int";
                break;
            case "float":
                val = "float";
                break;
            case "boolean":
                val = "boolean";
                break;
            case "bin":
                switch (value.type) {
                    case ".":
                        val = "string";
                        break;
                    case "**":
                    case "|":
                    case ">>":
                    case "<<":
                    case "&":
                    case "^":
                    case "+":
                    case "-":
                    case "/":
                    case "*":
                        val = "int";
                        break;
                    default:
                        val = "mixed";
                        break;
                }
                break;
            case "new":
                val = value.what.name;
                break;
            case "magic":
                switch (value.value) {
                    case "__LINE__":
                        val = "int";
                        break;
                    default:
                        val = "string";
                        break;
                }
                break;
        }
        return val;
    }
    handleUseTraits(children) {
        const traits = [];
        for (const trait of children) {
            for (const i in trait.traits) {
                if (trait.traits[i] === undefined) {
                    continue;
                }
                traits.push({
                    name: trait.traits[i].name,
                    position: new vscode.Range(new vscode.Position(trait.loc.start.line - 1, trait.loc.start.column), new vscode.Position(trait.loc.end.line - 1, trait.loc.end.column - 1)),
                });
            }
        }
        return traits;
    }
    handleConstants(children) {
        const constants = [];
        for (const constant of children) {
            constants.push({
                name: constant.name,
                position: new vscode.Range(new vscode.Position(constant.loc.start.line - 1, constant.loc.start.column), new vscode.Position(constant.loc.end.line - 1, constant.loc.start.column + constant.name.length)),
                type: this.getUntypedType(constant.value),
                value: this.normalizeType(constant.value),
                visibility: constant.visibility === undefined ? "public" : constant.visibility,
            });
        }
        return constants;
    }
    handleProperties(children) {
        const properties = [];
        for (const property of children) {
            properties.push({
                name: property.name,
                position: new vscode.Range(new vscode.Position(property.loc.start.line - 1, property.loc.start.column), new vscode.Position(property.loc.end.line - 1, property.loc.start.column + property.name.length + 1)),
                static: property.isStatic,
                type: "mixed",
                value: this.normalizeType(property.value),
                visibility: property.visibility === undefined ? "public" : property.visibility,
            });
        }
        return properties;
    }
    handleMethods(children) {
        const methods = [];
        for (const method of children) {
            let ty = method.type === null ? "mixed" : method.type.name;
            if (ty.substr(0, 1) === "\\") {
                ty = ty.substr(1);
            }
            methods.push({
                abstract: method.isAbstract,
                arguments: this.handleArguments(method.arguments),
                name: (method.byref ? "&" : "") + method.name,
                position: new vscode.Range(new vscode.Position(method.loc.start.line - 1, method.loc.start.column + 9), new vscode.Position(method.loc.start.line - 1, method.loc.start.column + 9 + method.name.length)),
                readonly: method.isFinal,
                static: method.isStatic,
                type: ["__construct", "__destruct"].indexOf(method.name) === -1 ?
                    (method.nullable ? "?" : "") + ty : undefined,
                visibility: method.visibility,
            });
        }
        return methods;
    }
    handleArguments(children) {
        const variables = [];
        for (const variable of children) {
            let ty = variable.type === null ? "mixed" : variable.type.name;
            if (ty.substr(0, 1) === "\\") {
                ty = ty.substr(1);
            }
            variables.push({
                name: (variable.byref ? "&" : "") +
                    (variable.variadic ? "..." : "") +
                    `$${variable.name}`,
                position: new vscode.Range(new vscode.Position(variable.loc.start.line - 1, variable.loc.start.column), new vscode.Position(variable.loc.end.line - 1, variable.loc.start.column + variable.name.length)),
                type: (variable.nullable ? "?" : "") + ty,
                value: (variable.value === undefined ? "" : this.normalizeType(variable.value)),
                visibility: variable.visibility === undefined ? "public" : variable.visibility,
            });
        }
        return variables;
    }
}
exports.PhpProvider = PhpProvider;
//# sourceMappingURL=php.js.map