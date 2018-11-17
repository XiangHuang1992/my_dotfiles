"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const pdfProvider_1 = require("./pdfProvider");
const path = require("path");
function activate(context) {
    const openedPanels = [];
    const provider = new pdfProvider_1.PdfDocumentContentProvider(context);
    const revealIfAlreadyOpened = (uri) => {
        const opened = openedPanels.find(panel => panel.viewType === uri.fsPath);
        if (!opened)
            return false;
        opened.reveal(opened.viewColumn);
        return true;
    };
    const registerPanel = (panel) => {
        panel.onDidDispose(() => {
            openedPanels.splice(openedPanels.indexOf(panel), 1);
        });
        openedPanels.push(panel);
    };
    const previewAndCloseSrcDoc = (document) => __awaiter(this, void 0, void 0, function* () {
        if (document.languageId === "pdf") {
            vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            if (!revealIfAlreadyOpened(document.uri)) {
                registerPanel(showPreview(document.uri, provider));
            }
        }
    });
    const openedEvent = vscode.workspace.onDidOpenTextDocument((document) => {
        previewAndCloseSrcDoc(document);
    });
    const previewCmd = vscode.commands.registerCommand("extension.pdf-preview", (uri) => {
        if (!revealIfAlreadyOpened(uri)) {
            registerPanel(showPreview(uri, provider));
        }
    });
    // If pdf file is already opened when load workspace.
    if (vscode.window.activeTextEditor) {
        previewAndCloseSrcDoc(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(openedEvent, previewCmd);
}
exports.activate = activate;
function showPreview(uri, provider) {
    const basename = path.basename(uri.fsPath);
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : 1;
    const panel = vscode.window.createWebviewPanel(uri.fsPath, // treated as identity
    basename, column, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    panel.webview.html = provider.provideTextDocumentContent(uri);
    return panel;
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map