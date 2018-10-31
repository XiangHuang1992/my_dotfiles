"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function getConfiguredProperty(documentOrEditor, property, fallback) {
    const document = isEditor(documentOrEditor) ? documentOrEditor.document : documentOrEditor;
    const config = vscode.workspace.getConfiguration('gutterpreview', document ? document.uri : undefined);
    return config.get(property.toLowerCase(), config.get(property, fallback));
}
exports.getConfiguredProperty = getConfiguredProperty;
function isEditor(documentOrEditor) {
    return documentOrEditor.document != null;
}
//# sourceMappingURL=configuration.js.map