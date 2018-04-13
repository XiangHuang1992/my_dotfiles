"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const helpers_1 = require("../../common/helpers");
const systemVariables_1 = require("../../common/systemVariables");
const events_1 = require("events");
const portUtils_1 = require("./portUtils");
const utils_1 = require("./utils");
const progressBar_1 = require("../../display/progressBar");
const procUtils_1 = require("../../common/procUtils");
const tcpPortUsed = require('tcp-port-used');
class NotebookFactory extends events_1.EventEmitter {
    constructor(outputChannel) {
        super();
        this.outputChannel = outputChannel;
        this.disposables = [];
        this.notebookOutputChannel = vscode_1.window.createOutputChannel('Jupyter Notebook');
        this.disposables.push(this.notebookOutputChannel);
    }
    dispose() {
        this.disposables.forEach(d => {
            d.dispose();
        });
        this.disposables = [];
        this.shutdown();
    }
    canShutdown(url) {
        if (!this._notebookUrlInfo) {
            return false;
        }
        let ourUrl = this._notebookUrlInfo.baseUrl.toLowerCase();
        url = url.toUpperCase();
        // Assuming we have '/' at the ends of the urls
        return ourUrl.indexOf(url) === 0 || url.indexOf(ourUrl) === 0;
    }
    shutdown() {
        if (this.proc) {
            try {
                this.proc.kill();
            }
            catch (ex) { }
            this.proc = null;
            this._notebookUrlInfo = null;
        }
        this.notebookOutputChannel.clear();
        this.emit('onShutdown');
    }
    startJupyterNotebookInTerminal(startupFolder, args) {
        this.notebookOutputChannel.appendLine('Starting Jupyter Notebook');
        this.notebookOutputChannel.appendLine('jupyter ' + ['notebook'].concat(args).join(' '));
        return procUtils_1.spanwPythonFile('jupyter', ['notebook'].concat(args), startupFolder)
            .then(proc => {
            this.proc = proc;
            this.proc.stderr.on('data', data => {
                this.notebookOutputChannel.append(data.toString());
            });
        });
    }
    startNewNotebook() {
        this._notebookUrlInfo = null;
        this.notebookOutputChannel.clear();
        let prom = this.startNotebook().then(url => {
            return url;
        });
        progressBar_1.ProgressBar.Instance.setProgressMessage('Starting Notebook', prom);
        return prom;
    }
    startNotebook() {
        let sysVars = new systemVariables_1.SystemVariables();
        let jupyterSettings = vscode_1.workspace.getConfiguration('jupyter');
        let startupFolder = sysVars.resolve(jupyterSettings.get('notebook.startupFolder', vscode_1.workspace.rootPath || __dirname));
        let args = jupyterSettings.get('notebook.startupArgs', []);
        args = args.map(arg => sysVars.resolve(arg));
        if (this.proc) {
            this.shutdown();
        }
        let ipIndex = args.findIndex(arg => arg.indexOf('--ip') === 0);
        let ip = ipIndex > 0 ? args[ipIndex].trim().split('=')[1] : 'localhost';
        let portIndex = args.findIndex(arg => arg.indexOf('--port') === 0);
        let port = portIndex > 0 ? parseInt(args[portIndex].trim().split('=')[1]) : 8888;
        let protocol = args.filter(arg => arg.indexOf('--certfile') === 0).length > 0 ? 'https' : 'http';
        // Ensure CORS
        if (args.findIndex(arg => arg.indexOf('--NotebookApp.allow_origin') === -1)) {
            args.push('--NotebookApp.allow_origin="*"');
        }
        let def = helpers_1.createDeferred();
        const retryIntervalMs = 250;
        const timeoutMs = 20000;
        let url = `${protocol}://${ip}:${port}`;
        portUtils_1.getAvailablePort(protocol, ip, port)
            .catch(() => Promise.resolve(port))
            .then(nextAvailablePort => this.startJupyterNotebookInTerminal(startupFolder, args).then(() => nextAvailablePort))
            .then(nextAvailablePort => {
            url = `${protocol}://${ip}:${nextAvailablePort}`;
            return tcpPortUsed.waitUntilUsed(nextAvailablePort, retryIntervalMs, timeoutMs);
        })
            .then(() => {
            // Just because the port is in use doesn't mean Notebook has fully started
            // Now try to get a list of available notebooks
            return utils_1.waitForNotebookToStart(url, retryIntervalMs, timeoutMs);
        }).then(nb => {
            def.resolve(nb);
        })
            .catch(() => {
            def.reject(`Failed to detect Jupyter Notebook. Please use 'Select Jupyter Notebook' command`);
        });
        return def.promise;
    }
}
exports.NotebookFactory = NotebookFactory;
//# sourceMappingURL=factory.js.map