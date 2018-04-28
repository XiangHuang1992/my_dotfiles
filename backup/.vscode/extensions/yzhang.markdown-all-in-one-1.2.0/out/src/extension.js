'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const formatting = require("./formatting");
const toc = require("./toc");
const preview = require("./preview");
const print = require("./print");
const listEditing = require("./listEditing");
const tableFormatter = require("./tableFormatter");
function activate(context) {
    activateMdExt(context);
    return {
        extendMarkdownIt(md) {
            return md.use(require('markdown-it-task-lists'))
                .use(require('@iktakahiro/markdown-it-katex'));
        }
    };
}
exports.activate = activate;
function activateMdExt(context) {
    // Override `Enter`, `Tab` and `Backspace` keys
    listEditing.activate(context);
    // Shortcuts
    formatting.activate(context);
    // Toc
    toc.activate(context);
    // Auto show preview to side
    preview.activate(context);
    // Print to PDF
    print.activate(context);
    // Table formatter
    if (vscode_1.workspace.getConfiguration('markdown.extension.tableFormatter').get('enabled')) {
        tableFormatter.activate(context);
    }
    // Allow `*` in word pattern for quick styling
    vscode_1.languages.setLanguageConfiguration('markdown', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s\，\。\《\》\？\；\：\‘\“\’\”\（\）\【\】\、]+)/g
    });
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map