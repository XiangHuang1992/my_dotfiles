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
const path = require("path");
const querystring = require("querystring");
const request = require("superagent");
const vscode = require("vscode");
const component = require("common/component");
const telemetryManager_1 = require("common/telemetryManager");
const util_1 = require("common/util");
const batchAIConfigurationProvider_1 = require("configurations/batchAI/batchAIConfigurationProvider");
const batchAIJobProperties_1 = require("configurations/batchAI/batchAIJobProperties");
const batchUtil = require("configurations/batchAI/batchAIUtil");
const htmlPreviewerToolkit_1 = require("uiToolkits/htmlPreviewerToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
/**
 * TBD
 * @class BatchAIJobService
 * @implements IJobService
 */
let BatchAIJobService = class BatchAIJobService {
    get type() {
        return 'BatchAI';
    }
    async submitJob(param) {
        let config;
        if (lodash_1.isNil(param.config)) {
            config = await component.get(batchAIConfigurationProvider_1.BatchAIConfigurationProvider).selectConfig();
            if (lodash_1.isNil(config)) {
                throw new Error('No cluster selected, submission canceled');
            }
        }
        else {
            config = await component.get(batchAIConfigurationProvider_1.BatchAIConfigurationProvider).getConfiguration(param.config);
        }
        const editor = new batchAIJobProperties_1.BatchAIJobPropertiesEditor(config);
        const jobConfig = await editor.process(param.startup);
        const cluster = config.properties;
        const group = batchUtil.getResourceGroupFromId(cluster.id);
        const batchJobConfig = jobConfig.platform[this.type];
        if (!lodash_1.isNil(batchJobConfig.autoUpload)) {
            await this.prepareJobFiles(config, jobConfig);
        }
        this.channel.appendLine('Batch AI Submitting job...');
        await batchUtil.getBatchAIClient().jobs.create(group, batchJobConfig.jobName, batchJobConfig.jobCreateParam);
    }
    async listJobs(param) {
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobListView?${querystring.stringify({
            title: `${this.type} Job List`,
            desc: '',
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${this.type} Job List`);
    }
    async showJobDetail(param) {
        await component.get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit).open(`vscodeai://authority/page/jobDetailView?${querystring.stringify({
            env: util_1.btoa(JSON.stringify(param))
        })}`, `${this.type} Job Detail View`);
    }
    async cancelJob(param) {
        await batchUtil.getBatchAIClient().jobs.terminate(batchUtil.getResourceGroupFromId(param.jobId), batchUtil.getJobNameFromId(param.jobId));
    }
    async deleteJob(param) {
        await batchUtil.getBatchAIClient().jobs.deleteMethod(batchUtil.getResourceGroupFromId(param.jobId), batchUtil.getJobNameFromId(param.jobId));
    }
    async getJobList(param) {
        const list = await batchUtil.getBatchAIClient().jobs.list();
        return list.map((x) => ({
            id: x.id,
            props: {
                jobName: x.name,
                state: lodash_1.startCase(x.executionState),
                submitTime: x.creationTime.valueOf(),
                startTime: lodash_1.isNil(x.executionInfo) || lodash_1.isNil(x.executionInfo.startTime) ? null : x.executionInfo.startTime.valueOf(),
                endTime: lodash_1.isNil(x.executionInfo) || lodash_1.isNil(x.executionInfo.endTime) ? null : x.executionInfo.endTime.valueOf()
            }
        })).sort((a, b) => b.props.submitTime - a.props.submitTime); // submit time, desc
    }
    async getJobDetail(param) {
        const client = batchUtil.getBatchAIClient();
        const x = await client.jobs.get(batchUtil.getResourceGroupFromId(param.jobId), batchUtil.getJobNameFromId(param.jobId));
        let startTime = null;
        let endTime = null;
        let errors = '';
        if (!lodash_1.isNil(x.executionInfo)) {
            if (!lodash_1.isNil(x.executionInfo.startTime)) {
                startTime = x.executionInfo.startTime.valueOf();
            }
            if (!lodash_1.isNil(x.executionInfo.endTime)) {
                endTime = x.executionInfo.endTime.valueOf();
            }
            if (!lodash_1.isEmpty(x.executionInfo.errors)) {
                errors = x.executionInfo.errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
            }
        }
        let attachments;
        try {
            const fileList = await client.jobs.listOutputFiles(batchUtil.getResourceGroupFromId(param.jobId), x.name, {
                outputdirectoryid: 'stdOuterr'
            });
            attachments = fileList.map((f) => ({
                name: this.clearPrefix(f.name),
                flags: {
                    save: true,
                    preview: false
                }
            }));
        }
        catch (_a) {
            // pass
        }
        return {
            id: x.id,
            props: {
                jobName: x.name,
                state: lodash_1.startCase(x.executionState),
                submitTime: x.creationTime.valueOf(),
                startTime,
                endTime,
                errors
            },
            attachments
        };
    }
    async saveJobLog(param) {
        const fileList = await batchUtil.getBatchAIClient().jobs.listOutputFiles(batchUtil.getResourceGroupFromId(param.jobId), batchUtil.getJobNameFromId(param.jobId), {
            outputdirectoryid: 'stdOuterr'
        });
        if (!lodash_1.isEmpty(param.logName)) {
            const target = fileList.find((x) => this.clearPrefix(x.name) === param.logName);
            if (lodash_1.isNil(target)) {
                throw new Error('File not found');
            }
            const savePath = await vscode.window.showSaveDialog({
                defaultUri: !lodash_1.isNil(vscode.workspace.rootPath)
                    ? vscode.Uri.file(path.join(vscode.workspace.rootPath, param.logName))
                    : null
            });
            if (lodash_1.isNil(savePath)) {
                throw new Error('Save Job Output Canceled');
            }
            await this.download(target.downloadUrl, savePath.fsPath);
        }
        else {
            const saveFolder = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                defaultUri: !lodash_1.isNil(vscode.workspace.rootPath) ? vscode.Uri.file(vscode.workspace.rootPath) : null
            });
            if (lodash_1.isEmpty(saveFolder)) {
                throw new Error('Save Job Output Canceled');
            }
            await Promise.all(fileList.map(async (file) => this.download(file.downloadUrl, path.join(saveFolder[0].fsPath, this.clearPrefix(file.name)))));
        }
        if (!lodash_1.isEmpty(param.logName)) {
            await vscode.window.showInformationMessage(`${param.logName} has been saved.`);
        }
        else {
            await vscode.window.showInformationMessage('All output have been saved.');
        }
    }
    async download(url, target) {
        const res = await request.get(url).buffer(true);
        await fs.writeFile(target, res.body);
    }
    async prepareJobFiles(config, jobConfig) {
        const cluster = config.properties;
        const param = jobConfig.platform[this.type];
        const mountPath = path.posix.relative(batchUtil.mountRoot, param.autoUpload.path);
        const fsGetResult = await batchUtil.getFileSytemFromMountPath(cluster.nodeSetup.mountVolumes, mountPath);
        this.telemetryManager.enqueueTelemetryMsg('AutoUpload', { platform: 'Batch AI', storage: fsGetResult.type });
        this.channel.appendLine('Auto uploading...');
        const filesystem = fsGetResult.fs;
        const rootDir = fsGetResult.relativePath;
        await filesystem.mkdir_r(rootDir);
        const pattern = `{${jobConfig.job.files.includes.join(',')}}`;
        const projectFiles = await vscode.workspace.findFiles(pattern);
        const createdDir = new Set();
        for (const filePath of projectFiles) {
            const relative = path.relative(vscode.workspace.rootPath, filePath.fsPath);
            const splited = relative.split(path.sep);
            const filename = splited.pop();
            let currentDir = rootDir;
            for (const segment of splited) {
                currentDir = path.posix.join(currentDir, segment);
                if (!createdDir.has(currentDir)) {
                    createdDir.add(currentDir);
                    await filesystem.mkdir(currentDir);
                }
            }
            await filesystem.upload(currentDir, filename, filePath.fsPath);
        }
        this.channel.appendLine('Auto upload finished.');
    }
    clearPrefix(dir) {
        const uuidReg = '(\\w{8}(-\\w{4}){3}-\\w{12}?)';
        const reg = new RegExp(`^${uuidReg}/[\\w-]*/jobs/[\\w-]*/${uuidReg}/`);
        return dir.replace(reg, '');
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], BatchAIJobService.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], BatchAIJobService.prototype, "telemetryManager", void 0);
BatchAIJobService = __decorate([
    component.Singleton
], BatchAIJobService);
exports.BatchAIJobService = BatchAIJobService;
//# sourceMappingURL=batchAIJobService.js.map