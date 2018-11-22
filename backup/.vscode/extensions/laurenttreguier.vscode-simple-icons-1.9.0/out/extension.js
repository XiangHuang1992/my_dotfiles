"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode = require("vscode");
function activate(context) {
    vscode.workspace.onDidChangeConfiguration(() => toggleArrows(context));
    toggleArrows(context);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function toggleArrows(context) {
    const jsonFiles = ['simple', 'minimalistic']
        .map(name => context.asAbsolutePath(name + '-icons.json'));
    Promise.all(jsonFiles.map(file => new Promise(resolve => fs.readFile(file, (err, data) => resolve(data)))
        .then(data => JSON.parse(data.toString()))
        .then(json => {
        let conf = !!vscode.workspace.getConfiguration('simpleIcons').get('hideArrows', false);
        if (json.hidesExplorerArrows === conf) {
            return null;
        }
        json.hidesExplorerArrows = conf;
        return JSON.stringify(json, null, 4);
    })
        .then(jsonString => {
        if (jsonString) {
            new Promise(resolve => fs.writeFile(file, jsonString, resolve));
        }
        return !!jsonString;
    })))
        .then((results) => {
        if (results.indexOf(true) !== -1) {
            return vscode.window.showInformationMessage('The window must be reloaded for changes to take effet', 'Reload');
        }
    })
        .then(choice => {
        if (choice) {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    });
}
//# sourceMappingURL=extension.js.map