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
const telemetryManager_1 = require("common/telemetryManager");
const configuration_1 = require("interfaces/configuration");
const registerProvider_1 = require("interfaces/registerProvider");
const configExplorerTreeDataProvider_1 = require("treeView/configExplorer/configExplorerTreeDataProvider");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
/**
 * TBD
 * @class ConfigurationManager
 */
let ConfigurationManager = class ConfigurationManager {
    constructor() {
        this.loadProvidersPromise = this.loadProviders();
    }
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.addConfiguration', async () => {
            await progressToolkit_1.withProgress('Add Platform Configuration', async () => this.addConfiguration());
        }), vscode.commands.registerCommand('vscodeai.editConfigurations', async () => {
            await progressToolkit_1.withProgress('Edit Platform Configurations', async () => this.editConfigurations());
        }), vscode.commands.registerCommand('vscodeai.removeConfiguration', async () => {
            await progressToolkit_1.withProgress('Remove Platform Configuration', async () => this.removeConfiguration());
        }), vscode.commands.registerCommand('vscodeai.view.common.addConfiguration', async (node) => {
            await progressToolkit_1.withProgress('Add Platform Configuration', async () => this.addConfiguration(node.provider));
        }), vscode.commands.registerCommand('vscodeai.view.common.editConfiguration', async (node) => {
            await progressToolkit_1.withProgress('Edit Platform Configurations', async () => this.editConfiguration(node.provider, node.config));
        }), vscode.commands.registerCommand('vscodeai.view.common.removeConfiguration', async (node) => {
            await progressToolkit_1.withProgress('Remove Platform Configuration', async () => this.removeConfiguration(node.provider, node.config));
        }));
    }
    async getAllProviders(filter) {
        let providers = await this.loadProvidersPromise;
        providers = providers.filter((provider) => provider.enabled);
        if (!lodash_1.isNil(filter)) {
            providers = providers.filter(filter);
        }
        const exclusive = providers.filter((x) => x.exclusive);
        if (!lodash_1.isEmpty(exclusive)) {
            return exclusive;
        }
        else {
            return providers;
        }
    }
    async getProvider(type) {
        return (await this.getAllProviders()).find((x) => x.type === type);
    }
    async selectProvider(filter) {
        const providerNode = await quickPickerToolkit_1.showQuickPick(this.getAllProviders(filter).then((res) => res.map((p) => ({
            label: p.type,
            description: p.description,
            context: p
        }))), 'Select one platform');
        if (lodash_1.isNil(providerNode)) {
            return;
        }
        return providerNode.context;
    }
    async editConfiguration(provider, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'edit configurations' });
        this.channel.appendLine('=== Edit Configuration ===');
        if (!lodash_1.isNil(provider.configurationEditor)) {
            await provider.configurationEditor.editConfiguration(provider, configuration);
            component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
            return;
        }
        let submitted = false;
        const promot = 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.';
        if (configuration.kind === 'object') {
            configuration = configuration;
            const ret = await component.get(editorToolkit_1.EditorToolkit).editObject({
                name: configuration.name,
                description: configuration.description,
                properties: configuration.properties
            }, `aitools_${configuration.type.toLocaleLowerCase()}_${configuration.name.toLocaleLowerCase()}.json`, !lodash_1.isNil(configuration.explanation) ? `${configuration.explanation}${promot}` : promot, async (object) => {
                return this.validateObjectConfiguration(provider, configuration, object);
            });
            if (ret.continue) {
                submitted = true;
                configuration.name = ret.object.name;
                configuration.description = ret.object.description;
                configuration.properties = ret.object.properties;
            }
        }
        else if (configuration.kind === 'file') {
            configuration = configuration;
            const ret = await component.get(editorToolkit_1.EditorToolkit).editFile(configuration.fileName, !lodash_1.isNil(configuration.explanation) ? `${configuration.explanation}${promot}` : promot, async () => this.validateFileConfiguration(provider, configuration), true);
            if (ret.continue) {
                submitted = true;
            }
        }
        else {
            await this.removeConfiguration(provider, configuration);
        }
        if (submitted) {
            this.channel.appendLine('Updating configuration...');
            try {
                await provider.addOrUpdateConfiguration(configuration);
                component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
                this.channel.appendLine('Update configuration succeeded.');
                return configuration;
            }
            catch (err) {
                this.channel.appendLine(`Update configuration failed, error=${err}`);
            }
        }
        else {
            this.channel.appendLine('Update configuration process is cancelled by user');
        }
    }
    async editConfigurations(provider) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'edit configurations' });
        if (lodash_1.isNil(provider)) {
            const providerNode = await quickPickerToolkit_1.showQuickPick(this.getAllProviders().then((providers) => providers.map((p) => ({
                label: p.type,
                description: p.description,
                context: p
            }))), 'Select one platform');
            if (lodash_1.isNil(providerNode)) {
                return;
            }
            provider = providerNode.context;
        }
        const configurationNode = await quickPickerToolkit_1.showQuickPick(provider.getAllConfigurations().then((configs) => configs.map((config) => ({
            label: config.name,
            description: config.description,
            context: config
        }))).then((items) => {
            items.push({
                label: '<< add new >>',
                description: 'Add new configuration',
                context: undefined
            });
            return items;
        }), `Select configuration for ${provider.type}`);
        if (lodash_1.isNil(configurationNode)) {
            return;
        }
        if (!lodash_1.isNil(configurationNode.context)) {
            // Edit existing configuration
            await this.editConfiguration(provider, configurationNode.context);
        }
        else {
            // Add new configuration
            await this.addConfiguration(provider);
        }
    }
    async validateObjectConfiguration(provider, configuration, object) {
        const validation = await provider.validateConfiguration({
            kind: 'object',
            id: configuration.id,
            type: configuration.type,
            name: object.name,
            description: object.description,
            properties: object.properties
        });
        if (validation.state === 'Unqualified') {
            return {
                valid: false,
                reason: validation.reason
            };
        }
        else {
            return {
                valid: true
            };
        }
    }
    async validateFileConfiguration(provider, configuration) {
        const validation = await provider.validateConfiguration(configuration);
        if (validation.state === 'Unqualified') {
            return {
                valid: false,
                reason: validation.reason
            };
        }
        else {
            return {
                valid: true
            };
        }
    }
    async addConfiguration(provider) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create configurations' });
        this.channel.appendLine('=== Add Configuration ===');
        if (lodash_1.isNil(provider)) {
            const providerNode = await quickPickerToolkit_1.showQuickPick(this.getAllProviders().then((providers) => providers.map((p) => ({
                label: p.type,
                description: p.description,
                context: p
            }))), 'Select one platform');
            if (lodash_1.isNil(providerNode)) {
                return;
            }
            provider = providerNode.context;
        }
        if (!lodash_1.isNil(provider.configurationEditor)) {
            await provider.configurationEditor.addConfiguration(provider);
            component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
            return;
        }
        let configuration = await provider.createConfiguration();
        let submitted = false;
        const promot = 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.';
        if (configuration.kind === 'object') {
            configuration = configuration;
            const ret = await component.get(editorToolkit_1.EditorToolkit).editObject({
                name: configuration.name,
                description: configuration.description,
                properties: configuration.properties
            }, `aitools_${configuration.type.toLowerCase()}.json`, !lodash_1.isNil(configuration.explanation) ? `${configuration.explanation}${promot}` : promot, async (object) => {
                return this.validateObjectConfiguration(provider, configuration, object);
            });
            if (ret.continue) {
                submitted = true;
                configuration.name = ret.object.name;
                configuration.description = ret.object.description;
                configuration.properties = ret.object.properties;
            }
        }
        else if (configuration.kind === 'file') {
            configuration = configuration;
            const ret = await component.get(editorToolkit_1.EditorToolkit).editFile(configuration.fileName, !lodash_1.isNil(configuration.explanation) ? `${configuration.explanation}${promot}` : promot, async () => this.validateFileConfiguration(provider, configuration), true);
            if (ret.continue) {
                submitted = true;
            }
        }
        else {
            await this.removeConfiguration(provider, configuration);
        }
        if (submitted) {
            this.channel.appendLine('Updating configuration...');
            try {
                await provider.addOrUpdateConfiguration(configuration);
                component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
                this.channel.appendLine('Update configuration succeeded.');
            }
            catch (err) {
                this.channel.appendLine(`Update configuration failed, error=${err}`);
            }
        }
        else {
            this.channel.appendLine('Update configuration process is cancelled by user');
        }
    }
    async removeConfiguration(provider, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configurations' });
        this.channel.appendLine('=== Remove Configuration ===');
        if (lodash_1.isNil(provider)) {
            const providerNode = await quickPickerToolkit_1.showQuickPick(this.getAllProviders().then((providers) => providers.map((p) => ({
                label: p.type,
                description: p.description,
                context: p
            }))), 'Select one platform');
            if (lodash_1.isNil(providerNode)) {
                return;
            }
            provider = providerNode.context;
        }
        if (lodash_1.isNil(configuration)) {
            const configurationNode = await quickPickerToolkit_1.showQuickPick(provider.getAllConfigurations().then((configs) => configs.map((c) => ({
                label: c.name,
                description: c.description,
                context: c
            }))), `Select configuration for ${provider.type}`);
            if (!lodash_1.isNil(configurationNode)) {
                configuration = configurationNode.context;
            }
            else {
                return;
            }
        }
        if (!lodash_1.isNil(provider.configurationEditor)) {
            await provider.configurationEditor.removeConfiguration(provider, configuration);
            component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
            return;
        }
        this.channel.appendLine('Removing configuration...');
        try {
            await provider.removeConfiguration(configuration.id);
            component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh(provider.treeView);
            this.channel.appendLine('Remove configuration succeeded.');
        }
        catch (err) {
            this.channel.appendLine(`Remove configuration failed, error=${err}`);
        }
    }
    async loadProviders() {
        return component.imports(configuration_1.ConfigurationProvider);
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], ConfigurationManager.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], ConfigurationManager.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], ConfigurationManager.prototype, "telemetryManager", void 0);
ConfigurationManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton,
    __metadata("design:paramtypes", [])
], ConfigurationManager);
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=configurationManager.js.map