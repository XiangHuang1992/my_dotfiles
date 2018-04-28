'use strict';
const vscode = require("vscode");
const fs = require("fs");
let indexedItems = {};
function activate(context) {
    fs.readFile(context.asAbsolutePath('data/words'), (err, data) => {
        if (err)
            throw err;
        const indexes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        indexes.forEach(i => {
            indexedItems[i] = [];
        });
        let words = data.toString().split(/\r?\n/);
        words.forEach(word => {
            let firstLetter = word.charAt(0).toLowerCase();
            indexedItems[firstLetter].push(new vscode.CompletionItem(word, vscode.CompletionItemKind.Text));
        });
    });
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('markdown', new MarkdownCompletionItemProvider()));
}
exports.activate = activate;
/**
 * Provide completion according to the first letter
 */
class MarkdownCompletionItemProvider {
    provideCompletionItems(document, position, token) {
        if (vscode.workspace.getConfiguration('markdown.extension.completion').get('enabled')) {
            let textBefore = document.lineAt(position.line).text.substring(0, position.character);
            textBefore = textBefore.replace(/\W/g, ' ');
            let currentWord = textBefore.split(/[\s]+/).pop();
            let firstLetter = currentWord.charAt(0);
            // [2017.03.24] Found that this function is only invoked when you begin a new word. It means that currentWord.length == 1 when invoked.
            // console.log('currentWord', currentWord);
            // console.log('firstLetter', firstLetter);
            if (firstLetter.toLowerCase() == firstLetter) {
                return new Promise((resolve, reject) => { resolve(indexedItems[firstLetter]); });
            }
            else {
                let completions = indexedItems[firstLetter.toLowerCase()]
                    .map(w => {
                    let newLabel = w.label.charAt(0).toUpperCase() + w.label.slice(1);
                    return new vscode.CompletionItem(newLabel, vscode.CompletionItemKind.Text);
                });
                console.log('completions', completions);
                return new Promise((resolve, reject) => { resolve(completions); });
            }
        }
        else {
            return new Promise((resolve, reject) => { reject(); });
        }
    }
}
//# sourceMappingURL=completion.js.map