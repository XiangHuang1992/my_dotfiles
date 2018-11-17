/* tslint:disable:quotemark */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class PdfDocumentContentProvider {
    constructor(_context) {
        this._context = _context;
    }
    getUri(...p) {
        return vscode.Uri.file(path.join(this._context.extensionPath, ...p))
            .with({ scheme: 'vscode-resource' });
    }
    provideTextDocumentContent(uri) {
        const docPath = uri.with({ scheme: 'vscode-resource' });
        const head = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<meta http-equiv="Content-type" content="text/html;charset=UTF-8">',
            `<link rel="stylesheet" type="text/css" href="${this.getUri('lib', 'pdf.css')}">`,
            '</head>'
        ].join("\n");
        const body = [
            '<body>',
            `<iframe id="pdf-viewer" src="${this.getUri('lib', 'web', 'viewer.html')}?file=${docPath}">`,
            '</body>'
        ].join("\n");
        const tail = [
            '</html>'
        ].join("\n");
        return head + body + tail;
    }
}
exports.PdfDocumentContentProvider = PdfDocumentContentProvider;
//# sourceMappingURL=pdfProvider.js.map