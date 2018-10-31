"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function findEditorsForDocument(document) {
    return vscode_1.window.visibleTextEditors.filter(p => p.document.uri === document.uri);
}
exports.findEditorsForDocument = findEditorsForDocument;
exports.clearEditorDecorations = (document, decorations) => {
    const editors = findEditorsForDocument(document);
    if (editors) {
        decorations.forEach(decoration => {
            decoration.dispose();
            editors.forEach(editor => editor.setDecorations(decoration, []));
        });
    }
};
//# sourceMappingURL=editorutil.js.map