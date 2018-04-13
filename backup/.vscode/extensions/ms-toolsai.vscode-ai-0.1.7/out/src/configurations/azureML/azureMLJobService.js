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
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const moment = require("moment");
const path = require("path");
const querystring = require("querystring");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const util_1 = require("common/util");
const azureMLCli_1 = require("configurations/azureML/azureMLCli");
const azureMLConfigurationProvider_1 = require("configurations/azureML/azureMLConfigurationProvider");
const azureMLRunConfigure_1 = require("configurations/azureML/azureMLRunConfigure");
const jobPropertiesManager_1 = require("jobPropertiesManager");
const htmlPreviewerToolkit_1 = require("uiToolkits/htmlPreviewerToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
/**
 * AzureML job service
 */
let AzureMLJobService = class AzureMLJobService {
    constructor() {
        return;
    }
    get type() {
        return 'AzureML';
    }
    async submitJob(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('Please open an Azure ML project folder first.');
        }
        let config = param.config;
        if (lodash_1.isNil(config)) {
            const configObj = await component.get(azureMLConfigurationProvider_1.AzureMLConfigurationProvider).selectConfig();
            if (lodash_1.isNil(configObj)) {
                throw new Error('No AzureML run configuration selected, submission canceled');
            }
            else {
                config = configObj.name;
            }
        }
        const editor = new jobPropertiesManager_1.DefaultJobPropertiesEditor();
        const jobConfig = await editor.process(param.startup);
        let startup = jobConfig.job.startupScript;
        if (path.isAbsolute(startup)) {
            startup = path.relative(vscode.workspace.rootPath, startup);
        }
        let args = jobConfig.job.arguments;
        if (lodash_1.isNil(args)) {
            args = '';
        }
        //Always run in a new terminal
        await this.azureMLCLI.openCli();
        await this.azureMLCLI.sendToCli(`az ml experiment submit -c "${config}" "${startup}" ${args}`);
    }
    async listJobs(param) {
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobListView?${querystring.stringify({
            title: `${this.type} Job List`,
            desc: '',
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${this.type} Job List View`);
    }
    async showJobDetail(param) {
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobDetailView?${querystring.stringify({
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${this.type} Job Detail View`);
    }
    async cancelJob(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            await vscode.window.showWarningMessage('Please open an Azure ML project folder first.');
            return;
        }
        const target = await this.azureMLRunConfigure.selectComputeTarget();
        if (lodash_1.isEmpty(target)) {
            throw new Error('No Target Select');
        }
        try {
            await this.azureMLCLI.runInProcess(`az ml experiment cancel -r "${param.jobId}" -t "${target}"`, vscode.workspace.rootPath);
        }
        catch (e) {
            this.outputChannel.appendLine(`Cancel experiment ${param.jobId}:${target} failed: ${e.message}`);
            throw e;
        }
    }
    async deleteJob(param) {
        throw Error('Not supported');
    }
    async getJobList(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            void vscode.window.showWarningMessage('Please open an Azure ML project folder.');
            return [];
        }
        let jsonObjs;
        try {
            jsonObjs = await this.azureMLCLI.getJson('az ml history list -o json', vscode.workspace.rootPath);
        }
        catch (e) {
            this.outputChannel.appendLine(`List history failed: ${e.message}`);
            throw e;
        }
        const whiteList = new Set([
            'completed',
            'canceled',
            'failed'
        ]);
        return jsonObjs.map((job) => {
            let startTime = null;
            let endTime = null;
            if (!lodash_1.isEmpty(job.created_utc)) {
                const date = new Date(job.created_utc);
                if (!lodash_1.isNaN(date.valueOf())) {
                    startTime = date.valueOf();
                    if (!lodash_1.isEmpty(job.duration) && whiteList.has(job.status.toLowerCase())) {
                        endTime = moment(date).add(moment.duration(job.duration)).valueOf();
                    }
                }
            }
            return {
                id: job.run_id,
                props: {
                    runID: job.run_id,
                    state: job.status,
                    command: job.script_name,
                    startTime: startTime,
                    endTime: endTime
                }
            };
        });
    }
    async getJobDetail(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            void vscode.window.showWarningMessage('Please open an Azure ML project folder first.');
            return;
        }
        let jsonObj;
        try {
            jsonObj = await this.azureMLCLI.getJson(`az ml history info -r "${param.jobId}" -o json`, vscode.workspace.rootPath);
        }
        catch (e) {
            this.outputChannel.appendLine(`Parse history info failed: ${e.message}`);
            throw e;
        }
        const files = jsonObj.attachments.split(',').map((x) => x.trim()).filter((x) => x !== '');
        return {
            id: jsonObj.run_id,
            attachments: files.map((x) => ({
                name: x,
                flags: {
                    save: true,
                    preview: true
                }
            })),
            props: {
                runID: jsonObj.run_id,
                name: jsonObj.name,
                author: jsonObj.user_id,
                state: jsonObj.status,
                command: `(${jsonObj.target}) ${jsonObj.script_name}`,
                submitTime: !lodash_1.isEmpty(jsonObj.created_utc) ? new Date(jsonObj.created_utc).valueOf() : null,
                startTime: !lodash_1.isEmpty(jsonObj.start_time_utc) ? new Date(jsonObj.start_time_utc).valueOf() : null,
                endTime: !lodash_1.isEmpty(jsonObj.end_time_utc) ? new Date(jsonObj.end_time_utc).valueOf() : null
            }
        };
    }
    async getJobLog(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            await vscode.window.showWarningMessage('Please open a AML project folder first.');
            return '';
        }
        try {
            return (await this.azureMLCLI.runInProcess(`az ml history info -r "${param.jobId}" --artifact "${param.logName}"`, vscode.workspace.rootPath)).stdout;
        }
        catch (e) {
            const errorMessage = `Can not preview this file ${e.message}`;
            this.outputChannel.appendLine(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async saveJobLog(param) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            await vscode.window.showWarningMessage('Please open a AML project folder first.');
            return;
        }
        let cmd;
        if (!lodash_1.isEmpty(param.logName)) {
            cmd = `az ml history download --overwrite -r "${param.jobId}" --artifact "${param.logName}" -d artifacts/${param.jobId}`;
        }
        else {
            cmd = `az ml history download --overwrite -r "${param.jobId}" -d artifacts/${param.jobId}`;
        }
        await this.azureMLCLI.runInProcess(cmd, vscode.workspace.rootPath);
        if (!lodash_1.isEmpty(param.logName)) {
            // tslint:disable-next-line:max-line-length
            await vscode.window.showInformationMessage(`${param.logName} has been saved in 'artifacts/${param.jobId}' under current folder`);
        }
        else {
            await vscode.window.showInformationMessage(`All logs have been saved in 'artifacts/${param.jobId}' under current folder`);
        }
    }
    getTime(time) {
        const hms = time.split(':');
        return (Number(hms[0]) * 3600 + Number(hms[1]) * 60 + Number(hms[2])) * 1000;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], AzureMLJobService.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", azureMLCli_1.AzureMLCLI)
], AzureMLJobService.prototype, "azureMLCLI", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", azureMLRunConfigure_1.AzureMLRunConfigure)
], AzureMLJobService.prototype, "azureMLRunConfigure", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLJobService.prototype, "outputChannel", void 0);
AzureMLJobService = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], AzureMLJobService);
exports.AzureMLJobService = AzureMLJobService;
//# sourceMappingURL=azureMLJobService.js.map