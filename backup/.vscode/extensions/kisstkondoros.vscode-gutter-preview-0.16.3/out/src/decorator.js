"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const slash = require("slash");
const fs = require("fs");
const probe = require("probe-image-size");
require("any-promise/register/es6-promise");
const editorutil_1 = require("./util/editorutil");
const configuration_1 = require("./util/configuration");
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
        const normalizedPath = imageInfo.imagePath.startsWith('data:')
            ? imageInfo.imagePath
            : 'file://' + slash(imageInfo.imagePath);
        let uri = vscode.Uri.parse(normalizedPath);
        const absoluteImagePath = imageInfo.originalImagePath;
        const underlineEnabled = configuration_1.getConfiguredProperty(editor && editor.document ? editor.document : undefined, 'showUnderline', true);
        var range = client.protocol2CodeConverter.asRange(imageInfo.range);
        decorations.push({
            range: range,
            hoverMessage: ''
        });
        let decorationRenderOptions = {
            gutterIconPath: uri,
            gutterIconSize: 'contain',
            textDecoration: underlineEnabled ? 'underline' : 'none'
        };
        let textEditorDecorationType = vscode.window.createTextEditorDecorationType(decorationRenderOptions);
        lastScanResult.push({
            textEditorDecorationType,
            decorations,
            originalImagePath: absoluteImagePath,
            imagePath: imageInfo.imagePath
        });
        const toSingleLineDecorationOption = (source) => {
            return {
                hoverMessage: source.hoverMessage,
                range: new vscode.Range(source.range.start, source.range.start),
                renderOptions: source.renderOptions
            };
        };
        if (showImagePreviewOnGutter && editor) {
            editor.setDecorations(textEditorDecorationType, decorations.map(p => toSingleLineDecorationOption(p)));
        }
    };
    let hoverProvider = {
        provideHover(document, position) {
            let maxHeight = configuration_1.getConfiguredProperty(document, 'imagePreviewMaxHeight', 100);
            if (maxHeight < 0) {
                maxHeight = 100;
            }
            let result = undefined;
            if (major > 1 || (major == 1 && minor > 7)) {
                const documentDecorators = getDocumentDecorators(document);
                const matchingDecoratorAndItem = documentDecorators.decorations
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
                    let markedString = imagePath => `![${imagePath}](${imagePath}|height=${maxHeight})`;
                    try {
                        if (item.originalImagePath.startsWith('data:image')) {
                            result = Promise.resolve(fallback(markedString(item.originalImagePath)));
                        }
                        else {
                            result = probe(fs.createReadStream(item.imagePath)).then(result => imageWithSize(markedString(item.imagePath), result), () => fallback(markedString(item.imagePath)));
                        }
                    }
                    catch (error) {
                        result = Promise.resolve(fallback(markedString(item.imagePath)));
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
        const scanResult = scanResults[document.uri.toString()] || {
            decorations: [],
            token: new vscode.CancellationTokenSource()
        };
        scanResults[document.uri.toString()] = scanResult;
        return scanResult;
    };
    const scan = (document) => {
        const editors = editorutil_1.findEditorsForDocument(document);
        if (editors.length > 0) {
            const showImagePreviewOnGutter = configuration_1.getConfiguredProperty(document, 'showImagePreviewOnGutter', true);
            const visibleLines = [];
            for (const editor of editors) {
                for (const range of editor.visibleRanges) {
                    let lineIndex = range.start.line;
                    while (lineIndex <= range.end.line) {
                        visibleLines.push(lineIndex);
                        lineIndex++;
                    }
                }
            }
            const scanResult = getDocumentDecorators(document);
            scanResult.token.cancel();
            scanResult.token = new vscode.CancellationTokenSource();
            decoratorProvider(document, visibleLines, scanResult.token.token)
                .then(symbolResponse => {
                const scanResult = getDocumentDecorators(document);
                editorutil_1.clearEditorDecorations(document, scanResult.decorations.map(p => p.textEditorDecorationType));
                scanResult.decorations.length = 0;
                symbolResponse.images.forEach(p => {
                    editors.forEach(editor => decorate(showImagePreviewOnGutter, editor, p, scanResult.decorations));
                });
            })
                .catch(e => {
                console.error(e);
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
    context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (event && event.textEditor && event.textEditor.document) {
            const document = event.textEditor.document;
            throttledScan(document, 50);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(e => {
        if (e) {
            throttledScan(e);
        }
    }));
    refreshAllVisibleEditors();
}
exports.imageDecorator = imageDecorator;
//# sourceMappingURL=decorator.js.map