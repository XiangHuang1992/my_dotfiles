"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../common/helpers");
const procUtils_1 = require("../../common/procUtils");
const vscode_1 = require("vscode");
function getAvailableNotebooks() {
    return procUtils_1.execPythonFileSync('jupyter', ['notebook', 'list'], __dirname)
        .then(resp => {
        var items = resp.split(/\r|\n/)
            .filter(line => line.trim().length > 0)
            .map(parseNotebookListItem)
            .filter(nb => nb != undefined);
        return items;
    });
}
exports.getAvailableNotebooks = getAvailableNotebooks;
function waitForNotebookToStart(baseUrl, retryInterval, timeout) {
    baseUrl = baseUrl.toLowerCase();
    let def = helpers_1.createDeferred();
    let stop = setTimeout(() => {
        if (!def.completed) {
            def.reject('Timeout waiting for Notebook to start');
        }
    }, timeout);
    let startTime = Date.now();
    function check() {
        getAvailableNotebooks()
            .catch(ex => {
            console.error('Error in checking if notebook has started');
            console.error(ex);
            return [];
        })
            .then(items => {
            let index = items.findIndex(item => item.baseUrl.toLowerCase().indexOf(baseUrl) === 0);
            if (index === -1) {
                if (Date.now() - startTime > timeout) {
                    return def.reject('Timeout waiting for Notebook to start');
                }
                setTimeout(() => check(), retryInterval);
            }
            else {
                def.resolve(items[index]);
            }
        });
    }
    setTimeout(() => check(), 0);
    return def.promise;
}
exports.waitForNotebookToStart = waitForNotebookToStart;
function parseNotebookListItem(item) {
    if (!item.trim().startsWith('http')) {
        return;
    }
    let parts = item.split('::').filter(part => part !== '::').map(part => part.trim());
    let url = parts.shift();
    let startupFolder = item.indexOf('::') > 0 ? parts[0].trim() : null;
    let token = '';
    let urlOnly = url;
    if (url.indexOf('token=') > 0) {
        token = url.split('=')[1].trim();
        urlOnly = url.split('?')[0].trim();
    }
    return {
        startupFolder: startupFolder,
        token: token,
        baseUrl: urlOnly
    };
}
function selectExistingNotebook() {
    let def = helpers_1.createDeferred();
    getAvailableNotebooks()
        .then(notebooks => {
        let items = notebooks.map(item => {
            let details = item.startupFolder && item.startupFolder.length > 0 ? `Starup Folder: ${item.startupFolder}` : '';
            return {
                label: item.baseUrl,
                description: '',
                detail: details,
                notebook: item
            };
        });
        vscode_1.window.showQuickPick(items)
            .then(item => {
            if (item) {
                def.resolve(item.notebook);
            }
            else {
                def.resolve();
            }
        });
    });
    return def.promise;
}
exports.selectExistingNotebook = selectExistingNotebook;
function inputNotebookDetails() {
    let def = helpers_1.createDeferred();
    vscode_1.window.showInputBox({
        prompt: 'Provide Url of existing Jupyter Notebook (e.g. http://localhost:888/)',
        value: 'http://localhost:8888/'
    }).then(url => {
        if (!url) {
            return;
        }
        let nb = parseNotebookListItem(url);
        if (!nb) {
            return;
        }
        return nb;
    }).then(nb => {
        if (!nb || nb.token) {
            return def.resolve(nb);
        }
        vscode_1.window.showInputBox({
            prompt: 'Provide the token to connect to the Jupyter Notebook'
        }).then(token => {
            if (token) {
                nb.token = token;
            }
            def.resolve(nb);
        });
    });
    return def.promise;
}
exports.inputNotebookDetails = inputNotebookDetails;
//# sourceMappingURL=utils.js.map