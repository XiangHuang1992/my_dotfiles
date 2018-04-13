/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * Shows a selection list.
 *
 * @param items An array of items, or a promise that resolves to an array of items.
 * If the promise throws, the quick picker will be canceled and an error message will be shown.
 * @param options Configures the behavior of the selection list.
 * @return A promise that resolves to the selected item
 * or `undefined` if nothing is selected
 * or `null` if error throws when resolve the items promise.
 */
async function showQuickPick(items, placeHolder) {
    const options = {
        placeHolder: placeHolder,
        matchOnDescription: true,
        matchOnDetail: true,
        onDidSelectItem: async (item) => {
            // too long to show in quickPickUp
            if (item.toString().length > 100) {
                await vscode.window.showInformationMessage(item.toString());
            }
        }
    };
    const cts = new vscode.CancellationTokenSource();
    let res = await vscode.window.showQuickPick(Promise.resolve(items).catch(async (e) => {
        cts.cancel();
        await vscode.window.showErrorMessage(e.message);
        return [];
    }), options, cts.token);
    if (cts.token.isCancellationRequested) {
        res = null;
    }
    cts.dispose();
    return res;
}
exports.showQuickPick = showQuickPick;
//# sourceMappingURL=quickPickerToolkit.js.map