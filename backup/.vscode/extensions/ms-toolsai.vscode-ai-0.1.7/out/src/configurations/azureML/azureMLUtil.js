/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
function getAzureMLWorkbenchPath() {
    const configPath = vscode.workspace.getConfiguration('ai.azureml').get('workbench-path');
    if (!lodash_1.isEmpty(configPath)) {
        return configPath;
    }
    else {
        if (os.platform() === 'win32') {
            return path.join(process.env.LOCALAPPDATA, 'AmlWorkbench');
        }
        else if (os.platform() === 'darwin') {
            return path.join(process.env.HOME, 'Library', 'Caches', 'AmlWorkbench');
        }
    }
}
exports.getAzureMLWorkbenchPath = getAzureMLWorkbenchPath;
function getAzureMLWorkbenchPythonPath() {
    const base = getAzureMLWorkbenchPath();
    if (os.platform() === 'win32') {
        return path.join(base, 'Python');
    }
    else if (os.platform() === 'darwin') {
        return path.join(base, 'Python', 'bin');
    }
}
exports.getAzureMLWorkbenchPythonPath = getAzureMLWorkbenchPythonPath;
function getAzureMLWorkbenchCLIPath() {
    const base = getAzureMLWorkbenchPath();
    if (os.platform() === 'win32') {
        return path.join(base, 'Python', 'Scripts');
    }
    else if (os.platform() === 'darwin') {
        return path.join(base, 'Python', 'bin');
    }
}
exports.getAzureMLWorkbenchCLIPath = getAzureMLWorkbenchCLIPath;
//# sourceMappingURL=azureMLUtil.js.map