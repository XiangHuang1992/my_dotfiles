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
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const configurationManager_1 = require("configurationManager");
const registerProvider_1 = require("interfaces/registerProvider");
const jobPropertiesManager_1 = require("jobPropertiesManager");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
/**
 * Job Manager
 * @class JobManager
 * @implements RegisterProvider
 */
let JobManager = class JobManager {
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.submitJob', async (param = {}) => {
            await progressToolkit_1.withProgress('Submit Job', async () => this.submitJob(param));
        }), vscode.commands.registerCommand('vscodeai.listJobs', async (param = {}) => {
            await progressToolkit_1.withProgress('List Jobs', async () => this.listJobs(param));
        }), vscode.commands.registerCommand('vscodeai.showJobDetail', async (param) => {
            await progressToolkit_1.withProgress('Show Job Detail', async () => this.showJobDetail(param));
        }), vscode.commands.registerCommand('vscodeai.cancelJob', async (param) => {
            await progressToolkit_1.withProgress('Cancel Jobs', async () => this.cancelJob(param));
        }), vscode.commands.registerCommand('vscodeai.deleteJob', async (param) => {
            await progressToolkit_1.withProgress('Delete Job', async () => this.deleteJob(param));
        }), vscode.commands.registerCommand('vscodeai.saveJobLog', async (param) => {
            await progressToolkit_1.withProgress('Save Job Log', async () => this.saveJobLog(param));
        }), vscode.commands.registerCommand('vscodeai.menu.submitJob', async (uri) => {
            await vscode.commands.executeCommand('vscodeai.submitJob', { startup: uri.fsPath });
        }), vscode.commands.registerCommand('vscodeai.view.common.submitJob', async (node) => {
            await vscode.commands.executeCommand('vscodeai.submitJob', { platform: node.provider.type, config: node.config.id });
        }), vscode.commands.registerCommand('vscodeai.view.common.listJobs', async (node) => {
            await vscode.commands.executeCommand('vscodeai.listJobs', { platform: node.provider.type, config: node.config.id });
        }), vscode.commands.registerCommand('vscodeai.view.platform.listJobs', async (node) => {
            await vscode.commands.executeCommand('vscodeai.listJobs', { platform: node.provider.type });
        }));
    }
    async submitJob(param) {
        this.channel.appendLine('=== Submit Job ===');
        let provider;
        if (lodash_1.isNil(param.platform)) {
            provider = await this.configurationManager.selectProvider();
            if (lodash_1.isNil(provider)) {
                this.channel.appendLine('No platform selected. Canceled');
                return;
            }
            param.platform = provider.type;
        }
        else {
            provider = await this.configurationManager.getProvider(param.platform);
        }
        if (lodash_1.isNil(param.startup)) {
            if (!lodash_1.isNil(vscode.window.activeTextEditor)
                && (vscode.window.activeTextEditor.document.fileName.toLowerCase().endsWith('.py')
                    || vscode.window.activeTextEditor.document.fileName.toLowerCase().endsWith('.bs')
                    || vscode.window.activeTextEditor.document.fileName.toLowerCase().endsWith('.cntk'))) {
                param.startup = vscode.window.activeTextEditor.document.fileName;
            }
        }
        this.channel.appendLine('Submitting job...');
        try {
            this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'submit job', Platform: provider.type });
            await provider.jobService.submitJob(param);
            this.channel.appendLine('Submit job succeeded.');
        }
        catch (err) {
            await this.logger.error(err);
            this.channel.appendLine(`Submit job failed, error=${err}`);
        }
    }
    async listJobs(param) {
        this.channel.appendLine('=== Show Job List ===');
        let provider;
        if (lodash_1.isNil(param.platform)) {
            provider = await this.configurationManager.selectProvider((p) => !lodash_1.isNil(p.jobService.listJobs));
            if (lodash_1.isNil(provider)) {
                this.channel.appendLine('No platform selected. Canceled');
                return;
            }
            param.platform = provider.type;
        }
        else {
            provider = await this.configurationManager.getProvider(param.platform);
        }
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'list jobs', platform: provider.type });
        await provider.jobService.listJobs(param);
    }
    async showJobDetail(param) {
        this.channel.appendLine('=== Show Job Detail ===');
        const provider = await this.configurationManager.getProvider(param.platform);
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'show job details', platform: provider.type });
        await provider.jobService.showJobDetail(param);
    }
    async cancelJob(param) {
        this.channel.appendLine('=== Cancel Job ===');
        const provider = await this.configurationManager.getProvider(param.platform);
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'cancel job', platform: provider.type });
        this.channel.appendLine('Cancelling job...');
        try {
            await provider.jobService.cancelJob(param);
            this.channel.appendLine('Cancel job succeeded.');
        }
        catch (err) {
            await this.logger.error(err);
            this.channel.appendLine(`Cancel job failed, error=${err}`);
        }
    }
    async deleteJob(param) {
        this.channel.appendLine('=== Delete Job ===');
        const provider = await this.configurationManager.getProvider(param.platform);
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'delete job', platform: provider.type });
        this.channel.appendLine('Deleting job...');
        try {
            await provider.jobService.deleteJob(param);
            this.channel.appendLine('Delete job succeeded.');
        }
        catch (err) {
            await this.logger.error(err);
            this.channel.appendLine(`Delete job failed, error=${err}`);
        }
    }
    async saveJobLog(param) {
        this.channel.appendLine('=== Save Job Log ===');
        const provider = await this.configurationManager.getProvider(param.platform);
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'save job log', platform: provider.type });
        this.channel.appendLine('Saving job log...');
        try {
            await provider.jobService.saveJobLog(param);
            this.channel.appendLine('Save job log succeeded.');
        }
        catch (err) {
            await this.logger.error(err);
            void vscode.window.showErrorMessage(`Save job log failed, ${err}`);
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], JobManager.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", configurationManager_1.ConfigurationManager)
], JobManager.prototype, "configurationManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], JobManager.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], JobManager.prototype, "telemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", jobPropertiesManager_1.JobPropertiesManager)
], JobManager.prototype, "jobPropertiesManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], JobManager.prototype, "logger", void 0);
JobManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], JobManager);
exports.JobManager = JobManager;
//# sourceMappingURL=jobManager.js.map