"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const provider_1 = require("./provider");
const providers_1 = require("./providers");
const cfamily_1 = require("./providers/cfamily");
function goToDefinition(range) {
    const editor = vscode.window.activeTextEditor;
    // Center the method in the document
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    // Select the method name
    editor.selection = new vscode.Selection(range.start, range.end);
    // Swap the focus to the editor
    vscode.window.showTextDocument(editor.document, editor.viewColumn, false);
}
function activate(context) {
    const providers = [];
    const config = vscode.workspace.getConfiguration("treeview");
    const allowedProviders = config.has("allowedProviders") ?
        config.get("allowedProviders") : [];
    if (allowedProviders.length === 0 || allowedProviders.indexOf("php") !== -1) {
        providers.push(new providers_1.PhpProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("javascript") !== -1) {
        providers.push(new providers_1.TypescriptProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("json") !== -1) {
        providers.push(new providers_1.JsonProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("java") !== -1) {
        providers.push(new providers_1.JavaProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("openhab") !== -1) {
        providers.push(new providers_1.RuleProvider());
        providers.push(new providers_1.ItemsProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("python") !== -1) {
        providers.push(new providers_1.PythonProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("css") !== -1) {
        providers.push(new providers_1.CssProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("less") !== -1) {
        providers.push(new providers_1.LessProvider());
    }
    if (allowedProviders.length === 0 || allowedProviders.indexOf("cfamily") !== -1) {
        providers.push(new cfamily_1.CFamilyProvider());
    }
    const provider = new provider_1.Provider(providers);
    if (vscode.window.activeTextEditor.document !== null) {
        provider.refresh(vscode.window.activeTextEditor.document);
    }
    vscode.window.registerTreeDataProvider("tree-outline", provider);
    vscode.commands.registerCommand("extension.treeview.goto", (range) => goToDefinition(range));
    vscode.commands.registerCommand("extension.treeview.extractInterface", (a) => {
        const conf = vscode.workspace.getConfiguration("treeview");
        provider.getTokenTree().then((tokenTree) => {
            const entities = (tokenTree.classes || []).concat(tokenTree.traits || []);
            if (entities.length === 0) {
                vscode.window.showWarningMessage("No suitable entities found in file");
                return false;
            }
            if (a === undefined) {
                if (entities.length === 1) {
                    entities.map((t) => {
                        provider.generateEntity(t, false, tokenTree.namespace, tokenTree.strict);
                    });
                    return true;
                }
                else {
                    vscode.window.showQuickPick(entities.map((e) => e.name))
                        .then((label) => {
                        label = label
                            .replace(conf.get("readonlyCharacter"), "")
                            .replace(conf.get("abstractCharacter"), "");
                        entities.map((t) => {
                            if (t.name === label) {
                                provider.generateEntity(t, false, tokenTree.namespace, tokenTree.strict);
                            }
                        });
                    });
                }
                return true;
            }
            entities.map((t) => {
                const label = a.label
                    .replace(conf.get("readonlyCharacter"), "")
                    .replace(conf.get("abstractCharacter"), "");
                if (t.name === label) {
                    provider.generateEntity(t, false, tokenTree.namespace, tokenTree.strict);
                }
            });
        });
    });
    vscode.commands.registerCommand("extension.treeview.duplicateEntity", (a) => {
        const conf = vscode.workspace.getConfiguration("treeview");
        provider.getTokenTree().then((tokenTree) => {
            const entities = (tokenTree.classes || []).concat(tokenTree.traits || []);
            if (entities.length === 0) {
                vscode.window.showWarningMessage("No suitable entities found in file");
                return false;
            }
            if (a === undefined) {
                if (entities.length === 1) {
                    entities.map((t) => {
                        provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                    });
                    return true;
                }
                else {
                    vscode.window.showQuickPick(entities.map((e) => e.name))
                        .then((label) => {
                        label = label
                            .replace(conf.get("readonlyCharacter"), "")
                            .replace(conf.get("abstractCharacter"), "");
                        entities.map((t) => {
                            if (t.name === label) {
                                provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                            }
                        });
                    });
                }
                return true;
            }
            entities.map((t) => {
                const label = a.label
                    .replace(conf.get("readonlyCharacter"), "")
                    .replace(conf.get("abstractCharacter"), "");
                if (t.name === label) {
                    provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                }
            });
        });
    });
    vscode.commands.registerCommand("extension.treeview.implementInterface", (a) => {
        provider.getTokenTree().then((tokenTree) => {
            const conf = vscode.workspace.getConfiguration("treeview");
            if (tokenTree.interfaces.length === 0) {
                vscode.window.showWarningMessage("No interfaces found in file");
                return false;
            }
            if (a === undefined) {
                if (tokenTree.interfaces.length === 1) {
                    tokenTree.interfaces.map((t) => {
                        provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                    });
                }
                else {
                    vscode.window.showQuickPick(tokenTree.interfaces.map((e) => e.name))
                        .then((label) => {
                        tokenTree.interfaces.map((t) => {
                            if (t.name === label) {
                                provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                            }
                        });
                    });
                }
                return true;
            }
            tokenTree.interfaces.map((t) => {
                const label = a.label
                    .replace(conf.get("readonlyCharacter"), "")
                    .replace(conf.get("abstractCharacter"), "");
                if (t.name === label) {
                    provider.generateEntity(t, true, tokenTree.namespace, tokenTree.strict);
                }
            });
        });
    });
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map