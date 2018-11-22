"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const grammar_1 = require("./grammar");
const EMPTY_ELEMENTS = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
];
function activate(context) {
    /**
     * Custom Block Grammar generation command
     */
    context.subscriptions.push(vscode.commands.registerCommand('vetur.generateGrammar', () => {
        const customBlocks = vscode_1.workspace.getConfiguration().get('vetur.grammar.customBlocks') || {};
        try {
            const generatedGrammar = grammar_1.getGeneratedGrammar(path.resolve(context.extensionPath, 'syntaxes/vue.json'), customBlocks);
            fs.writeFileSync(path.resolve(context.extensionPath, 'syntaxes/vue-generated.json'), generatedGrammar, 'utf-8');
            vscode.window.showInformationMessage('Successfully generated vue grammar. Reload VS Code to enable it.');
        }
        catch (e) {
            vscode.window.showErrorMessage('Failed to generate vue grammar. `vetur.grammar.customBlocks` contain invalid language values');
        }
    }));
    /**
     * Vue Language Server Initialization
     */
    const serverModule = context.asAbsolutePath(path.join('server', 'dist', 'vueServerMain.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6005'] };
    const serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    const documentSelector = ['vue'];
    const config = vscode_1.workspace.getConfiguration();
    const clientOptions = {
        documentSelector,
        synchronize: {
            configurationSection: ['vetur', 'emmet', 'html', 'javascript', 'typescript', 'prettier', 'stylusSupremacy'],
            fileEvents: vscode.workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', true, false, true)
        },
        initializationOptions: {
            config
        },
        revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never
    };
    const client = new vscode_languageclient_1.LanguageClient('vetur', 'Vue Language Server', serverOptions, clientOptions);
    const disposable = client.start();
    context.subscriptions.push(disposable);
    vscode_1.languages.setLanguageConfiguration('vue-html', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
        onEnterRules: [
            {
                beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent }
            },
            {
                beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                action: { indentAction: vscode_1.IndentAction.Indent }
            }
        ]
    });
}
exports.activate = activate;
//# sourceMappingURL=vueMain.js.map