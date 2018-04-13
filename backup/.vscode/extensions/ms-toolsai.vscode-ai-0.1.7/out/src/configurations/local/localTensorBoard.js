/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
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
const lodash_1 = require("lodash");
const open = require("open");
const portfinder = require("portfinder");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const util_1 = require("common/util");
const localConfigurationProvider_1 = require("configurations/local/localConfigurationProvider");
const localEnvCli_1 = require("configurations/local/localEnvCli");
const registerProvider_1 = require("interfaces/registerProvider");
const htmlPreviewerToolkit_1 = require("uiToolkits/htmlPreviewerToolkit");
const openDialogToolkit_1 = require("uiToolkits/openDialogToolkit");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
/**
 * Local Debugger Configuration
 */
let LocalTensorBoard = class LocalTensorBoard {
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.local.openTensorBoard', async () => {
            await progressToolkit_1.withProgress('Local - Open TensorBoard', async () => this.openTensorboard());
        }));
    }
    async openTensorboard() {
        const config = await quickPickerToolkit_1.showQuickPick(this.provider.getAllConfigurations().then((res) => res.map((x) => ({
            label: x.name,
            description: x.description,
            context: x
        }))), `Select configuration for ${this.provider.type}`);
        if (lodash_1.isNil(config)) {
            return;
        }
        const folders = vscode.workspace.workspaceFolders;
        const logPath = await openDialogToolkit_1.showOpenDialog({
            defaultUri: lodash_1.isEmpty(folders) ? null : folders[0].uri,
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Tensorflow Log Folder'
        }, 'Please select tensorflow log path');
        if (lodash_1.isEmpty(logPath)) {
            return;
        }
        const cli = component.get(localEnvCli_1.LocalEnvCLI);
        cli.pythonPath = config.context.properties.pythonPath;
        await util_1.delay(500);
        await cli.setupScriptFile();
        const port = await portfinder.getPortPromise({ port: 6006 });
        await cli.openCli();
        await cli.sendToCli(`tensorboard --logdir "${logPath[0].fsPath}" --port ${port}`);
        await util_1.delay(2000);
        open(`http://localhost:${port}`);
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LocalTensorBoard.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", htmlPreviewerToolkit_1.HTMLPreviewerToolkit)
], LocalTensorBoard.prototype, "htmlPreview", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", localConfigurationProvider_1.LocalConfigurationProvider)
], LocalTensorBoard.prototype, "provider", void 0);
LocalTensorBoard = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], LocalTensorBoard);
exports.LocalTensorBoard = LocalTensorBoard;
//# sourceMappingURL=localTensorBoard.js.map