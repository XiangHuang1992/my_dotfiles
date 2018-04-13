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
const batchAIConfigurationProvider_1 = require("configurations/batchAI/batchAIConfigurationProvider");
const azure_account_1 = require("configurations/batchAI/vscode-azure-account/azure-account");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * BatchAI Account
 * @implements RegisterProvider
 */
let BatchAIAccount = class BatchAIAccount {
    /**
     * BatchAI Account
     * @implements RegisterProvider
     */
    constructor() {
        this.helper = new azure_account_1.AzureLoginHelper(this.context);
    }
    async register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.batchai.login', async () => {
            return progressToolkit_1.withProgress('BatchAI Login', async () => {
                await this.helper.login();
                await this.helper.api.waitForSubscriptions();
                this.subscription = this.helper.api.subscriptions[0];
                await component.get(batchAIConfigurationProvider_1.BatchAIConfigurationProvider).refresh();
                const key = 'Set Subscription';
                const res = await vscode.window.showInformationMessage('Batch AI: Login succesfully', key);
                if (res === key) {
                    void this.setSubscription();
                }
            });
        }), vscode.commands.registerCommand('vscodeai.batchai.logout', async () => {
            return progressToolkit_1.withProgress('BatchAI Logout', async () => {
                if (lodash_1.isNil(this.subscription)) {
                    throw new Error('Batch AI: Please login first');
                }
                await this.helper.logout();
                this.subscription = null;
                await component.get(batchAIConfigurationProvider_1.BatchAIConfigurationProvider).refresh();
                void vscode.window.showInformationMessage('Batch AI: Logout succesfully');
            });
        }), vscode.commands.registerCommand('vscodeai.batchai.setSubscription', async () => {
            return progressToolkit_1.withProgress('BatchAI Set Subscription', async () => {
                await this.setSubscription();
            });
        }));
    }
    get subscriptionId() {
        if (lodash_1.isNil(this.subscription)) {
            return;
        }
        else {
            return this.subscription.subscription.subscriptionId;
        }
    }
    get credentials() {
        if (lodash_1.isNil(this.subscription)) {
            return;
        }
        else {
            return this.subscription.session.credentials;
        }
    }
    async getSubscriptions() {
        if (!(await this.helper.api.waitForSubscriptions())) {
            throw new Error('Batch AI: Please login first');
        }
        return this.helper.api.subscriptions;
    }
    async setSubscription() {
        const subscriptions = this.helper.api.subscriptions;
        const item = await quickPickerToolkit_1.showQuickPick(this.getSubscriptions().then((res) => res.map((x) => ({
            label: x.subscription.subscriptionId,
            description: x.subscription.displayName,
            context: x
        }))), 'Select a subscription');
        if (lodash_1.isNil(item)) {
            return;
        }
        this.subscription = item.context;
        await component.get(batchAIConfigurationProvider_1.BatchAIConfigurationProvider).refresh();
        void vscode.window.showInformationMessage(`Subscription: ${this.subscription.subscription.displayName}:${this.subscription.subscription.subscriptionId} set successfully`);
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], BatchAIAccount.prototype, "context", void 0);
BatchAIAccount = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], BatchAIAccount);
exports.BatchAIAccount = BatchAIAccount;
//# sourceMappingURL=batchAIAccount.js.map