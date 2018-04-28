'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const prefix = 'markdown.extension.editing.';
function activate(context) {
    const cmds = [
        { command: 'toggleBold', callback: toggleBold },
        { command: 'toggleItalic', callback: toggleItalic },
        { command: 'toggleCodeSpan', callback: toggleCodeSpan },
        { command: 'toggleStrikethrough', callback: toggleStrikethrough },
        { command: 'toggleHeadingUp', callback: toggleHeadingUp },
        { command: 'toggleHeadingDown', callback: toggleHeadingDown }
    ].map(cmd => {
        cmd.command = prefix + cmd.command;
        return cmd;
    });
    cmds.forEach(cmd => {
        context.subscriptions.push(vscode_1.commands.registerCommand(cmd.command, cmd.callback));
    });
}
exports.activate = activate;
// Return Promise because need to chain operations in unit tests
function toggleBold() {
    return styleByWrapping('**');
}
function toggleItalic() {
    let indicator = vscode_1.workspace.getConfiguration('markdown.extension.italic').get('indicator');
    return styleByWrapping(indicator);
}
function toggleCodeSpan() {
    return styleByWrapping('`');
}
function toggleStrikethrough() {
    return styleByWrapping('~~');
}
function toggleHeadingUp() {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode_1.window.activeTextEditor;
        let lineIndex = editor.selection.active.line;
        let lineText = editor.document.lineAt(lineIndex).text;
        return yield editor.edit((editBuilder) => {
            if (!lineText.startsWith('#')) {
                editBuilder.insert(new vscode_1.Position(lineIndex, 0), '# ');
            }
            else if (!lineText.startsWith('######')) {
                editBuilder.insert(new vscode_1.Position(lineIndex, 0), '#');
            }
        });
    });
}
function toggleHeadingDown() {
    let editor = vscode_1.window.activeTextEditor;
    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;
    editor.edit((editBuilder) => {
        if (lineText.startsWith('# ')) {
            editBuilder.delete(new vscode_1.Range(new vscode_1.Position(lineIndex, 0), new vscode_1.Position(lineIndex, 2)));
        }
        else if (lineText.startsWith('#')) {
            editBuilder.delete(new vscode_1.Range(new vscode_1.Position(lineIndex, 0), new vscode_1.Position(lineIndex, 1)));
        }
    });
}
function styleByWrapping(startPattern, endPattern) {
    return __awaiter(this, void 0, void 0, function* () {
        if (endPattern == undefined) {
            endPattern = startPattern;
        }
        let editor = vscode_1.window.activeTextEditor;
        let selections = editor.selections;
        for (let i = 0; i < selections.length; i++) {
            var selection = editor.selections[i]; // 💩 get the latest selection range
            let cursorPos = selection.active;
            let options = {
                undoStopBefore: false,
                undoStopAfter: false
            };
            if (i === 0) {
                options.undoStopBefore = true;
            }
            else if (i === selections.length - 1) {
                options.undoStopAfter = true;
            }
            if (selection.isEmpty) {
                // Quick styling
                if (vscode_1.workspace.getConfiguration('markdown.extension').get('quickStyling')) {
                    let wordRange = editor.document.getWordRangeAtPosition(cursorPos);
                    if (wordRange == undefined) {
                        wordRange = new vscode_1.Range(cursorPos, cursorPos);
                    }
                    // One special case: toggle strikethrough in task list
                    const currentTextLine = editor.document.lineAt(selection.start.line);
                    if (startPattern === '~~' && /^\s*[\*\+\-] \[[ x]\]\s+/g.test(currentTextLine.text.trim())) {
                        wordRange = currentTextLine.range.with(new vscode_1.Position(selection.start.line, currentTextLine.text.match(/^\s*[\*\+\-] \[[ x]\]\s+/g)[0].length));
                    }
                    yield wrapRange(editor, options, cursorPos, wordRange, false, startPattern);
                }
                else {
                    switch (getContext(startPattern)) {
                        case `${startPattern}text|${endPattern}`:
                            let newCursorPos = cursorPos.with({ character: cursorPos.character + endPattern.length });
                            editor.selection = new vscode_1.Selection(newCursorPos, newCursorPos);
                            break;
                        case `${startPattern}|${endPattern}`:
                            let start = cursorPos.with({ character: cursorPos.character - startPattern.length });
                            let end = cursorPos.with({ character: cursorPos.character + endPattern.length });
                            yield wrapRange(editor, options, cursorPos, new vscode_1.Range(start, end), false, startPattern);
                            break;
                        default:
                            yield wrapRange(editor, options, cursorPos, new vscode_1.Range(cursorPos, cursorPos), false, startPattern);
                            break;
                    }
                }
            }
            else {
                yield wrapRange(editor, options, cursorPos, selection, true, startPattern);
            }
        }
    });
}
/**
 * Add or remove `startPattern`/`endPattern` according to the context
 * @param cursor cursor position
 * @param range range to be replaced
 * @param isSelected is this range selected
 * @param startPattern
 * @param endPattern
 */
