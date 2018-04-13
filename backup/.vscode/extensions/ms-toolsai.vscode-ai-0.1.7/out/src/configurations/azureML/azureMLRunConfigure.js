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
const vscode = require("vscode");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const component = require("common/component");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const configurationManager_1 = require("configurationManager");
const azureMLCli_1 = require("configurations/azureML/azureMLCli");
const cc = require("configurations/azureML/compute-target");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
/**
 * AzureML run configure
 */
let AzureMLRunConfigure = class AzureMLRunConfigure {
    constructor() {
        void this.logger.debug('AzureMLRunConfigure created.');
    }
    async selectRunConfiguration() {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            await vscode.window.showWarningMessage('Please open an Azure ML project folder.');
            return;
        }
        this.outputChannel.appendLine('Getting configuration list....');
        const output = await quickPickerToolkit_1.showQuickPick(cc.getConfigurations(false, false).then((configs) => {
            if (lodash_1.isNil(configs)) {
                return [];
            }
            return configs.filter((x) => !lodash_1.isEmpty(x)).map((element) => ({
                label: element,
                description: 'Run Configurations',
                context: element
            }));
        }), 'Select a Run Configuration');
        if (lodash_1.isNil(output)) {
            return;
        }
        return output.context;
    }
    async removeRunconfiguration(configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configuration', platform: 'Azure ML' });
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('please open an Azure ML project folder');
        }
        try {
            await this.azureMLCLI.getJson(`az ml runconfiguration delete -n "${configuration}" -o json`, vscode.workspace.rootPath);
            await cc.getConfigurations(true, false);
        }
        catch (e) {
            this.outputChannel.appendLine(`Remove run configuration ${configuration} failed: ${e.message}`);
            throw e;
        }
    }
    async createRunConfiguration(configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create configuration', platform: 'Azure ML' });
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('please open an Azure ML project folder');
        }
        if (lodash_1.isEmpty(configuration)) {
            configuration = await vscode.window.showInputBox({ placeHolder: 'Please input a configuration name' });
        }
        if (lodash_1.isEmpty(configuration)) {
            throw new Error('Configuration name is not correct. Create run configure canceled');
        }
        const target = await this.selectComputeTarget();
        if (lodash_1.isEmpty(target)) {
            throw new Error('Create run configure canceled');
        }
        try {
            await this.azureMLCLI.getJson(`az ml runconfiguration create -n "${configuration}" -t "${target}" -o json`, vscode.workspace.rootPath);
        }
        catch (e) {
            this.outputChannel.appendLine(`Create run configuration ${configuration} failed: ${e.message}`);
            throw e;
        }
        const fileName = path.join(vscode.workspace.rootPath, 'aml_config', `${configuration}.runconfig`);
        const ret = await component.get(editorToolkit_1.EditorToolkit).editFile(vscode.Uri.file(fileName), 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', undefined, true);
        if (ret.continue) {
            await cc.getConfigurations(true, false);
            return configuration;
        }
        else {
            await this.removeRunconfiguration(configuration);
            throw new Error('Create run configuration canceled.');
        }
    }
    async selectComputeTarget() {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('please open an Azure ML project folder');
        }
        this.outputChannel.appendLine('Getting compute target list....');
        const output = await quickPickerToolkit_1.showQuickPick(cc.getComputeTargets().then((targets) => {
            if (lodash_1.isEmpty(targets)) {
                throw new Error('No compute target exist, please attach a compute taget (by az ml compute target create)');
            }
            return targets.filter((x) => !lodash_1.isEmpty(x)).map((element) => ({
                label: element,
                description: 'Compute Targets',
                context: element
            }));
        }), 'Select a Compute Target');
        if (!lodash_1.isNil(output)) {
            return output.context;
        }
        return null;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", azureMLCli_1.AzureMLCLI)
], AzureMLRunConfigure.prototype, "azureMLCLI", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLRunConfigure.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], AzureMLRunConfigure.prototype, "telemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", configurationManager_1.ConfigurationManager)
], AzureMLRunConfigure.prototype, "configurationManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], AzureMLRunConfigure.prototype, "logger", void 0);
AzureMLRunConfigure = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], AzureMLRunConfigure);
exports.AzureMLRunConfigure = AzureMLRunConfigure;
//# sourceMappingURL=azureMLRunConfigure.js.map