"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const languageProvider_1 = require("./languageProvider");
const vscode = require("vscode");
const EditorContext_1 = require("./EditorContext");
class CellHelper {
    constructor(cellCodeLenses) {
        this.cellCodeLenses = cellCodeLenses;
    }
    getActiveCell() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return Promise.resolve(null);
        }
        return this.cellCodeLenses.provideCodeLenses(activeEditor.document, null).then(lenses => {
            if (lenses.length === 0) {
                return null;
            }
            let currentCellRange;
            let nextCellRange;
            let previousCellRange;
            lenses.forEach((lens, index) => {
                if (lens.range.contains(activeEditor.selection.start)) {
                    currentCellRange = lens.range;
                    if (index < (lenses.length - 1)) {
                        nextCellRange = lenses[index + 1].range;
                    }
                    if (index > 0) {
                        previousCellRange = lenses[index - 1].range;
                    }
                }
            });
            if (!currentCellRange) {
                return null;
            }
            return { cell: currentCellRange, nextCell: nextCellRange, previousCell: previousCellRange };
        });
    }
    goToPreviousCell() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return Promise.resolve();
        }
        return this.getActiveCell().then(cellInfo => {
            if (!cellInfo || !cellInfo.previousCell) {
                return;
            }
            return this.advanceToCell(activeEditor.document, cellInfo.previousCell);
        });
    }
    goToNextCell() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return Promise.resolve();
        }
        return this.getActiveCell().then(cellInfo => {
            if (!cellInfo || !cellInfo.nextCell) {
                return;
            }
            return this.advanceToCell(activeEditor.document, cellInfo.nextCell);
        });
    }
    advanceToCell(document, range) {
        if (!range || !document) {
            return;
        }
        const textEditor = vscode.window.visibleTextEditors.find(editor => editor.document && editor.document.fileName === document.fileName);
        if (!textEditor) {
            return;
        }
        // Remember, we use comments to identify cells
        // Setting the cursor to the comment doesn't make sense
        // Quirk 1: Besides the document highlighter doesn't kick in (event' not fired), when you have placed the cursor on a comment
        // Quirk 2: If the first character starts with a %, then for some reason the highlighter doesn't kick in (event' not fired)
        let firstLineOfCellRange = Promise.resolve(range);
        if (range.start.line < range.end.line) {
            let rangeToSearchIn = new vscode.Range(new vscode.Position(range.start.line + 1, 0), range.end);
            let firstLine = languageProvider_1.LanguageProviders.getFirstLineOfExecutableCode(document.languageId, range, document, rangeToSearchIn);
            firstLineOfCellRange = firstLine.then(line => {
                return document.lineAt(line).range;
            });
        }
        firstLineOfCellRange.then(range => {
            textEditor.selections = [];
            textEditor.selection = new vscode.Selection(range.start, range.start);
            textEditor.revealRange(range);
            vscode.window.showTextDocument(textEditor.document);
        });
    }
    static getCells(document) {
        let language = document.languageId;
        let editorCtx = new EditorContext_1.EditorContextKey('jupyter.document.hasCodeCells');
        let cellIdentifier = languageProvider_1.LanguageProviders.cellIdentifier(language);
        if (!cellIdentifier || !(cellIdentifier instanceof RegExp)) {
            editorCtx.set(false);
            return [];
        }
        const cells = [];
        for (let index = 0; index < document.lineCount; index++) {
            const line = document.lineAt(index);
            // clear regex cache
            cellIdentifier.lastIndex = -1;
            if (cellIdentifier.test(line.text)) {
                const results = cellIdentifier.exec(line.text);
                if (cells.length > 0) {
                    const previousCell = cells[cells.length - 1];
                    previousCell.range = new vscode_1.Range(previousCell.range.start, document.lineAt(index - 1).range.end);
                }
                cells.push({
                    range: line.range,
                    title: results.length > 1 ? results[2].trim() : ''
                });
            }
        }
        if (cells.length >= 1) {
            const line = document.lineAt(document.lineCount - 1);
            const previousCell = cells[cells.length - 1];
            previousCell.range = new vscode_1.Range(previousCell.range.start, line.range.end);
        }
        editorCtx.set(cells.length > 0);
        return cells;
    }
}
exports.CellHelper = CellHelper;
//# sourceMappingURL=cellHelper.js.map