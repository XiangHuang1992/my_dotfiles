"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const vscode_1 = require("vscode");
const helpers_1 = require("../../common/helpers");
const events_1 = require("events");
const factory_1 = require("./factory");
var utils_2 = require("./utils");
exports.inputNotebookDetails = utils_2.inputNotebookDetails;
exports.selectExistingNotebook = utils_2.selectExistingNotebook;
class NotebookManager extends events_1.EventEmitter {
    constructor(outputChannel) {
        super();
        this.outputChannel = outputChannel;
        this.disposables = [];
        this.factory = new factory_1.NotebookFactory(outputChannel);
        this.factory.on('onShutdown', () => {
            this.emit('onShutdown');
        });
        this.disposables.push(this.factory);
    }
    dispose() {
        this.disposables.forEach(d => {
            d.dispose();
        });
        this.disposables = [];
    }
    setNotebook(notebook) {
        this._currentNotebook = notebook;
        this.emit('onNotebookChanged', notebook);
    }
    canShutdown(nb) {
        return this.factory.canShutdown(nb.baseUrl);
    }
    shutdown() {
        this.factory.shutdown();
        this.emit('onShutdown');
    }
    startNewNotebook() {
        this.shutdown();
        return this.factory.startNewNotebook().then(nb => {
            this._currentNotebook = nb;
            return nb;
        });
    }
    getNotebook() {
        if (this._currentNotebook && this._currentNotebook.baseUrl.length > 0) {
            return Promise.resolve(this._currentNotebook);
        }
        const startNew = 'Start a new Notebook';
        const selectExisting = 'Select an existing Notebook';
        let def = helpers_1.createDeferred();
        vscode_1.window.showQuickPick([startNew, selectExisting]).then(option => {
            if (!option) {
                return def.resolve();
            }
            if (option === startNew) {
                this.factory.startNewNotebook()
                    .then(def.resolve.bind(def))
                    .catch(def.reject.bind(def));
            }
            else {
                utils_1.selectExistingNotebook()
                    .then(def.resolve.bind(def))
                    .catch(def.reject.bind(def));
            }
        });
        def.promise.then(nb => {
            this._currentNotebook = nb;
            return nb;
        });
        return def.promise;
    }
}
exports.NotebookManager = NotebookManager;
//# sourceMappingURL=manager.js.map