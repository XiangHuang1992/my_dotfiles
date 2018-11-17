/* tslint:disable:quotemark */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class PdfDocumentContentProvider {
    constructor(_context) {
        this._context = _context;
    }
    getPath(p) {
        return path.join(this._context.extensionPath, p);
    }
    provideTextDocumentContent(uri) {
        const docUri = encodeURIComponent(uri.path);
        const head = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<meta http-equiv="Content-type" content="text/html;charset=UTF-8">',
            `<link rel="stylesheet" type="text/css" href="vscode-resource://${this.getPath("lib/pdf.css")}">`,
            '</head>'
        ].join("\n");
        const body = [
            '<body>',
            `<iframe id="pdf-viewer" src="vscode-resource://${this.getPath("lib/web/viewer.html")}?file=vscode-resource://${docUri}">`,
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