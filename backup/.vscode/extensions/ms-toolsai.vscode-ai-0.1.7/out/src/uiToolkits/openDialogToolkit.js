/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
async function showOpenDialog(options, hint) {
    const browse = { title: 'Browse' };
    const selectedItem = await vscode.window.showInformationMessage(hint, browse);
    if (selectedItem !== browse) {
        return;
    }
    return vscode.window.showOpenDialog(options);
}
exports.showOpenDialog = showOpenDialog;
//# sourceMappingURL=openDialogToolkit.js.map