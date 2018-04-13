/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path = require("path");
const unixify = require("unixify");
const uuid = require("uuid");
const vscode = require("vscode");
const batchUtil = require("configurations/batchAI/batchAIUtil");
const jobPropertiesManager_1 = require("jobPropertiesManager");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const inputDirectoryID = 'AISCRIPTS';
const skipKey = 'Skip Auto Upload';
/**
 * Batch AI Job Proeprties Editor
 */
class BatchAIJobPropertiesEditor extends jobPropertiesManager_1.DefaultJobPropertiesEditor {
    constructor(config) {
        super();
        this.needCheck = false;
        this.config = config;
        this.init = this.init.bind(this);
        this.validate = this.validate.bind(this);
    }
    get type() {
        return 'BatchAI';
    }
    get cluster() {
        return this.config.properties;
    }
    async init(startup) {
        const jobConfig = await super.init(startup);
        if (lodash_1.isNil(jobConfig.platform[this.type])) {
            jobConfig.platform[this.type] = {
                jobCreateParam: {
                    experimentName: jobConfig.job.name,
                    priority: 0,
                    nodeCount: 1
                }
            };
        }
        if (lodash_1.isNil(jobConfig.platform[this.type].jobCreateParam)) {
            jobConfig.platform[this.type].jobCreateParam = {
                experimentName: jobConfig.job.name,
                priority: 0,
                nodeCount: 1
            };
        }
        const param = jobConfig.platform[this.type];
        param.jobName = `${jobConfig.job.name}_${uuid()}`;
        param.jobCreateParam.location = this.cluster.location;
        param.jobCreateParam.cluster = {
            id: this.cluster.id
        };
        jobConfig.platform[this.type] = param;
        if (lodash_1.isEmpty(jobConfig.job.startupScript)) {
            jobConfig.job.startupScript = await vscode.window.showInputBox({ placeHolder: 'Please input a startup script' });
            if (lodash_1.isEmpty(jobConfig.job.startupScript)) {
                throw new Error('Invalid startup script. BatchAI job submission canceled.');
            }
        }
        if (!this.checkToolkit(param)) {
            await this.selectToolkit(jobConfig);
            this.needCheck = true;
        }
        if (!this.checkAutoUpload(param)) {
            await this.selectAutoUpload(param);
            this.needCheck = true;
        }
        if (!lodash_1.isNil(param.autoUpload)) {
            this.updateAutoUploadPath(param);
            this.needCheck = true;
        }
        return jobConfig;
    }
    async validate(prop) {
        if (this.needCheck) {
            this.needCheck = false;
            return {
                valid: false,
                reason: 'The BatchAI job config is generated.'
            };
        }
        const config = prop.platform[this.type];
        if (lodash_1.isEmpty(config.jobCreateParam.stdOutErrPathPrefix)) {
            return {
                valid: false,
                reason: 'stdOutErrPathPrefix should not be empty'
            };
        }
        if (!this.checkAutoUpload(config)) {
            return {
                valid: false,
                reason: 'Invalid auto upload config.'
            };
        }
        if (!this.checkToolkit(config)) {
            return {
                valid: false,
                reason: 'No toolkit selected.'
            };
        }
        return { valid: true };
    }
    checkToolkit(param) {
        if (lodash_1.isNil(param) || lodash_1.isNil(param.jobCreateParam)) {
            return false;
        }
        if (!lodash_1.isNil(param.jobCreateParam.cntkSettings)) {
            return true;
        }
        if (!lodash_1.isNil(param.jobCreateParam.tensorFlowSettings)) {
            return true;
        }
        if (!lodash_1.isNil(param.jobCreateParam.caffeSettings)) {
            return true;
        }
        if (!lodash_1.isNil(param.jobCreateParam.caffe2Settings)) {
            return true;
        }
        if (!lodash_1.isNil(param.jobCreateParam.chainerSettings)) {
            return true;
        }
        if (!lodash_1.isNil(param.jobCreateParam.customToolkitSettings)) {
            return true;
        }
        return false;
    }
    // tslint:disable-next-line
    async selectToolkit(jobConfig) {
        const item = await quickPickerToolkit_1.showQuickPick(['cntk-python', 'cntk-brainscript', 'tensorflow', 'caffe', 'caffe2', 'chainer', 'custom'], 'Please select a toolkit');
        const param = jobConfig.platform[this.type];
        param.jobCreateParam.stdOutErrPathPrefix = '';
        let startupScript = jobConfig.job.startupScript;
        if (path.isAbsolute(startupScript)) {
            startupScript = path.relative(vscode.workspace.rootPath, startupScript);
        }
        startupScript = path.join(`$AZ_BATCHAI_INPUT_${inputDirectoryID}`, startupScript);
        if (path === path.win32) {
            startupScript = unixify(startupScript);
        }
        this.updateInputDirectory(param, inputDirectoryID, '');
        switch (item) {
            case 'cntk-python':
                jobConfig.job.type = 'CNTK';
                param.jobCreateParam.cntkSettings = {
                    languageType: 'Python',
                    pythonScriptFilePath: startupScript,
                    commandLineArgs: jobConfig.job.arguments
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'microsoft/cntk:latest'
                    }
                };
                break;
            case 'cntk-brainscript':
                jobConfig.job.type = 'CNTK';
                param.jobCreateParam.cntkSettings = {
                    languageType: 'BrainScript',
                    configFilePath: startupScript,
                    commandLineArgs: jobConfig.job.arguments
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'microsoft/cntk:latest'
                    }
                };
                break;
            case 'tensorflow':
                jobConfig.job.type = 'Tensorflow';
                param.jobCreateParam.tensorFlowSettings = {
                    pythonScriptFilePath: startupScript,
                    masterCommandLineArgs: '-p'
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'tensorflow/tensorflow:latest-gpu'
                    }
                };
                break;
            case 'caffe':
                jobConfig.job.type = 'Caffe';
                param.jobCreateParam.caffeSettings = {
                    pythonScriptFilePath: startupScript,
                    commandLineArgs: jobConfig.job.arguments
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'bvlc/caffe:gpu'
                    }
                };
                break;
            case 'caffe2':
                jobConfig.job.type = 'Caffe2';
                param.jobCreateParam.caffe2Settings = {
                    pythonScriptFilePath: startupScript,
                    commandLineArgs: jobConfig.job.arguments
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'caffe2ai/caffe2'
                    }
                };
                break;
            case 'chainer':
                jobConfig.job.type = 'Chainer';
                param.jobCreateParam.chainerSettings = {
                    pythonScriptFilePath: startupScript,
                    commandLineArgs: jobConfig.job.arguments
                };
                param.jobCreateParam.containerSettings = {
                    imageSourceRegistry: {
                        image: 'batchaitraining/chainermn:openMPI'
                    }
                };
                break;
            case 'custom':
                jobConfig.job.type = 'General';
                param.jobCreateParam.customToolkitSettings = {
                    commandLine: `${jobConfig.job.startupCommand} ${startupScript} ${jobConfig.job.arguments}`
                };
                break;
            default:
                throw new Error('Invalid toolkit. BatchAI job submission canceled.');
        }
    }
    checkAutoUpload(param) {
        if (lodash_1.isNil(param) || lodash_1.isUndefined(param.autoUpload)) {
            return false;
        }
        if (lodash_1.isNull(param.autoUpload)) {
            return true;
        }
        try {
            const autoUploadPath = path.posix.relative(batchUtil.mountRoot, param.autoUpload.prefix);
            const volumes = this.cluster.nodeSetup.mountVolumes;
            if (!lodash_1.isNil(volumes.azureBlobFileSystems)) {
                const target = volumes.azureBlobFileSystems.find((x) => !path.relative(x.relativeMountPath, autoUploadPath).startsWith('..'));
                if (!lodash_1.isNil(target)) {
                    return true;
                }
            }
            if (!lodash_1.isNil(volumes.azureFileShares)) {
                const target = volumes.azureFileShares.find((x) => !path.relative(x.relativeMountPath, autoUploadPath).startsWith('..'));
                if (!lodash_1.isNil(target)) {
                    return true;
                }
            }
            if (!lodash_1.isNil(volumes.fileServers)) {
                const target = volumes.fileServers.find((x) => !path.relative(x.relativeMountPath, autoUploadPath).startsWith('..'));
                if (!lodash_1.isNil(target)) {
                    return true;
                }
            }
        }
        catch (_a) {
            return false;
        }
        return false;
    }
    async selectAutoUpload(param) {
        const items = batchUtil.getVolumeQuickPickItemsFromCluster(this.cluster);
        items.push({
            label: skipKey,
            description: skipKey
        });
        const item = await quickPickerToolkit_1.showQuickPick(items, 'Please select an auto upload destination volume');
        if (lodash_1.isNil(item)) {
            throw new Error('No volume selected. BatchAI job submission canceled.');
        }
        let prefix;
        if (!lodash_1.isNil(item.context)) {
            prefix = path.posix.join(batchUtil.mountRoot, item.context.relativeMountPath);
        }
        if (!lodash_1.isNil(prefix)) {
            param.autoUpload = {
                path: '',
                prefix
            };
            param.jobCreateParam.stdOutErrPathPrefix = prefix;
        }
        else {
            param.autoUpload = null;
        }
    }
    updateAutoUploadPath(param) {
        param.autoUpload.path = path.posix.join(param.autoUpload.prefix, batchUtil.getSubscriptionFromId(this.cluster.id), batchUtil.getResourceGroupFromId(this.cluster.id), 'jobs', param.jobName, 'scripts', uuid());
        this.updateInputDirectory(param, inputDirectoryID, param.autoUpload.path);
    }
    updateInputDirectory(param, id, directoryPath) {
        let ind = param.jobCreateParam.inputDirectories;
        ind = lodash_1.isNil(ind) ? [] : ind;
        ind = ind.filter((x) => x.id !== id);
        ind.push({ id, path: directoryPath });
        param.jobCreateParam.inputDirectories = ind;
    }
}
exports.BatchAIJobPropertiesEditor = BatchAIJobPropertiesEditor;
//# sourceMappingURL=batchAIJobProperties.js.map