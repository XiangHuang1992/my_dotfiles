"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tmp = require('tmp');
class DeferredImpl {
    constructor(scope = null) {
        this.scope = scope;
        this._resolved = false;
        this._rejected = false;
        this._promise = new Promise((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });
    }
    resolve(value) {
        this._resolve.apply(this.scope ? this.scope : this, arguments);
        this._resolved = true;
    }
    reject(reason) {
        this._reject.apply(this.scope ? this.scope : this, arguments);
        this._rejected = true;
    }
    get promise() {
        return this._promise;
    }
    get resolved() {
        return this._resolved;
    }
    get rejected() {
        return this._rejected;
    }
    get completed() {
        return this._rejected || this._resolved;
    }
}
function createDeferred(scope = null) {
    return new DeferredImpl(scope);
}
exports.createDeferred = createDeferred;
class Helpers {
    static parseIOMessage(message) {
        if (!Helpers.isValidMessag(message)) {
            return;
        }
        const msg_id = message.parent_header.msg_id;
        if (!msg_id) {
            return;
        }
        let result = Helpers.parseDisplayIOMessage(message);
        if (!result) {
            result = Helpers.parseResultIOMessage(message);
        }
        if (!result) {
            result = Helpers.parseErrorIOMessage(message);
        }
        if (!result) {
            result = Helpers.parseStreamIOMessage(message);
        }
        return result;
    }
    ;
    static isValidMessag(message) {
        if (!message) {
            return false;
        }
        if (!message.content) {
            return false;
        }
        if (message.content.execution_state === 'starting') {
            return false;
        }
        if (!message.parent_header) {
            return false;
        }
        if (typeof message.parent_header.msg_id !== 'string') {
            return false;
        }
        if (typeof message.parent_header.msg_type !== 'string') {
            return false;
        }
        if (!message.header) {
            return false;
        }
        if (typeof message.header.msg_id !== 'string') {
            return false;
        }
        if (typeof message.header.msg_type !== 'string') {
            return false;
        }
        return true;
    }
    ;
    static parseDisplayIOMessage(message) {
        if (message.header.msg_type === 'display_data') {
            return Helpers.parseDataMime(message.content.data);
        }
        return;
    }
    static parseResultIOMessage(message) {
        const msg_type = message.header.msg_type;
        if (msg_type === 'execute_result' || msg_type === 'pyout' || msg_type === 'execution_result') {
            return Helpers.parseDataMime(message.content.data);
        }
        return null;
    }
    static parseDataMime(data) {
        if (!data) {
            return null;
        }
        const mime = Helpers.getMimeType(data);
        if (typeof mime !== 'string') {
            return null;
        }
        let result;
        if (mime === 'text/plain') {
            result = {
                data: {
                    'text/plain': data[mime]
                },
                type: 'text',
                stream: 'pyout'
            };
            result.data['text/plain'] = result.data['text/plain'].trim();
        }
        else {
            result = {
                data: {},
                type: mime,
                stream: 'pyout'
            };
            result.data[mime] = data[mime];
        }
        return result;
    }
    static getMimeType(data) {
        const imageMimes = Object.getOwnPropertyNames(data).filter(mime => {
            return typeof mime === 'string' && mime.startsWith('image/');
        });
        let mime;
        if (data.hasOwnProperty('text/html')) {
            mime = 'text/html';
        }
        else if (data.hasOwnProperty('image/svg+xml')) {
            mime = 'image/svg+xml';
        }
        else if (!(imageMimes.length === 0)) {
            mime = imageMimes[0];
        }
        else if (data.hasOwnProperty('text/markdown')) {
            mime = 'text/markdown';
        }
        else if (data.hasOwnProperty('application/pdf')) {
            mime = 'application/pdf';
        }
        else if (data.hasOwnProperty('text/latex')) {
            mime = 'text/latex';
        }
        else if (data.hasOwnProperty('application/javascript')) {
            mime = 'application/javascript';
        }
        else if (data.hasOwnProperty('application/json')) {
            mime = 'application/json';
        }
        else if (data.hasOwnProperty('text/plain')) {
            mime = 'text/plain';
        }
        return mime;
    }
    static parseErrorIOMessage(message) {
        const msg_type = message.header.msg_type;
        if (msg_type === 'error' || msg_type === 'pyerr') {
            return Helpers.parseErrorMessage(message);
        }
        return null;
    }
    static parseErrorMessage(message) {
        let errorString;
        const messageContent = message.content;
        const ename = typeof messageContent.ename === 'string' ? messageContent.ename : '';
        const evalue = typeof messageContent.evalue === 'string' ? messageContent.evalue : '';
        const errorMessage = ename + ': ' + evalue;
        errorString = errorMessage;
        try {
            errorString = messageContent.traceback.join('\n');
        }
        catch (err) {
        }
        return {
            data: {
                'text/plain': errorString,
            },
            message: errorMessage,
            type: 'text',
            stream: 'error'
        };
    }
    static parseStreamIOMessage(message) {
        let result;
        const messageContent = message.content;
        const idents = message.idents;
        if (message.header.msg_type === 'stream') {
            result = {
                data: {
                    'text/plain': typeof messageContent.text === 'string' ? messageContent.text : messageContent.data
                },
                type: 'text',
                stream: messageContent.name
            };
        }
        else if (idents === 'stdout' || idents === 'stream.stdout' || messageContent.name === 'stdout') {
            result = {
                data: {
                    'text/plain': typeof messageContent.text === 'string' ? messageContent.text : messageContent.data
                },
                type: 'text',
                stream: 'stdout'
            };
        }
        else if (idents === 'stderr' || idents === 'stream.stderr' || messageContent.name === 'stderr') {
            result = {
                data: {
                    'text/plain': typeof messageContent.text === 'string' ? messageContent.text : messageContent.data
                },
                type: 'text',
                stream: 'stderr'
            };
        }
        if (result) {
            result.data['text/plain'] = result.data['text/plain'].trim();
        }
        return result;
    }
}
exports.Helpers = Helpers;
function createTemporaryFile(extension, temporaryDirectory) {
    let options = { postfix: extension };
    if (temporaryDirectory) {
        options.dir = temporaryDirectory;
    }
    return new Promise((resolve, reject) => {
        tmp.file(options, function _tempFileCreated(err, tmpFile, fd, cleanupCallback) {
            if (err) {
                return reject(err);
            }
            resolve({ filePath: tmpFile, cleanupCallback: cleanupCallback });
        });
    });
}
exports.createTemporaryFile = createTemporaryFile;
function isNotInstalledError(error) {
    return typeof (error) === 'object' && error !== null && (error.code === 'ENOENT' || error.code === 127);
}
exports.isNotInstalledError = isNotInstalledError;
//# sourceMappingURL=helpers.js.map