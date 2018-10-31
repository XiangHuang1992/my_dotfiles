"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const tokens_1 = require("./tokens");
class Provider {
    constructor(langProviders) {
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.langProviders = langProviders;
        vscode.window.onDidChangeActiveTextEditor((ev) => {
            if ((ev && ev.document) || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document)) {
                this.refresh((ev || vscode.window.activeTextEditor).document);
            }
        });
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (!this.updateOnError && this.hasErrorsInDiagnostic(document)) {
                return void 0;
            }
            this.refresh(document);
        });
        vscode.window.onDidChangeVisibleTextEditors((ev) => {
            if (ev.length > 0 && ev[0].document) {
                this.refresh(ev[0].document);
            }
        });
    }
    static addItemCommand(item, commandName, args) {
        item.command = {
            arguments: args,
            command: commandName,
            title: "",
        };
        return item;
    }
    static addItemIcon(node, key, visibility = "public") {
        const aliases = {
            function: "method",
            variable: "property",
        };
        if (aliases[key] !== undefined) {
            key = aliases[key];
        }
        const icons = {
            class: {
                private: vscode.Uri.file(__dirname + "/../assets/ic_class_private_24px.svg"),
                protected: vscode.Uri.file(__dirname + "/../assets/ic_class_private_24px.svg"),
                public: vscode.Uri.file(__dirname + "/../assets/ic_class_public_24px.svg"),
            },
            constant: {
                private: vscode.Uri.file(__dirname + "/../assets/ic_constant_private_24px.svg"),
                protected: vscode.Uri.file(__dirname + "/../assets/ic_constant_protected_24px.svg"),
                public: vscode.Uri.file(__dirname + "/../assets/ic_constant_public_24px.svg"),
            },
            interface: {
                private: vscode.Uri.file(__dirname + "/../assets/ic_interface_private_24px.svg"),
                protected: vscode.Uri.file(__dirname + "/../assets/ic_interface_protected_24px.svg"),
                public: vscode.Uri.file(__dirname + "/../assets/ic_interface_public_24px.svg"),
            },
            list: {
                public: vscode.Uri.file(__dirname + "/../assets/ic_list_24px.svg"),
            },
            method: {
                private: vscode.Uri.file(__dirname + "/../assets/ic_method_private_24px.svg"),
                private_static: vscode.Uri.file(__dirname + "/../assets/ic_static_method_private_24px.svg"),
                protected: vscode.Uri.file(__dirname + "/../assets/ic_method_protected_24px.svg"),
                protected_static: vscode.Uri.file(__dirname + "/../assets/ic_static_method_protected_24px.svg"),
                public: vscode.Uri.file(__dirname + "/../assets/ic_method_public_24px.svg"),
                public_static: vscode.Uri.file(__dirname + "/../assets/ic_static_method_public_24px.svg"),
            },
            property: {
                private: vscode.Uri.file(__dirname + "/../assets/ic_property_private_24px.svg"),
                private_static: vscode.Uri.file(__dirname + "/../assets/ic_static_property_private_24px.svg"),
                protected: vscode.Uri.file(__dirname + "/../assets/ic_property_protected_24px.svg"),
                protected_static: vscode.Uri.file(__dirname + "/../assets/ic_static_property_protected_24px.svg"),
                public: vscode.Uri.file(__dirname + "/../assets/ic_property_public_24px.svg"),
                public_static: vscode.Uri.file(__dirname + "/../assets/ic_static_property_public_24px.svg"),
            },
            trait: {
                public: vscode.Uri.file(__dirname + "/../assets/ic_trait_public_24px.svg"),
            },
            use: {
                public: vscode.Uri.file(__dirname + "/../assets/ic_trait_24px.svg"),
            },
        };
        if (icons[key] !== undefined) {
            node.iconPath = icons[key][visibility];
        }
        return node;
    }
    static sort(a, b) {
        let vis = 0;
        if (a.visibility && b.visibility && a.visibility !== b.visibility) {
            vis = a.visibility.localeCompare(b.visibility);
        }
        if (vis === 0 && (a.static || b.static) && !(a.static && b.static)) {
            vis = b.static && !a.static ? 1 : -1;
        }
        return vis === 0 ? a.name.localeCompare(b.name) : vis;
    }
    get roChar() {
        return vscode.workspace.getConfiguration("treeview")
            .get("readonlyCharacter");
    }
    get absChar() {
        return vscode.workspace.getConfiguration("treeview")
            .get("abstractCharacter");
    }
    get updateOnError() {
        return vscode.workspace.getConfiguration("treeview")
            .get("updateOnError");
    }
    hasSupport(languageId) {
        for (const provider of this.langProviders) {
            if (provider.hasSupport(languageId)) {
                return true;
            }
        }
        return false;
    }
    getTokenTree() {
        if (vscode.window.activeTextEditor.document !== undefined) {
            const document = vscode.window.activeTextEditor.document;
            if (this.hasSupport(document.languageId)) {
                const provider = this.getProvider(document);
                provider.refresh(document);
                return provider.getTokenTree();
            }
        }
        return Promise.resolve({});
    }
    refresh(document) {
        if (!document.isClosed && !document.isDirty) {
            try {
                this.getProvider(document).refresh(document);
            }
            catch (ex) {
                // console.log(ex);
            }
        }
        this.onDidChangeTreeDataEmitter.fire(void 0);
    }
    getTreeItem(element) {
        try {
            if (element !== undefined && vscode.window.activeTextEditor.document !== undefined) {
                if (element.position !== undefined) {
                    element = Provider.addItemCommand(element, "extension.treeview.goto", [element.position]);
                }
                if (element.contextValue !== undefined && element.contextValue.indexOf("section") === -1) {
                    element = Provider.addItemIcon(element, element.contextValue, element.visibility || "public");
                }
                return this.getProvider(vscode.window.activeTextEditor.document)
                    .getTreeItem(element);
            }
        }
        catch (ex) {
            return Promise.resolve(element);
        }
        return Promise.resolve({});
    }
    getChildren(element) {
        try {
            if (vscode.window.activeTextEditor.document !== undefined) {
                const provider = this.getProvider(vscode.window.activeTextEditor.document);
                return provider.getTokenTree().then((tree) => {
                    if (Object.keys(tree).length !== 0) {
                        const items = this.getBaseChildren(tree, element);
                        const providerItems = provider.getChildren(element);
                        return providerItems.then((x) => {
                            return items.concat(x).filter((y) => {
                                return items.indexOf(y) === items.lastIndexOf(y);
                            });
                        });
                    }
                    return provider.getChildren(element);
                });
            }
        }
        catch (ex) {
            vscode.window.showErrorMessage(ex);
            return Promise.resolve([]);
        }
    }
    generateEntity(node, includeBody = false, ns = "", strict = false) {
        const provider = this.getProvider(vscode.window.activeTextEditor.document);
        if (vscode.workspace.workspaceFolders.length === 0) {
            throw new Error("Not available outside of workspace");
        }
        vscode.window.showInputBox({
            prompt: "Name of the entity to generate(if namespaced use `EntityName : Namespace` notation)",
            value: node.name,
        }).then((entityName) => {
            if (entityName === undefined) {
                vscode.window.showInformationMessage("Entity creation canceled");
                return false;
            }
            if (entityName.indexOf(":") !== -1) {
                const dotSplit = entityName.split(":", 2);
                entityName = dotSplit[0].trim();
                ns = dotSplit[1].trim();
            }
            if (entityName === undefined || entityName.trim() === "") {
                vscode.window.showWarningMessage("Class name cannot be empty");
                return false;
            }
            vscode.window.showInputBox({
                placeHolder: "Directory in which to save the generated file (relative to the workspace root)",
            }).then((locationInput) => {
                const cwd = vscode.workspace.workspaceFolders[0].uri.path;
                provider.getDocumentName(entityName, includeBody).then((documentName) => {
                    const location = vscode.Uri.file(`${cwd}/${locationInput}/${documentName}`);
                    fs.open(location.fsPath, "wx", (err, fd) => {
                        if (err !== null) {
                            vscode.window.showErrorMessage(`File "${location.fsPath}" already exists. ${err.message}`);
                            return void 0;
                        }
                        fs.closeSync(fd);
                        const workspaceEdits = new vscode.WorkspaceEdit();
                        workspaceEdits.set(location, provider.generate(entityName, node, includeBody, {
                            ext: path.extname(documentName),
                            ns,
                            strict,
                        }));
                        vscode.workspace.applyEdit(workspaceEdits);
                        vscode.workspace.openTextDocument(location)
                            .then((document) => {
                            document.save().then((saved) => {
                                const loc = location.fsPath.substr(cwd.length).replace(/\\/, "/");
                                if (saved) {
                                    vscode.window.showInformationMessage(`Successfully created "${loc}"`);
                                }
                                else {
                                    vscode.window.showErrorMessage(`Unable to save "${loc}".`);
                                }
                            });
                        });
                    });
                }, (err) => {
                    vscode.window.showWarningMessage(err);
                });
            });
        });
    }
    getProvider(document) {
        if (!document.isClosed) {
            for (const provider of this.langProviders) {
                if (provider.hasSupport(document.languageId)) {
                    return provider;
                }
            }
        }
        throw new Error(`No provider available to handle "${document.languageId}"`);
    }
    getBaseChildren(tree, element) {
        let items = [];
        if (element === undefined) {
            items.push(new vscode.TreeItem(`Strict: ${tree.strict !== undefined && tree.strict ? "Yes" : "No"}`));
            if (tree.imports !== undefined) {
                items.push(new tokens_1.SectionItem(`Imports`, vscode.TreeItemCollapsibleState.Collapsed, "import-section"));
            }
            if (tree.variables !== undefined) {
                items.push(new tokens_1.SectionItem(`Variables`, vscode.TreeItemCollapsibleState.Collapsed, "variables-section"));
            }
            if (tree.functions !== undefined) {
                items.push(new tokens_1.SectionItem(`Functions`, vscode.TreeItemCollapsibleState.Expanded, "functions-section"));
            }
            if (tree.interfaces !== undefined) {
                for (const cls of tree.interfaces) {
                    const collapsed = tree.interfaces.indexOf(cls) === 0 ?
                        vscode.TreeItemCollapsibleState.Expanded :
                        vscode.TreeItemCollapsibleState.Collapsed;
                    items.push(new tokens_1.InterfaceItem(cls.name, collapsed, undefined, cls.position, cls.visibility));
                }
            }
            if (tree.traits !== undefined) {
                for (const cls of tree.traits) {
                    const collapsed = tree.traits.indexOf(cls) === 0 ?
                        vscode.TreeItemCollapsibleState.Expanded :
                        vscode.TreeItemCollapsibleState.Collapsed;
                    items.push(new tokens_1.TraitItem(cls.name, collapsed, undefined, cls.position, cls.visibility));
                }
            }
            if (tree.classes !== undefined) {
                for (const cls of tree.classes) {
                    const collapsed = tree.classes.indexOf(cls) === 0 ?
                        vscode.TreeItemCollapsibleState.Expanded :
                        vscode.TreeItemCollapsibleState.Collapsed;
                    items.push(new tokens_1.ClassItem((cls.readonly ? this.roChar : (cls.abstract ? this.absChar : "")) + cls.name, collapsed, undefined, cls.position, `${cls.visibility || "public"}`));
                }
            }
        }
        else {
            if (element.contextValue === "import-section") {
                for (const imp of tree.imports.sort(Provider.sort)) {
                    const t = new tokens_1.ImportItem(`${imp.name}${imp.alias !== undefined && imp.alias !== null ? ` as ${imp.alias}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, imp.position);
                    items.push(t);
                }
            }
            if (element.contextValue === "variables-section") {
                for (const variable of tree.variables.sort(Provider.sort)) {
                    const vName = `${variable.name}` +
                        `${variable.type !== undefined ? `: ${variable.type}` : ""}` +
                        `${variable.value !== undefined ? ` = ${variable.value}` : ""}`;
                    items.push(new tokens_1.VariableItem(vName, vscode.TreeItemCollapsibleState.None, undefined, variable.position, `${variable.visibility}_static`));
                }
            }
            if (element.contextValue === "functions-section") {
                for (const func of tree.functions.sort(Provider.sort)) {
                    const args = [];
                    for (const arg of func.arguments) {
                        args.push(`${arg.type !== undefined ? `${arg.type} ` : ""}` +
                            `${arg.name}${(arg.value !== "" ? ` = ${arg.value}` : "")}`);
                    }
                    items.push(new tokens_1.FunctionItem(`${func.name}(${args.join(", ")})` +
                        `${func.type !== undefined ? `: ${func.type}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, func.position, `${func.visibility}_static`));
                }
            }
            if (element.contextValue === "interface") {
                const cls = tree.interfaces.find((t) => t.name === element.label);
                items = items.concat(this.handleInterface(cls));
            }
            if (element.contextValue === "trait") {
                const cls = tree.traits.find((t) => t.name === element.label);
                items = items.concat(this.handleTrait(cls));
            }
            if (element.contextValue === "class") {
                const cls = tree.classes.find((t) => t.name === element.label
                    .replace(this.roChar, "")
                    .replace(this.absChar, ""));
                items = items.concat(this.handleClass(cls));
            }
        }
        return items;
    }
    handleInterface(cls) {
        const items = [];
        if (cls.constants !== undefined) {
            for (const constant of cls.constants.sort(Provider.sort)) {
                const valueType = constant.type !== undefined ? `: ${constant.type}` : "";
                const t = new tokens_1.ConstantItem(`${constant.name}${valueType} = ${constant.value}`, vscode.TreeItemCollapsibleState.None, undefined, constant.position, constant.visibility);
                items.push(t);
            }
        }
        if (cls.properties !== undefined) {
            for (const property of cls.properties.sort(Provider.sort)) {
                const t = new tokens_1.PropertyItem(`${property.name}: ${property.type}` +
                    `${property.value !== "" ? ` = ${property.value}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, property.position, `${property.visibility}${property.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        if (cls.methods !== undefined) {
            for (const method of cls.methods.sort(Provider.sort)) {
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.type !== undefined ? `${arg.type} ` : ""}${arg.name}` +
                        `${(arg.value !== "" ? ` = ${arg.value}` : "")}`);
                }
                const t = new tokens_1.MethodItem(`${method.name}(${args.join(", ")})` +
                    `${method.type !== undefined ? `: ${method.type}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, method.position, `${method.visibility || "public"}${method.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        return items;
    }
    handleTrait(cls) {
        const items = [];
        if (cls.constants !== undefined) {
            for (const constant of cls.constants.sort(Provider.sort)) {
                const valueType = constant.type !== undefined ? `: ${constant.type}` : "";
                const t = new tokens_1.ConstantItem(`${constant.name}${valueType} = ${constant.value}`, vscode.TreeItemCollapsibleState.None, undefined, constant.position, constant.visibility);
                items.push(t);
            }
        }
        if (cls.properties !== undefined) {
            for (const property of cls.properties.sort(Provider.sort)) {
                const t = new tokens_1.PropertyItem(`${property.name}: ${property.type}` +
                    `${property.value !== "" ? ` = ${property.value}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, property.position, `${property.visibility}${property.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        if (cls.methods !== undefined) {
            for (const method of cls.methods.sort(Provider.sort)) {
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.type !== undefined ? `${arg.type} ` : ""}${arg.name}` +
                        `${(arg.value !== "" ? ` = ${arg.value}` : "")}`);
                }
                const t = new tokens_1.MethodItem((method.readonly ? this.roChar : "") +
                    `${method.name}(${args.join(", ")})` +
                    `${method.type !== undefined ? `: ${method.type}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, method.position, `${method.visibility || "public"}${method.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        return items;
    }
    handleClass(cls) {
        const items = [];
        if (cls.constants !== undefined) {
            for (const constant of cls.constants.sort(Provider.sort)) {
                const valueType = constant.type !== undefined ? `: ${constant.type}` : "";
                const t = new tokens_1.ConstantItem(`${constant.name}${valueType} = ${constant.value}`, vscode.TreeItemCollapsibleState.None, undefined, constant.position, constant.visibility);
                items.push(t);
            }
        }
        if (cls.properties !== undefined) {
            for (const property of cls.properties.sort(Provider.sort)) {
                const t = new tokens_1.PropertyItem((property.readonly ? this.roChar : "") +
                    `${property.name}: ${property.type}` +
                    `${property.value !== "" ? ` = ${property.value}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, property.position, `${property.visibility}${property.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        if (cls.traits !== undefined) {
            for (const trait of cls.traits.sort(Provider.sort)) {
                const t = new tokens_1.TraitItem(`${trait.name}`, vscode.TreeItemCollapsibleState.None, "use", trait.position, "public");
                items.push(t);
            }
        }
        if (cls.methods !== undefined) {
            for (const method of cls.methods.sort(Provider.sort)) {
                const args = [];
                for (const arg of method.arguments) {
                    args.push(`${arg.type !== undefined ? `${arg.type} ` : ""}${arg.name}` +
                        `${(arg.value !== "" ? ` = ${arg.value}` : "")}`);
                }
                const t = new tokens_1.MethodItem((method.readonly ? this.roChar : (method.abstract ? this.absChar : "")) +
                    `${method.name}(${args.join(", ")})` +
                    `${method.type !== undefined ? `: ${method.type}` : ""}`, vscode.TreeItemCollapsibleState.None, undefined, method.position, `${method.visibility || "public"}${method.static ? "_static" : ""}`);
                items.push(t);
            }
        }
        return items;
    }
    hasErrorsInDiagnostic(document) {
        const halt = vscode.languages.getDiagnostics().find((x) => {
            if (x[0].fsPath === document.uri.fsPath) {
                const diag = x[1].find((y) => {
                    if (y.severity === vscode.DiagnosticSeverity.Error) {
                        return true;
                    }
                });
                return (diag !== undefined);
            }
            return false;
        });
        return halt !== undefined;
    }
}
exports.Provider = Provider;
//# sourceMappingURL=provider.js.map