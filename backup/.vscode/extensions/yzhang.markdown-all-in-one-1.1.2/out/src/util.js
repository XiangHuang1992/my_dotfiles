'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function log(msg, obj) {
    if (obj) {
        let toStr;
        if (obj instanceof vscode_1.Range) {
            toStr = `Range (${obj.start.line + 1}, ${obj.start.character + 1}), (${obj.end.line + 1}, ${obj.end.character + 1})`;
        }
        else if (obj instanceof vscode_1.Position) {
            toStr = `Position (${obj.line + 1}, ${obj.character + 1})`;
        }
        else if (obj.fileName !== undefined && obj.languageId !== undefined) {
            toStr = `TextDocument {fileName: ${obj.fileName}, languageId: ${obj.languageId}}`;
        }
        else if (obj.document !== undefined) {
            toStr = `TextEditor {doc: {fileName: ${obj.document.fileName}, languageId: ${obj.document.languageId}}}`;
        }
        else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    toStr += `${key}: ${obj[key]} `;
                }
            }
        }
        console.log(`${msg}: ${toStr}`);
    }
    else {
        console.log(msg);
    }
}
exports.log = log;
function slugify(heading) {
    let slug = heading.trim()
        .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^\-+/, '')
        .replace(/\-+$/, '');
    if (vscode_1.workspace.getConfiguration('markdown.extension.toc').get('toLowerCase')) {
        slug = slug.toLowerCase();
    }
    return vscode_1.workspace.getConfiguration('markdown.extension.toc').get('encodeUri') ? encodeURI(slug) : slug;
}
exports.slugify = slugify;
//# sourceMappingURL=util.js.map