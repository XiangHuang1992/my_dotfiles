'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const main_1 = require("./main");
const languageProvider_1 = require("./common/languageProvider");
const main_2 = require("./telemetry/main");
const contracts_1 = require("./telemetry/contracts");
// Required by @jupyter/services
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
global.requirejs = require('requirejs');
global.WebSocket = require('ws');
function activate(context) {
    main_2.sendTelemetryEvent(contracts_1.EVENT_LOAD);
    let outputChannel = vscode.window.createOutputChannel('Jupyter');
    context.subscriptions.push(outputChannel);
    let jupyter = new main_1.Jupyter(outputChannel);
    context.subscriptions.push(jupyter);
    return {
        registerLanguageProvider: (language, provider) => {
            languageProvider_1.LanguageProviders.registerLanguageProvider(language, provider);
        },
        hasCodeCells: (document, token) => {
            return jupyter.hasCodeCells(document, token);
        }
    };
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map