"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Logger {
    constructor() {
        this.channel = vscode.window.createOutputChannel("VS IntelliCode");
    }
    static get Instance() {
        if (!Logger.singleton) {
            Logger.singleton = new Logger();
        }
        return Logger.singleton;
    }
    write(str) {
        this.channel.appendLine(str);
    }
    formatErrorForLogging(error) {
        let message = '';
        if (typeof error === 'string') {
            message = error;
        }
        else {
            if (error.message) {
                message = `Error Message: ${error.message}`;
            }
            if (error.name && error.message.indexOf(error.name) === -1) {
                message += `, (${error.name})`;
            }
            const innerException = error.innerException;
            if (innerException && (innerException.message || innerException.name)) {
                if (innerException.message) {
                    message += `, Inner Error Message: ${innerException.message}`;
                }
                if (innerException.name && innerException.message.indexOf(innerException.name) === -1) {
                    message += `, (${innerException.name})`;
                }
            }
        }
        return message;
    }
}
exports.Logger = Logger;
const Instance = Logger.Instance;
exports.Instance = Instance;
//# sourceMappingURL=logger.js.map