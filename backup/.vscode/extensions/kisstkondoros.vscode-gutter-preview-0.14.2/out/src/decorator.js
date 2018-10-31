"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const probe = require("probe-image-size");
const editorutil_1 = require("./util/editorutil");
function imageDecorator(decoratorProvider, context, client) {
    const [major, minor] = vscode.version.split('.').map(v => parseInt(v));
    let scanResults = {};
    let throttleIds = {};
    let throttledScan = (document, timeout = 500) => {
        if (document && document.uri) {
            const lookupKey = document.uri.toString();
            if (throttleIds[lookupKey])
                clearTimeout(throttleIds[lookupKey]);
            throttleIds[lookupKey] = setTimeout(() => {
                scan(document);
                delete throttleIds[lookupKey];
            }, timeout);
        }
    };
    const decorate = (showImagePreviewOnGutter, editor, imageInfo, lastScanResult) => {
        let decorations = [];
        const uri = imageInfo.imagePath;
        const absoluteImagePath = imageInfo.originalImagePath;
        var range = client.protocol2CodeConverter.asRange(imageInfo.range);
        decorations.push({
            range: range,
            hoverMessage: ''
        });
        let decorationRenderOptions = {
            gutterIconPath: uri,
            gutterIconSize: 'contain',
            textDecoration: 'underline'
        };
        let textEditorDecorationType = vscode.window.createTextEditorDecorationType(decorationRenderOptions);
        lastScanResult.push({
            textEditorDecorationType,
            decorations,
            originalImagePath: absoluteImagePath,
            imagePath: uri
        });
        if (showImagePreviewOnGutter && editor) {
            editor.setDecorations(textEditorDecorationType, decorations);
        }
    };
    let hoverProvider = {
        provideHover(document, position) {
            let maxHeight = vscode.workspace.getConfiguration('gutterpreview').get('imagepreviewmaxheight', 100);
            if (maxHeight < 0) {
                maxHeight = 100;
            }
            let result = undefined;
            if (major > 1 || (major == 1 && minor > 7)) {
                const documentDecorators = getDocumentDecorators(document);
                const matchingDecoratorAndItem = documentDecorators
                    .map(item => {
                    return {
                        item: item,
                        decoration: item.decorations.find(dec => dec.range.contains(position))
                    };
                })
                    .find(pair => pair.decoration != null);
                if (matchingDecoratorAndItem) {
                    const item = matchingDecoratorAndItem.item;
                    var fallback = (markedString) => {
                        let resultset = [markedString];
                        return new vscode.Hover(resultset, document.getWordRangeAtPosition(position));
                    };
                    var imageWithSize = (markedString, result) => {
                        let resultset = [
                            markedString + `  \r\n${result.width}x${result.height}`
                        ];
                        return new vscode.Hover(resultset, document.getWordRangeAtPosition(position));
                    };
                    let markedString = `![${item.originalImagePath}](${item.imagePath}|height=${maxHeight})`;
                    try {
                        result = probe(fs.createReadStream(item.imagePath)).then(result => imageWithSize(markedString, result), () => fallback(markedString));
                    }
                    catch (error) {
                        result = Promise.resolve(fallback(markedString));
                    }
                }
            }
            return result;
        }
    };
    const refreshAllVisibleEditors = () => {
        vscode.window.visibleTextEditors
            .map(p => p.document)
            .filter(p => p != null)
            .forEach(doc => throttledScan(doc));
    };
    const getDocumentDecorators = (document) => {
        const scanResult = scanResults[document.uri.toString()] || [];
        scanResults[document.uri.toString()] = scanResult;
        return scanResult;
    };
    const scan = (document) => {
        const editors = editorutil_1.findEditorsForDocument(document);
        if (editors.length > 0) {
            const config = vscode.workspace.getConfiguration('gutterpreview');
            const showImagePreviewOnGutter = config.get('showimagepreviewongutter', true);
            decoratorProvider(document).then(symbolResponse => {
                const scanResult = getDocumentDecorators(document);
                editorutil_1.clearEditorDecorations(document, scanResult.map(p => p.textEditorDecorationType));
                scanResult.length = 0;
                symbolResponse.images.forEach(p => editors.forEach(editor => decorate(showImagePreviewOnGutter, editor, p, scanResult)));
            });
        }
    };
    context.subscriptions.push(vscode.languages.registerHoverProvider(['*'], hoverProvider));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        if (e) {
            throttledScan(e.document);
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
        if (e) {
            throttledScan(e.document);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        refreshAllVisibleEditors();
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(e => {
        if (e) {
            const scanResult = (scanResults[e.uri.toString()] = scanResults[e.uri.toString()] || []);
            editorutil_1.clearEditorDecorations(e, scanResult.map(p => p.textEditorDecorationType));
            scanResult.length = 0;
            throttledScan(e);
        }
    }));
    refreshAllVisibleEditors();
}
exports.imageDecorator = imageDecorator;
//# sourceMappingURL=decorator.js.map