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
const uuid = require("uuid");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const batchAIConfigTreeView_1 = require("configurations/batchAI/batchAIConfigTreeView");
const batchAIJobService_1 = require("configurations/batchAI/batchAIJobService");
const batchUtil = require("configurations/batchAI/batchAIUtil");
const configExplorerTreeDataProvider_1 = require("treeView/configExplorer/configExplorerTreeDataProvider");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const configuration_1 = require("interfaces/configuration");
const defaultCreateParameter = {
    location: '',
    tags: {},
    vmSize: '',
    vmPriority: 'dedicated',
    scaleSettings: {
        autoScale: {
            minimumNodeCount: 1,
            maximumNodeCount: 1
        }
    },
    virtualMachineConfiguration: {
        imageReference: {
            publisher: 'microsoft-ads',
            offer: 'linux-data-science-vm-ubuntu',
            sku: 'linuxdsvmubuntu'
        }
    },
    nodeSetup: {
        mountVolumes: {
            azureFileShares: [
                {
                    accountName: '',
                    credentials: {
                        accountKey: ''
                    },
                    azureFileUrl: '',
                    relativeMountPath: ''
                }
            ]
        }
    },
    userAccountSettings: {
        adminUserName: '',
        adminUserPassword: ''
    }
};
/**
 * BatchAI Configuration Editor
 */
let BatchAIConfigurationEditor = class BatchAIConfigurationEditor {
    constructor() {
        void this.logger.debug('BatchAIConfigurationEditor created');
    }
    async addConfiguration(config) {
        try {
            this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create configuration', platform: 'Batch AI' });
            const resourceGroup = await batchUtil.selectResourceGroups();
            if (lodash_1.isNil(resourceGroup)) {
                throw new Error('No resource group selected. Canceled');
            }
            const vmSize = await batchUtil.selectVMSize(resourceGroup.location);
            if (lodash_1.isEmpty(vmSize)) {
                throw new Error('No VM Size selected. Canceled');
            }
            const name = await vscode.window.showInputBox({ placeHolder: 'Please input a cluster name' });
            if (!/^[\w-]{1,64}$/.test(name)) {
                // tslint:disable-next-line:max-line-length
                this.outputChannel.appendLine('Cluster names can only contain a combination of alphanumeric characters along with dash (-) and underscore (_). The name must be from 1 through 64 characters long.');
                throw new Error('Invalid cluster name. Canceled');
            }
            const param = Object.assign({}, defaultCreateParameter);
            param.location = resourceGroup.location;
            param.vmSize = vmSize;
            const res = await component.get(editorToolkit_1.EditorToolkit).editObject({
                resourceGroup: resourceGroup.name,
                name,
                param
            }, 'batchAI_create_cluster.json', 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', this.validateConfiguration);
            if (!res.continue) {
                throw new Error('Create cluster canceled');
            }
            else {
                await batchUtil.getBatchAIClient().clusters.create(res.object.resourceGroup, res.object.name, res.object.param);
            }
            await config.refresh();
            this.outputChannel.appendLine(`=== Cluster ${name} added ===`);
        }
        catch (e) {
            void vscode.window.showWarningMessage(e.message);
            this.outputChannel.appendLine('=== Add Cluster canceled ===');
        }
    }
    async editConfiguration(config, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'update configuration', platform: 'Batch AI' });
        const cluster = configuration.properties;
        const name = cluster.name;
        const group = batchUtil.getResourceGroupFromId(cluster.id);
        if (lodash_1.isNil(cluster.scaleSettings)) {
            cluster.scaleSettings = {};
        }
        const param = {
            tags: cluster.tags,
            scaleSettings: cluster.scaleSettings
        };
        const ret = await component.get(editorToolkit_1.EditorToolkit).editObject(param, `batchAI_${name}_update.json`, 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', undefined);
        if (ret.continue) {
            await batchUtil.getBatchAIClient().clusters.update(group, name, ret.object);
            await config.refresh();
            this.outputChannel.appendLine(`=== Cluster ${name} Updated ===`);
        }
        else {
            this.outputChannel.appendLine(`=== Edit ${name} canceled ===`);
        }
    }
    async removeConfiguration(config, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configuration', platform: 'Batch AI' });
        const cluster = configuration.properties;
        const name = cluster.name;
        const group = batchUtil.getResourceGroupFromId(cluster.id);
        try {
            await batchUtil.getBatchAIClient().clusters.deleteMethod(group, name);
            await config.refresh();
            this.outputChannel.appendLine(`=== Cluster ${name} removed ===`);
        }
        catch (e) {
            void vscode.window.showWarningMessage(e.message);
            this.outputChannel.appendLine(`=== Remove ${name} failed ===`);
        }
    }
    async validateConfiguration(x) {
        if (!/^[\w-]{1,64}$/.test(x.name)) {
            // tslint:disable-next-line:max-line-length
            this.outputChannel.appendLine('Cluster names can only contain a combination of alphanumeric characters along with dash (-) and underscore (_). The name must be from 1 through 64 characters long.');
            return {
                valid: false,
                reason: 'Invalid cluster name'
            };
        }
        if (lodash_1.isNil(x.param.userAccountSettings) || lodash_1.isNil(x.param.userAccountSettings.adminUserName)) {
            return {
                valid: false,
                reason: 'Invalid admin username'
            };
        }
        if (lodash_1.isEmpty(x.param.userAccountSettings.adminUserPassword) && lodash_1.isEmpty(x.param.userAccountSettings.adminUserSshPublicKey)) {
            return {
                valid: false,
                reason: 'Please fill in adminUserPassword or adminUserSshPublicKey'
            };
        }
        return { valid: true };
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], BatchAIConfigurationEditor.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], BatchAIConfigurationEditor.prototype, "telemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], BatchAIConfigurationEditor.prototype, "logger", void 0);
BatchAIConfigurationEditor = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], BatchAIConfigurationEditor);
/**
 * BatchAI Configuration Provider
 */
