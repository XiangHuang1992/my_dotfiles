/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const copypaste = require("copy-paste");
const fkill = require("fkill");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const open = require("open");
const path = require("path");
const rl = require("readline");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const util_1 = require("common/util");
const azureMLCli_1 = require("configurations/azureML/azureMLCli");
const constants = require("extensionConstants");
const registerProvider_1 = require("interfaces/registerProvider");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
/**
 * Function is automatically called by VS Code. It's job is to register commands with the environment.
 * context A variable which represents the environment and allows the extension to register new commands
 * and operations.
 * @class AzureActivate
 * @implements RegisterProvider
 */
let AzureActivate = class AzureActivate {
    async register() {
        try {
            const packageFile = path.join(this.context.extensionPath, 'package.json');
            setUpCommands(this.context, (await fs.readJson(packageFile)).contributes.commands);
        }
        catch (e) {
            throw new Error('Can not parse package.json and register commands. Please reinstall VS Code Tools for AI');
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], AzureActivate.prototype, "context", void 0);
AzureActivate = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], AzureActivate);
exports.AzureActivate = AzureActivate;
// if the cli is installed, runs a function that executes the desired funcitonality of the command
function setUpCommands(context, cliCommands) {
    for (const cliCommand of cliCommands) {
        if (cliCommand.command.startsWith('vscodeai.azureml.')) {
            context.subscriptions.push(vscode.commands.registerCommand(cliCommand.command, async () => {
                if (await checkInstalled()) {
                    await executeCommand(context.extensionPath, cliCommand);
                }
            }));
        }
    }
}
// executes the desired functionality given a cli command
async function executeCommand(extensionPath, cliCommand) {
    switch (cliCommand.command) {
        case 'vscodeai.azureml.openTerminal':
            await progressToolkit_1.withProgress('AzureML Open Terminal', async () => component.get(azureMLCli_1.AzureMLCLI).openCli());
            break;
        case 'vscodeai.azureml.setSubscription':
            await progressToolkit_1.withProgress('AzureML Set Subscription', async () => setSubscription());
            break;
        case 'vscodeai.azureml.login':
            await progressToolkit_1.withProgress('AzureML Login', async () => login());
            break;
        case 'vscodeai.azureml.logout':
            await progressToolkit_1.withProgress('AzureML Logout', async () => logout());
            break;
        case 'vscodeai.azureml.installWorkbench':
            void vscode.window.showWarningMessage('You have installed azure ml workbench.');
            break;
        default:
            if (!lodash_1.isEmpty(cliCommand.cli_command)) {
                await progressToolkit_1.withProgress(`AzureML ${cliCommand.cli_command}`, async () => component.get(azureMLCli_1.AzureMLCLI).sendToCli(`az ${cliCommand.cli_command}`));
            }
            break;
    }
}
let installed = false;
// checks to see if the cli is installed before running commands
async function checkInstalled() {
    if (installed) {
        return true;
    }
    installed = await component.get(azureMLCli_1.AzureMLCLI).checkCommand('az ml -h');
    if (!installed) {
        const ret = await vscode.window.showWarningMessage('Please install the azure ml workbench to enable azure ml feature of this extension.', 'Install');
        if (ret === 'Install') {
            install();
        }
    }
    return installed;
}
exports.checkInstalled = checkInstalled;
async function setSubscription() {
    const subscription = await quickPickerToolkit_1.showQuickPick(getSubscriptions().then(async (res) => res.map((s) => ({
        label: s.id,
        description: s.name,
        context: s
    }))), 'Select one subscription');
    if (lodash_1.isNil(subscription)) {
        return;
    }
    try {
        await component.get(azureMLCli_1.AzureMLCLI).getJson(`az account set -s ${subscription.context.id} -o json`);
        component.get(azureMLCli_1.AzureMLCLI).clearCache();
        void vscode.window.showInformationMessage(`Subscription: ${subscription.context.name}:${subscription.context.id} set successfully`);
    }
    catch (e) {
        void vscode.window.showErrorMessage(`Can not set subscription: ${e.message}`);
    }
}
async function getSubscriptions() {
    try {
        return component.get(azureMLCli_1.AzureMLCLI).getJsonCached('az account list -o json');
    }
    catch (e) {
        throw new Error(`Can not list azure account: ${e.message}`);
    }
}
async function showDeviceCodeMessage(msg) {
    const matches = msg.match(/open the page\s*([^\s]*)\s*and enter the code\s*(\w*)/);
    const url = matches[1];
    const code = matches[2];
    const copyAndOpenItem = { title: 'Copy & Open' };
    const openItem = { title: 'Open' };
    const cancelItem = { title: 'Cancel', isCloseAffordance: true };
    const canCopy = process.platform !== 'linux' || (await util_1.exec('xclip -version')).code === 0;
    return vscode.window.showInformationMessage(msg, canCopy ? copyAndOpenItem : openItem, cancelItem).then(async (response) => {
        if (response === copyAndOpenItem) {
            open(url);
            copypaste.copy(code);
            return true;
        }
        else if (response === open) {
            open(url);
            return showDeviceCodeMessage(msg);
        }
        else {
            return false;
        }
    });
}
async function login() {
    try {
        const p = await component.get(azureMLCli_1.AzureMLCLI).spawnInProcess('az login');
        const timeout = vscode.workspace.getConfiguration('ai.azureml').get('login-timeout');
        const processMonitor = Promise.race([
            new Promise((resolve, reject) => {
                p.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(new Error(`exitcode: ${code}`));
                    }
                });
            }),
            util_1.delay(timeout * 1000).then(() => {
                throw new Error(`timeout: no response in ${timeout} seconds`);
            })
        ]);
        const stderr = rl.createInterface(p.stderr);
        let loginInfo = await new Promise((resolve) => {
            stderr.once('line', (line) => {
                resolve(line);
            });
        });
        loginInfo = loginInfo.replace(/^\w+\:\s*/, '');
        if (!await showDeviceCodeMessage(loginInfo)) {
            await fkill(p.pid, { force: true });
            await processMonitor.catch(() => { return; });
            return;
        }
        try {
            await processMonitor;
        }
        catch (e) {
            await fkill(p.pid, { force: true }).catch(() => { return; });
            throw e;
        }
        component.get(azureMLCli_1.AzureMLCLI).clearCache();
        const select = { title: 'Set Subscription' };
        void vscode.window.showInformationMessage('AzureML login succesfully', select).then(async (response) => {
            if (response === select) {
                void vscode.commands.executeCommand('vscodeai.azureml.setSubscription');
            }
        });
    }
    catch (e) {
        void vscode.window.showErrorMessage(`AzureML login Failed: ${e.message}`);
    }
}
async function logout() {
    try {
        await component.get(azureMLCli_1.AzureMLCLI).getJson('az logout -o json');
        component.get(azureMLCli_1.AzureMLCLI).clearCache();
        void vscode.window.showInformationMessage('AzureML logout succesfully');
    }
    catch (e) {
        void vscode.window.showErrorMessage(`AzureML logout failed: ${e.message}`);
    }
}
function install() {
    open(constants.azureMLWorkbenchInstallUrl);
    component.get(outputChannel_1.OutputChannel).appendLine(
    // tslint:disable-next-line:max-line-length
    `Please click to open ${constants.azureMLWorkbenchInstallUrl} and follow the instruction to install Azure Machine Learning Workbench`);
}
//# sourceMappingURL=azureMLActivate.js.map