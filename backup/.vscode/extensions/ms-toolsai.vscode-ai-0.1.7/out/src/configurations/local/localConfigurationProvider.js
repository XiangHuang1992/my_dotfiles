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
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const telemetryManager_1 = require("common/telemetryManager");
const localJobService_1 = require("configurations/local/localJobService");
const configuration_1 = require("interfaces/configuration");
const configExplorerTreeNode_1 = require("treeView/configExplorer/configExplorerTreeNode");
/**
 * Local Configuration Provider
 */
let LocalConfigurationProvider = class LocalConfigurationProvider extends configuration_1.ConfigurationProvider {
    /**
     * Local Configuration Provider
     */
    constructor() {
        super(...arguments);
        this.treeView = new configExplorerTreeNode_1.BasePlatformTreeNode(this);
        this.globalStateKey = '7a175a2c-4779-4af5-adbe-32e692e7a3b4';
        this.defaultConfigurationsObject = {
            version: '0.0.1',
            configurations: []
        };
    }
    get type() {
        return 'Local';
    }
    get description() {
        return 'Local environment';
    }
    get jobService() {
        return this.uJobService;
    }
    get enabled() {
        return true;
    }
    async getAllConfigurations() {
        let object = this.uContext.globalState.get(this.globalStateKey);
        if (lodash_1.isNil(object)) {
            object = this.defaultConfigurationsObject;
            await this.uContext.globalState.update(this.globalStateKey, object);
        }
        return object.configurations.map((configuration) => ({
            kind: 'object',
            type: this.type,
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            properties: configuration.properties
        }));
    }
    async getConfiguration(id) {
        const object = this.uContext.globalState.get(this.globalStateKey);
        if (!lodash_1.isEmpty(object.configurations)) {
            for (const configuration of object.configurations) {
                if (configuration.id === id) {
                    return {
                        kind: 'object',
                        type: this.type,
                        id: configuration.id,
                        name: configuration.name,
                        description: configuration.description,
                        properties: configuration.properties
                    };
                }
            }
        }
    }
    async createConfiguration() {
        this.uTelemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create configuration', platform: 'Local' });
        return {
            kind: 'object',
            type: this.type,
            id: uuid(),
            name: '',
            description: '',
            explanation: 'Please provide either Python home path or CNTK executer path to run the script.\n',
            properties: {
                pythonPath: '',
                cntkPath: ''
            }
        };
    }
    async addOrUpdateConfiguration(configuration) {
        this.uTelemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'update configuration', platform: 'Local' });
        let object = this.uContext.globalState.get(this.globalStateKey);
        if (lodash_1.isNil(object)) {
            object = this.defaultConfigurationsObject;
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
        await this.uContext.globalState.update(this.globalStateKey, object);
    }
    async removeConfiguration(id) {
        this.uTelemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configuration', platform: 'Local' });
        let object = this.uContext.globalState.get(this.globalStateKey);
        if (lodash_1.isNil(object)) {
            object = this.defaultConfigurationsObject;
        }
        object.configurations = object.configurations.filter((i) => i.id !== id);
        await this.uContext.globalState.update(this.globalStateKey, object);
    }
    async validateConfiguration(config) {
        if (lodash_1.isEmpty(config.name)) {
            return {
                state: 'Unqualified',
                reason: 'Missing display name'
            };
        }
        return {
            state: 'OK'
        };
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LocalConfigurationProvider.prototype, "uContext", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], LocalConfigurationProvider.prototype, "uTelemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", localJobService_1.LocalJobService)
], LocalConfigurationProvider.prototype, "uJobService", void 0);
LocalConfigurationProvider = __decorate([
    component.Export(configuration_1.ConfigurationProvider),
    component.Singleton
], LocalConfigurationProvider);
exports.LocalConfigurationProvider = LocalConfigurationProvider;
//# sourceMappingURL=localConfigurationProvider.js.map