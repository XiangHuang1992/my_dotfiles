'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// See https://github.com/Microsoft/vscode/tree/master/extensions/markdown/src
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const localize_1 = require("./localize");
const hljs = require(path.join(util_1.officialExtPath, 'node_modules', 'highlight.js'));
const mdnh = require(path.join(util_1.officialExtPath, 'node_modules', 'markdown-it-named-headers'));
const mdtl = require('markdown-it-task-lists');
const mdkt = require('@neilsustc/markdown-it-katex');
const md = require(path.join(util_1.officialExtPath, 'node_modules', 'markdown-it'))({
    html: true,
    highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return `<pre class="hljs"><code><div>${hljs.highlight(lang, str, true).value}</div></code></pre>`;
            }
            catch (error) { }
        }
        // return `<pre class="hljs"><code><div>${this.engine.utils.escapeHtml(str)}</div></code></pre>`;
        return str;
    }
}).use(mdnh, {
    slugify: (header) => util_1.slugify(header)
}).use(mdtl).use(mdkt);
let thisContext;
function activate(context) {
    thisContext = context;
    context.subscriptions.push(vscode.commands.registerCommand('markdown.extension.printToHtml', () => { print('html'); }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function print(type) {
    let editor = vscode.window.activeTextEditor;
    if (!util_1.isMdEditor(editor)) {
        vscode.window.showErrorMessage(localize_1.default("noValidMarkdownFile"));
        return;
    }
    let doc = editor.document;
    if (doc.isDirty || doc.isUntitled) {
        doc.save();
    }
    vscode.window.setStatusBarMessage(localize_1.default("printing") + ` '${path.basename(doc.fileName)}' ` + localize_1.default("to") + ` '${type.toUpperCase()}' ...`, 1000);
    /**
     * Modified from <https://github.com/Microsoft/vscode/tree/master/extensions/markdown>
     * src/previewContentProvider MDDocumentContentProvider provideTextDocumentContent
     */
    let outPath = doc.fileName.replace(/\.\w+?$/, `.${type}`);
    outPath = outPath.replace(/^([cdefghij]):\\/, function (match, p1) {
        return `${p1.toUpperCase()}:\\`; // Capitalize drive letter
    });
    if (!outPath.endsWith(`.${type}`)) {
        outPath += `.${type}`;
    }
    let body = render(doc.getText(), vscode.workspace.getConfiguration('markdown.preview', doc.uri));
    if (vscode.workspace.getConfiguration("markdown.extension.print", doc.uri).get("absoluteImgPath")) {
        body = body.replace(/(<img[^>]+src=")([^"]+)("[^>]*>)/g, function (match, p1, p2, p3) {
            const imgUri = fixHref(doc.uri, p2);
            if (vscode.workspace.getConfiguration("markdown.extension.print", doc.uri).get("imgToBase64")) {
                try {
                    const imgExt = path.extname(imgUri.fsPath).slice(1);
                    const file = fs.readFileSync(imgUri.fsPath).toString('base64');
                    return `${p1}data:image/${imgExt};base64,${file}${p3}`;
                }
                catch (e) {
                    vscode.window.showWarningMessage(localize_1.default("unableToReadFile") + ` ${imgUri.fsPath}, ` + localize_1.default("revertingToImagePaths"));
                }
            }
            return `${p1}${imgUri.toString()}${p3}`;
        });
    }
    let styleSheets = ['markdown.css', 'tomorrow.css', 'checkbox.css'].map(s => getMediaPath(s))
        .concat(getCustomStyleSheets(doc.uri));
    let html = `<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.10.0-alpha/dist/katex.min.css" integrity="sha384-BTL0nVi8DnMrNdMQZG1Ww6yasK9ZGnUxL1ZWukXQ7fygA1py52yPp9W4wrR00VML" crossorigin="anonymous">
        ${styleSheets.map(css => wrapWithStyleTag(css)).join('\n')}
        ${getSettingsOverrideStyles()}
    </head>
    <body>
        ${body}
    </body>
    </html>`;
    switch (type) {
        case 'html':
            fs.writeFile(outPath, html, 'utf-8', function (err) {
                if (err) {
                    console.log(err);
                }
            });
            break;
        case 'pdf':
            break;
    }
}
function render(text, config) {
    md.set({
        breaks: config.get('breaks', false),
        linkify: config.get('linkify', true)
    });
    return md.render(text);
}
function getMediaPath(mediaFile) {
    return thisContext.asAbsolutePath(path.join('media', mediaFile));
}
function wrapWithStyleTag(src) {
    let uri = vscode.Uri.parse(src);
    if (uri.scheme.includes('http')) {
        return `<link rel="stylesheet" href="${src}">`;
    }
    else {
        return `<style>\n${readCss(src)}\n</style>`;
    }
}
function readCss(fileName) {
    try {
        return fs.readFileSync(fileName).toString().replace(/\s+/g, ' ');
    }
    catch (error) {
        let msg = error.message.replace('ENOENT: no such file or directory, open', localize_1.default("customStyle")) + localize_1.default("notFound");
        msg = msg.replace(/'([c-z]):/, function (match, g1) {
            return `'${g1.toUpperCase()}:`;
        });
        vscode.window.showWarningMessage(msg);
        return '';
    }
}
function getCustomStyleSheets(resource) {
    const styles = vscode.workspace.getConfiguration('markdown')['styles'];
    if (styles && Array.isArray(styles) && styles.length > 0) {
        return styles.map(s => {
            let uri = fixHref(resource, s);
            if (uri.scheme === 'file') {
                return uri.fsPath;
            }
            return s;
        });
    }
    return [];
}
function fixHref(resource, href) {
    if (!href) {
        return vscode.Uri.file(href);
    }
    // Use href if it is already an URL
    const hrefUri = vscode.Uri.parse(href);
    if (['http', 'https'].indexOf(hrefUri.scheme) >= 0) {
        return hrefUri;
    }
    // Use href as file URI if it is absolute
    if (path.isAbsolute(href) || hrefUri.scheme === 'file') {
        return vscode.Uri.file(href);
    }
    // Use a workspace relative path if there is a workspace
    let root = vscode.workspace.getWorkspaceFolder(resource);
    if (root) {
        return vscode.Uri.file(path.join(root.uri.fsPath, href));
    }
    // Otherwise look relative to the markdown file
    return vscode.Uri.file(path.join(path.dirname(resource.fsPath), href));
}
function getSettingsOverrideStyles() {
    const previewSettings = vscode.workspace.getConfiguration('markdown')['preview'];
    if (!previewSettings) {
        return '';
    }
    const { fontFamily, fontSize, lineHeight } = previewSettings;
    return `<style>
            body {
                ${fontFamily ? `font-family: ${fontFamily};` : ''}
                ${+fontSize > 0 ? `font-size: ${fontSize}px;` : ''}
                ${+lineHeight > 0 ? `line-height: ${lineHeight};` : ''}
            }
        </style>`;
}
//# sourceMappingURL=print.js.map