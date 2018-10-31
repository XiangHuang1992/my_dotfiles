"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode_1 = require("vscode");
const protocol_1 = require("./common/protocol");
const decorator_1 = require("./decorator");
function activate(context) {
    let serverModule = context.asAbsolutePath(path.join('out', 'src', 'server', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    var output = vscode_1.window.createOutputChannel('gutter-preview');
    let error = (error, message, count) => {
        output.appendLine(message.jsonrpc);
        return undefined;
    };
    let clientOptions = {
        documentSelector: ['*'],
        errorHandler: {
            error: error,
            closed: () => {
                return undefined;
            }
        },
        synchronize: {
            configurationSection: 'gutterpreview'
        }
    };
    let client = new vscode_languageclient_1.LanguageClient('gutterpreview parser', serverOptions, clientOptions);
    let disposable = client.start();
    context.subscriptions.push(disposable);
    let symbolUpdater = (document) => {
        return client.onReady().then(() => {
            const folder = vscode_1.workspace.getWorkspaceFolder(document.uri);
            let workspaceFolder;
            if (folder && folder.uri) {
                workspaceFolder = folder.uri.fsPath;
            }
            return client.sendRequest(protocol_1.GutterPreviewImageRequestType, {
                uri: document.uri.toString(),
                fileName: document.fileName,
                workspaceFolder: workspaceFolder,
                additionalSourcefolder: vscode_1.workspace.getConfiguration('gutterpreview').get('sourcefolder', '')
            });
        });
    };
    decorator_1.imageDecorator(symbolUpdater, context, client);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map