let BatchAIConfigurationProvider = class BatchAIConfigurationProvider extends configuration_1.ConfigurationProvider {
    /**
     * BatchAI Configuration Provider
     */
    constructor() {
        super(...arguments);
        this.treeView = new batchAIConfigTreeView_1.BatchAIPlatformTreeNode(this);
        this.defaultId = uuid();
    }
    get type() {
        return 'BatchAI';
    }
    get description() {
        return 'BatchAI Clusters';
    }
    get jobService() {
        return this.uJobService;
    }
    get enabled() {
        return true;
    }
    get configurationEditor() {
        return this.editor;
    }
    async refresh() {
        await this.getClusters();
        component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(this.treeView);
    }
    async getFileSystem(param) {
        let config;
        if (lodash_1.isNil(param.config)) {
            config = await this.selectConfig();
            if (lodash_1.isNil(config)) {
                throw new Error('No cluster selected');
            }
        }
        else {
            config = await this.getConfiguration(param.config);
        }
        const cluster = config.properties;
        if (lodash_1.isNil(param.mountPath)) {
            const volumeItem = await quickPickerToolkit_1.showQuickPick(batchUtil.getVolumeQuickPickItemsFromCluster(cluster), 'Please select a volume');
            if (lodash_1.isNil(volumeItem)) {
                throw new Error('No volume selected');
            }
            param.mountPath = volumeItem.context.relativeMountPath;
        }
        const fsGetResult = await batchUtil.getFileSytemFromMountPath(cluster.nodeSetup.mountVolumes, param.mountPath);
        return fsGetResult.fs;
    }
    async getAllConfigurations() {
        const clusters = await this.getClusters();
        return clusters.map((x) => ({
            kind: 'object',
            type: this.type,
            id: x.id,
            name: x.name,
            description: `Type: ${x.type} Location: ${x.location}`,
            properties: x
        }));
    }
    async getConfiguration(id) {
        if (id === this.defaultId) {
            return {
                kind: 'object',
                type: this.type,
                id: id,
                properties: {}
            };
        }
        const clusters = await this.getClusters();
        const list = clusters.filter((x) => x.id === id);
        if (lodash_1.isEmpty(list)) {
            throw new Error('No cluster found.');
        }
        return {
            kind: 'object',
            type: this.type,
            id: id,
            name: list[0].name,
            description: `Type: ${list[0].type} Location: ${list[0].location}`,
            properties: list[0]
        };
    }
    async createConfiguration() {
        return;
    }
    async addOrUpdateConfiguration(configuration) {
        return;
    }
    async removeConfiguration(id) {
        return;
    }
    async validateConfiguration(configuration) {
        return {
            state: 'OK'
        };
    }
    async getClusters() {
        let res;
        try {
            if (lodash_1.isNil(this.listPromise)) {
                this.listPromise = batchUtil.getBatchAIClient().clusters.list();
                res = this.listPromise;
            }
            else {
                res = this.listPromise;
                this.listPromise = batchUtil.getBatchAIClient().clusters.list();
            }
        }
        catch (e) {
            this.listPromise = Promise.resolve(null);
            return null;
        }
        return res;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], BatchAIConfigurationProvider.prototype, "uContext", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], BatchAIConfigurationProvider.prototype, "uTelemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", batchAIJobService_1.BatchAIJobService)
], BatchAIConfigurationProvider.prototype, "uJobService", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", BatchAIConfigurationEditor)
], BatchAIConfigurationProvider.prototype, "editor", void 0);
BatchAIConfigurationProvider = __decorate([
    component.Export(configuration_1.ConfigurationProvider),
    component.Singleton
], BatchAIConfigurationProvider);
exports.BatchAIConfigurationProvider = BatchAIConfigurationProvider;
//# sourceMappingURL=batchAIConfigurationProvider.js.map