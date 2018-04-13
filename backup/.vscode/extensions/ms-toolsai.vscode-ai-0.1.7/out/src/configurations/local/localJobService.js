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
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const localConfigurationProvider_1 = require("configurations/local/localConfigurationProvider");
const localEnvCli_1 = require("configurations/local/localEnvCli");
const outputChannel_1 = require("uiToolkits/outputChannel");
const jobPropertiesManager_1 = require("jobPropertiesManager");
/**
 * Local job service
 */
let LocalJobService = class LocalJobService {
    constructor() {
        void this.logger.debug('LocalJobService created');
    }
    get type() {
        return 'Local';
    }
    async submitJob(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath)) {
            throw new Error('Please open a folder.');
        }
        let config = null;
        if (lodash_1.isNil(param.config)) {
            config = await component.get(localConfigurationProvider_1.LocalConfigurationProvider).selectConfig();
            if (lodash_1.isNil(config)) {
                throw new Error('No configuration selected. Submission canceled');
            }
        }
        else {
            config = await component.get(localConfigurationProvider_1.LocalConfigurationProvider).getConfiguration(param.config);
        }
        const editor = new jobPropertiesManager_1.DefaultJobPropertiesEditor();
        const jobConfig = await editor.process(param.startup);
        let cwd = jobConfig.job.workingDirectory;
        if (lodash_1.isEmpty(cwd)) {
            cwd = vscode.workspace.rootPath;
        }
        if (!path.isAbsolute(cwd)) {
            cwd = path.join(vscode.workspace.rootPath, cwd);
        }
        let submitCmd;
        let parameter = '';
        if (os.platform() === 'win32') {
            parameter = '/d ';
        }
        //CNTK case
        if (jobConfig.job.startupScript.toLowerCase().endsWith('.cntk')
            || jobConfig.job.startupScript.toLowerCase().endsWith('.bs')) {
            const cntkPath = path.join(config.properties.cntkPath, jobConfig.job.startupCommand);
            submitCmd = `cd ${parameter}${cwd} & ${cntkPath} configFile=${jobConfig.job.startupScript} ${jobConfig.job.arguments}`;
        }
        else if (jobConfig.job.startupScript.toLowerCase().endsWith('.py')) {
            this.localEnvCLI.pythonPath = config.properties.pythonPath;
            await this.localEnvCLI.setupScriptFile();
            submitCmd = `cd ${parameter}${cwd} & ${jobConfig.job.startupCommand} ${jobConfig.job.startupScript} ${jobConfig.job.arguments}`;
        }
        else {
            submitCmd = `cd ${parameter}${cwd} & ${jobConfig.job.startupCommand} ${jobConfig.job.startupScript} ${jobConfig.job.arguments}`;
        }
        if (vscode.workspace.getConfiguration('ai.submission').get('always-open-jobproperties') !== true) {
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('Submission parameters and properties can be set in .vscode/ai_job_properties.json');
            this.outputChannel.appendLine('');
        }
        await this.localEnvCLI.openCli();
        await this.localEnvCLI.sendToCli(submitCmd);
    }
    async cancelJob(param) {
        await vscode.window.showInformationMessage('Operation not supported');
        throw new Error('Not supported');
    }
    async deleteJob(param) {
        await vscode.window.showInformationMessage('Operation not supported');
        throw new Error('Not supported');
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LocalJobService.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", localEnvCli_1.LocalEnvCLI)
], LocalJobService.prototype, "localEnvCLI", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], LocalJobService.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], LocalJobService.prototype, "logger", void 0);
LocalJobService = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], LocalJobService);
exports.LocalJobService = LocalJobService;
//# sourceMappingURL=localJobService.js.map