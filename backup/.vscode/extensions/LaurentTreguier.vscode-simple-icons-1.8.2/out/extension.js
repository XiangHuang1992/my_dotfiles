"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode = require("vscode");
const bb = require("bluebird");
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
    jsonFiles.forEach(file => bb.promisify(fs.readFile)(file)
        .then(data => JSON.parse(data.toString()))
        .then(json => {
        let conf = !!vscode.workspace.getConfiguration('simpleIcons').get('hideArrows', false);
        if (json.hidesExplorerArrows === conf) {
            throw new Error('No changes to be made');
        }
        json.hidesExplorerArrows = conf;
        return JSON.stringify(json, null, 4);
    }).then(jsonString => bb.promisify(fs.writeFile)(file, jsonString))
        .then(() => vscode.window.showInformationMessage('The window must be reloaded for changes to take effet', 'Reload'))
        .then(choice => {
        if (choice === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    })
        .catch(err => ({})));
}
//# sourceMappingURL=extension.js.map