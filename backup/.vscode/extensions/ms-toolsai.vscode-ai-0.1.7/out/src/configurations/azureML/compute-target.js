/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const azureMLCli_1 = require("configurations/azureML/azureMLCli");
const outputChannel_1 = require("uiToolkits/outputChannel");
const component = require("common/component");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const vscode = require("vscode");
async function getConfigurations(force, quiet) {
    if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
        if (!quiet) {
            component.get(outputChannel_1.OutputChannel).appendLine('please open a project folder');
        }
        return;
    }
    try {
        const ret = await component.get(azureMLCli_1.AzureMLCLI).getJsonCached('az ml runconfiguration list -o json', vscode.workspace.rootPath, force);
        return ret.map((x) => x.replace(/\.runconfig$/, ''));
    }
    catch (err) {
        if (!quiet) {
            component.get(outputChannel_1.OutputChannel).appendLine(err.message);
        }
    }
}
exports.getConfigurations = getConfigurations;
async function getComputeTargets() {
    try {
        return await component.get(azureMLCli_1.AzureMLCLI).getJsonCached('az ml computetarget list -o json', vscode.workspace.rootPath);
    }
    catch (e) {
        component.get(outputChannel_1.OutputChannel).appendLine(e.message);
    }
}
exports.getComputeTargets = getComputeTargets;
//# sourceMappingURL=compute-target.js.map