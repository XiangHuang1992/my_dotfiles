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
const lodash_1 = require("lodash");
const uuid = require("uuid");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const telemetryManager_1 = require("common/telemetryManager");
const configurationManager_1 = require("configurationManager");
const linuxVMConfigTreeView_1 = require("configurations/linuxVM/linuxVMConfigTreeView");
const linuxVMJobService_1 = require("configurations/linuxVM/linuxVMJobService");
const linuxUtil = require("configurations/linuxVM/linuxVMUtil");
const sftpFileSystem_1 = require("fileSystem/sftpFileSystem");
const configuration_1 = require("interfaces/configuration");
const outputChannel_1 = require("uiToolkits/outputChannel");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const globalStateKey = '5ecaa291-b5ad-4d4e-9871-ff0f3335c170';
const defaultConfigurationsObject = {
    version: '0.0.1',
    configurations: []
};
/**
 * TBD
 * @class LinuxVMConfigurationProvider
 */
let LinuxVMConfigurationProvider = class LinuxVMConfigurationProvider extends configuration_1.ConfigurationProvider {
    /**
     * TBD
     * @class LinuxVMConfigurationProvider
     */
    constructor() {
        super(...arguments);
        this.treeView = new linuxVMConfigTreeView_1.LinuxVMPlatformTreeNode(this);
    }
    async getFileSystem(param) {
        let config;
        if (lodash_1.isNil(param.config)) {
            config = await this.selectConfig();
            if (lodash_1.isNil(config)) {
                throw new Error('No Linux VM selected');
            }
        }
        else {
            config = await this.getConfiguration(param.config);
        }
        if (lodash_1.isNil(param.root)) {
            const homeItem = 'Home Directory';
            const jobItem = 'Job Output Directory';
            const customItem = 'Custom Directory';
            const selectedItem = await quickPickerToolkit_1.showQuickPick([homeItem, jobItem, customItem], 'Please select a root directory');
            if (lodash_1.isNil(selectedItem)) {
                throw new Error('No root folder selected.');
            }
            if (selectedItem === homeItem) {
                param.root = '';
            }
            else if (selectedItem === jobItem) {
                param.config = config.id;
                const res = await quickPickerToolkit_1.showQuickPick(component.get(linuxVMJobService_1.LinuxVMJobService).getJobList(param).then((list) => list.map((data) => ({
                    label: `${data.props.name}`,
                    description: data.id,
                    detail: `Author: ${data.props.author}, Submit Time: ${new Date(data.props.submitTime).toLocaleString()}`,
                    context: data
                }))), 'Please select a job');
                if (lodash_1.isNil(res)) {
                    throw new Error('No Job selected');
                }
                param.root = `/tmp/aitools/jobs/instances/${res.context.id}`;
            }
            else {
                // custom
                param.root = await vscode.window.showInputBox({
                    prompt: 'Please input the root directory'
                });
                if (lodash_1.isEmpty(param.root)) {
                    throw new Error('Invalid directory');
                }
            }
        }
        if (lodash_1.isEmpty(param.root)) {
            component.get(outputChannel_1.OutputChannel).appendLine(`[AI Storage Explorer] ${config.properties.address} home directory opened`);
        }
        else {
            component.get(outputChannel_1.OutputChannel).appendLine(`[AI Storage Explorer] ${config.properties.address}:${param.root} opened`);
        }
        return new sftpFileSystem_1.SFTPFileSystem(await linuxUtil.getConnectConfig(config.properties), param.root);
    }
    async getAllConfigurations() {
        let object = this.context.globalState.get(globalStateKey);
        if (lodash_1.isNil(object)) {
            object = defaultConfigurationsObject;
            await this.context.globalState.update(globalStateKey, object);
        }
        return object.configurations.map((configuration) => {
            return {
                kind: 'object',
                type: this.type,
                id: configuration.id,
                name: configuration.name,
                description: configuration.description,
                properties: configuration.properties
            };
        });
    }
    async getConfiguration(id) {
        const object = this.context.globalState.get(globalStateKey);
        if (!lodash_1.isEmpty(object.configurations)) {
            for (const configuration of object.configurations) {
                if (configuration.id === id) {
                    const config = {
                        kind: 'object',
                        type: this.type,
                        id: configuration.id,
                        name: configuration.name,
                        description: configuration.description,
                        properties: configuration.properties
                    };
                    const validateResult = await this.validateConfiguration(config);
                    if (validateResult.state !== 'OK') {
                        void vscode.window.showWarningMessage(`${validateResult.reason} Please check the configuration...`);
                        return await component.get(configurationManager_1.ConfigurationManager).editConfiguration(this, config);
                    }
                    else {
                        return config;
                    }
                }
            }
        }
    }
    async createConfiguration() {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create configuration', platform: 'LinuxVM' });
        return {
            kind: 'object',
            type: this.type,
            id: uuid(),
            name: '',
            description: '',
            explanation: '',
            properties: {
                address: '',
                port: 22,
                account: {
                    username: '',
                    password: ''
                }
            }
        };
    }
    async addOrUpdateConfiguration(configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'update configuration', platform: 'LinuxVM' });
        let object = this.context.globalState.get(globalStateKey);
        if (lodash_1.isNil(object)) {
            object = defaultConfigurationsObject;
        }
        object.configurations = object.configurations.filter((i) => configuration.id !== i.id);
        object.configurations.push({
            kind: 'object',
            type: this.type,
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            properties: configuration.properties
        });
        await this.context.globalState.update(globalStateKey, object);
    }
    async removeConfiguration(id) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configuration', platform: 'LinuxVM' });
        let object = this.context.globalState.get(globalStateKey);
        if (lodash_1.isNil(object)) {
            object = defaultConfigurationsObject;
        }
        object.configurations = object.configurations.filter((configuration) => configuration.id !== id);
        await this.context.globalState.update(globalStateKey, object);
    }
    async validateConfiguration(configuration) {
        const properties = configuration.properties;
        if (lodash_1.isEmpty(configuration.name)) {
            return {
                state: 'Unqualified',
                reason: 'Missing display name'
            };
        }
        if (lodash_1.isEmpty(properties.address)) {
            return {
                state: 'Unqualified',
                reason: 'Missing address field'
            };
        }
        if (lodash_1.isEmpty(properties.account) || lodash_1.isEmpty(properties.account.username)) {
            return {
                state: 'Unqualified',
                reason: 'Missing userName field'
            };
        }
        if (lodash_1.isEmpty(properties.account.password) && lodash_1.isEmpty(properties.account.privateKeyFilePath)) {
            return {
                state: 'Unqualified',
                reason: 'Missing password and private key field'
            };
        }
        return {
            state: 'OK'
        };
    }
    get type() {
        return 'LinuxVM';
    }
    get description() {
        return 'Remote Linux Machines';
    }
    get jobService() {
        return this.jobServiceValue;
    }
    get enabled() {
        return true;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LinuxVMConfigurationProvider.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", linuxVMJobService_1.LinuxVMJobService)
], LinuxVMConfigurationProvider.prototype, "jobServiceValue", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], LinuxVMConfigurationProvider.prototype, "telemetryManager", void 0);
LinuxVMConfigurationProvider = __decorate([
    component.Export(configuration_1.ConfigurationProvider),
    component.Singleton
], LinuxVMConfigurationProvider);
exports.LinuxVMConfigurationProvider = LinuxVMConfigurationProvider;
//# sourceMappingURL=linuxVMConfigurationProvider.js.map