function wrapRange(editor, options, cursor, range, isSelected, startPattern, endPattern) {
    if (endPattern == undefined) {
        endPattern = startPattern;
    }
    /**
     * 💩 IMHO, it makes more sense to use `await` to chain these two operations
     *     1. replace text
     *     2. fix cursor position
     * But using `await` will cause noticeable cursor moving from `|` to `****|` to `**|**`.
     * Since using promise here can also pass the unit tests, I choose this "bad codes"(?)
     */
    let promise;
    let text = editor.document.getText(range);
    let newCursorPos;
    if (isWrapped(text, startPattern)) {
        // remove start/end patterns from range
        promise = replaceWith(range, text.substr(startPattern.length, text.length - startPattern.length - endPattern.length), options);
        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) {
                if (cursor.character == range.start.character) {
                    newCursorPos = cursor;
                }
                else if (cursor.character == range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character - startPattern.length - endPattern.length });
                }
                else {
                    newCursorPos = cursor.with({ character: cursor.character - startPattern.length });
                }
            }
            else {
                newCursorPos = cursor.with({ character: cursor.character + startPattern.length });
            }
        }
    }
    else {
        // add start/end patterns arround range
        promise = replaceWith(range, startPattern + text + endPattern, options);
        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) {
                if (cursor.character == range.start.character) {
                    newCursorPos = cursor;
                }
                else if (cursor.character == range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character + startPattern.length + endPattern.length });
                }
                else {
                    newCursorPos = cursor.with({ character: cursor.character + startPattern.length });
                }
            }
            else {
                newCursorPos = cursor.with({ character: cursor.character + startPattern.length });
            }
        }
    }
    if (!isSelected) {
        editor.selection = new vscode_1.Selection(newCursorPos, newCursorPos);
    }
    return promise;
}
function isWrapped(text, startPattern, endPattern) {
    if (endPattern == undefined) {
        endPattern = startPattern;
    }
    return text.startsWith(startPattern) && text.endsWith(endPattern);
}
function replaceWith(range, newText, options) {
    let editor = vscode_1.window.activeTextEditor;
    return editor.edit(edit => {
        edit.replace(range, newText);
    }, options);
}
function getContext(startPattern, endPattern) {
    if (endPattern == undefined) {
        endPattern = startPattern;
    }
    let editor = vscode_1.window.activeTextEditor;
    let selection = editor.selection;
    let position = selection.active;
    let startPositionCharacter = position.character - startPattern.length;
    let endPositionCharacter = position.character + endPattern.length;
    if (startPositionCharacter < 0) {
        startPositionCharacter = 0;
    }
    let leftText = editor.document.getText(selection.with({ start: position.with({ character: startPositionCharacter }) }));
    let rightText = editor.document.getText(selection.with({ end: position.with({ character: endPositionCharacter }) }));
    if (rightText == endPattern) {
        if (leftText == startPattern) {
            return `${startPattern}|${endPattern}`;
        }
        else {
            return `${startPattern}text|${endPattern}`;
        }
    }
    return '|';
}
//# sourceMappingURL=formatting.js.map