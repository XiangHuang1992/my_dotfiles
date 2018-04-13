/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * Progress toolkit
 */
async function withProgress(msg, func) {
    return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, async (progress) => {
        progress.report({ message: `AI: ${msg}` });
        return await func();
    });
}
exports.withProgress = withProgress;
//# sourceMappingURL=progressToolkit.js.map