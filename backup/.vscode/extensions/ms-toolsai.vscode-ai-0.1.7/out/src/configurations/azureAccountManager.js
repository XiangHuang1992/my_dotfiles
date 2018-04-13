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
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const azureMLConfigurationProvider_1 = require("configurations/azureML/azureMLConfigurationProvider");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
const amlPlatform = {
    display: 'Azure ML',
    command: 'azureml'
};
const batchPlatform = {
    display: 'Batch AI',
    command: 'batchai'
};
/**
 * Azure Account Manager
 * @implements RegisterProvider
 */
let AzureAccountManager = class AzureAccountManager {
    async register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.azure.login', async () => {
            const platform = await this.selectPlatform();
            if (lodash_1.isNil(platform)) {
                return;
            }
            return vscode.commands.executeCommand(`vscodeai.${platform.command}.login`);
        }), vscode.commands.registerCommand('vscodeai.azure.logout', async () => {
            const platform = await this.selectPlatform();
            if (lodash_1.isNil(platform)) {
                return;
            }
            return vscode.commands.executeCommand(`vscodeai.${platform.command}.logout`);
        }), vscode.commands.registerCommand('vscodeai.azure.setSubscription', async () => {
            const platform = await this.selectPlatform();
            if (lodash_1.isNil(platform)) {
                return;
            }
            return vscode.commands.executeCommand(`vscodeai.${platform.command}.setSubscription`);
        }));
    }
    async selectPlatform() {
        const item = await quickPickerToolkit_1.showQuickPick(this.getPlatform().then((res) => res.map((x) => ({
            label: x.display,
            description: x.display,
            context: x
        }))), 'Select a platform');
        if (lodash_1.isNil(item)) {
            return;
        }
        return item.context;
    }
    async getPlatform() {
        const list = [];
        if (!component.get(azureMLConfigurationProvider_1.AzureMLConfigurationProvider).exclusive) {
            list.push(batchPlatform);
        }
        if (component.get(azureMLConfigurationProvider_1.AzureMLConfigurationProvider).enabled) {
            list.push(amlPlatform);
        }
        return list;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], AzureAccountManager.prototype, "context", void 0);
AzureAccountManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], AzureAccountManager);
exports.AzureAccountManager = AzureAccountManager;
//# sourceMappingURL=azureAccountManager.js.map