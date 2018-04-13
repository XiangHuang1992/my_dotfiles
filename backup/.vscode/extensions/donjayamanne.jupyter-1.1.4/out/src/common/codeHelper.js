"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cellHelper_1 = require("./cellHelper");
class CodeHelper {
    constructor(cellCodeLenses) {
        this.cellCodeLenses = cellCodeLenses;
        this.cellHelper = new cellHelper_1.CellHelper(cellCodeLenses);
    }
    getActiveCell() {
        return new Promise((resolve, reject) => {
            this.cellHelper.getActiveCell().then(info => {
                if (info && info.cell) {
                    resolve(info.cell);
                }
                else {
                    resolve(null);
                }
            }, reason => reject(reason));
        });
    }
    getSelectedCode() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return Promise.resolve('');
        }
        if (activeEditor.selection.isEmpty) {
            return Promise.resolve(activeEditor.document.lineAt(activeEditor.selection.start.line).text);
        }
        else {
            return Promise.resolve(activeEditor.document.getText(activeEditor.selection));
        }
    }
}
exports.CodeHelper = CodeHelper;
//# sourceMappingURL=codeHelper.js.map