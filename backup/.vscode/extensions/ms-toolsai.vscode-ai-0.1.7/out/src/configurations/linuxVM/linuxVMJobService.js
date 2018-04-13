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
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const querystring = require("querystring");
const tar = require("tar");
const uuid = require("uuid");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const util_1 = require("common/util");
const linuxVMConfigurationProvider_1 = require("configurations/linuxVM/linuxVMConfigurationProvider");
const linuxUtil = require("configurations/linuxVM/linuxVMUtil");
const jobPropertiesManager_1 = require("jobPropertiesManager");
const htmlPreviewerToolkit_1 = require("uiToolkits/htmlPreviewerToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
/**
 * TBD
 * @class LinuxVMJobService
 * @implements IJobService
 */
let LinuxVMJobService = class LinuxVMJobService {
    get type() {
        return 'LinuxVM';
    }
    async submitJob(param) {
        let config;
        if (lodash_1.isNil(param.config)) {
            config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).selectConfig();
            if (lodash_1.isNil(config)) {
                throw new Error('No configuration selected. Submission canceled');
            }
        }
        else {
            config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).getConfiguration(param.config);
        }
        const connectConfig = await linuxUtil.getConnectConfig(config.properties);
        const editor = new jobPropertiesManager_1.DefaultJobPropertiesEditor();
        const jobConfig = await editor.process(param.startup);
        const pattern = `{${jobConfig.job.files.includes.join(',')},.vscode/ai_job_properties.json}`;
        const projectFiles = await vscode.workspace.findFiles(pattern);
        if (projectFiles.length <= 1) {
            throw new Error('No submit files found');
        }
        const submissionId = uuid();
        const archiveFile = path.join(os.tmpdir(), `${submissionId}.tar.gz`);
        await tar.create({
            gzip: true,
            file: archiveFile,
            cwd: vscode.workspace.rootPath
        }, projectFiles.map((file) => path.relative(vscode.workspace.rootPath, file.fsPath)));
        const setupScriptPath = path.join(this.context.extensionPath, 'scripts', 'setup.sh');
        const setupScript = await fs.readFile(setupScriptPath, 'utf8');
        //Setup VM Environment
        await util_1.ssh(connectConfig, setupScript);
        //Upload job submission files
        await util_1.scp(connectConfig, archiveFile, '/tmp/aitools/jobs/submissions');
        await fs.unlink(archiveFile);
        const command = `$SHELL /tmp/aitools/jobs/.jobdistribute.3 ${submissionId} >/dev/null`;
        await util_1.ssh(connectConfig, command);
    }
    async listJobs(param) {
        let config;
        if (lodash_1.isNil(param.config)) {
            config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).selectConfig();
            if (lodash_1.isNil(config)) {
                this.outputChannel.appendLine('No configuration selected. Canceled');
                return;
            }
            param.config = config.id;
        }
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobListView?${querystring.stringify({
            title: `${config.type} Job List`,
            desc: `${config.properties.account.username}@${config.properties.address}`,
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${config.type} ${config.name} Job List`);
    }
    async showJobDetail(param) {
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobDetailView?${querystring.stringify({
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${this.type} Job Detail View`);
    }
    async cancelJob(param) {
        const config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).getConfiguration(param.config);
        const connectConfig = await linuxUtil.getConnectConfig(config.properties);
        const ret = await util_1.ssh(connectConfig, `$SHELL /tmp/aitools/jobs/.jobcancel.2 ${param.jobId}`);
        let obj;
        try {
            obj = JSON.parse(ret);
        }
        catch (e) {
            this.outputChannel.appendLine(`Parse cancel job result faild:\n${ret}\nError: ${e.message}`);
            await this.logger.error(e, ret);
            throw new Error('Can not parse cancel job result');
        }
        if (obj[0].state !== 0) {
            throw new Error('Cancel job failed');
        }
    }
    async deleteJob(param) {
        const config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).getConfiguration(param.config);
        const connectConfig = await linuxUtil.getConnectConfig(config.properties);
        const ret = await util_1.ssh(connectConfig, `$SHELL /tmp/aitools/jobs/.jobdelete.2 ${param.jobId}`);
        let obj;
        try {
            obj = JSON.parse(ret);
        }
        catch (e) {
            this.outputChannel.appendLine(`Parse delete job result faild:\n${ret}\nError: ${e.message}`);
            await this.logger.error(e, ret);
            throw new Error('Can not parse delete job result');
        }
        if (obj[0].state !== 0) {
            throw new Error('Delete job failed');
        }
    }
    async getJobList(param) {
        const config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).getConfiguration(param.config);
        const connectConfig = await linuxUtil.getConnectConfig(config.properties);
        const ret = await util_1.ssh(connectConfig, '$SHELL /tmp/aitools/jobs/.joblist.2');
        let obj;
        try {
            obj = JSON.parse(ret);
        }
        catch (e) {
            this.outputChannel.appendLine(`Parse job list faild:\n${ret}\nError: ${e.message}`);
            await this.logger.error(e, ret);
            throw new Error('Can not parse list job result');
        }
        return obj.jobs
            .filter((job) => !lodash_1.isEmpty(job.logs))
            .map((job) => {
            const postExecutionLogs = [...job.logs.filter((i) => i.state !== 'Queued' && i.state !== 'Running')];
            return {
                id: job.id,
                props: {
                    name: job.name,
                    author: job.author,
                    state: [...job.logs].pop().state,
                    command: job.command,
                    submitTime: new Date(job.logs.filter((i) => i.state === 'Queued')[0].timestamp).valueOf(),
                    startTime: new Date(job.logs.filter((i) => i.state === 'Running')[0].timestamp).valueOf(),
                    endTime: !lodash_1.isEmpty(postExecutionLogs) ? new Date(postExecutionLogs.pop().timestamp).valueOf() : null
                }
            };
        })
            .sort((x, y) => y.props.submitTime - x.props.submitTime); // submit time, desc
    }
    async getJobDetail(param) {
        const config = await component.get(linuxVMConfigurationProvider_1.LinuxVMConfigurationProvider).getConfiguration(param.config);
        const connectConfig = await linuxUtil.getConnectConfig(config.properties);
        const ret = await util_1.ssh(connectConfig, `$SHELL /tmp/aitools/jobs/.jobdetail.2 ${param.jobId}`);
        let obj;
        try {
            obj = JSON.parse(ret);
        }
        catch (e) {
            this.outputChannel.appendLine(`Parse job details faild:\n${ret}\nError: ${e.message}`);
            await this.logger.error(e, ret);
            throw new Error('Can not parse list job details result');
        }
        const job = obj.jobs[0];
        if (lodash_1.isEmpty(job.logs)) {
            throw new Error('Get job detail failed');
        }
        const postExecutionLogs = [...job.logs.filter((i) => i.state !== 'Queued' && i.state !== 'Running')];
        return {
            id: job.id,
            props: {
                name: job.name,
                author: job.author,
                state: [...job.logs].pop().state,
                command: job.command,
                submitTime: new Date(job.logs.filter((i) => i.state === 'Queued')[0].timestamp).valueOf(),
                startTime: new Date(job.logs.filter((i) => i.state === 'Running')[0].timestamp).valueOf(),
                endTime: !lodash_1.isEmpty(postExecutionLogs) ? new Date(postExecutionLogs.pop().timestamp).valueOf() : null,
                stderr: job.stderr
            }
        };
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LinuxVMJobService.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], LinuxVMJobService.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], LinuxVMJobService.prototype, "logger", void 0);
LinuxVMJobService = __decorate([
    component.Singleton
], LinuxVMJobService);
exports.LinuxVMJobService = LinuxVMJobService;
//# sourceMappingURL=linuxVMJobService.js.map