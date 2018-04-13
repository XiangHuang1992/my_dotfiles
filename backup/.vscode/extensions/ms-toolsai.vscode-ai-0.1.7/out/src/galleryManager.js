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
const vscode = require("vscode");
const lodash_1 = require("lodash");
const querystring = require("querystring");
const request = require("superagent");
const component = require("common/component");
const amlActivate = require("configurations/azureML/azureMLActivate");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const configurationManager_1 = require("configurationManager");
const htmlPreviewerToolkit_1 = require("uiToolkits/htmlPreviewerToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Gallery manager
 */
let GalleryManager = class GalleryManager {
    constructor() {
        void this.logger.debug('GalleryManager singleton created.');
    }
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.openGallery', async () => {
            await progressToolkit_1.withProgress('Open AzureML Sample Explorer', async () => this.openGallery());
        }), vscode.commands.registerCommand('vscodeai.showGallerySolutionDetail', async (params) => {
            await this.showSolutionDetail(params.configType, params.name, params.url);
        }), vscode.commands.registerCommand('vscodeai.createProjectFromGalleryTemplate', async (params) => {
            await progressToolkit_1.withProgress('Create Project from AzureML Template', async () => this.createProjectFromGallery(params.configType, params.id, params.name, params.uri));
        }));
    }
    async openGallery() {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'open gallery' });
        //A temp solution to make sure the aml cli installed. Will remove once we have multiple gallerys
        if (!await amlActivate.checkInstalled()) {
            return;
        }
        let providers = await this.configurationManager.getAllProviders();
        providers = providers.filter((p) => !lodash_1.isNil(p.gallery));
        if (lodash_1.isEmpty(providers)) {
            await vscode.window.showWarningMessage('Sorry, no galleries are provided currently.');
            return;
        }
        this.channel.clear();
        this.channel.appendLine('=== Open Gallery ===');
        let provider;
        if (providers.length > 1) {
            const providerNode = await quickPickerToolkit_1.showQuickPick(providers.map((p) => ({
                label: p.type,
                description: p.gallery.name,
                context: p
            })));
            if (lodash_1.isNil(providerNode)) {
                if (lodash_1.isUndefined(providerNode)) {
                    this.channel.appendLine('Open gallery process is cancelled by user.');
                }
                return;
            }
            provider = providerNode.context;
        }
        else {
            provider = providers[0];
        }
        await component
            .get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit)
            .open(`vscodeai://authority/page/galleryView?${querystring.stringify({
            configType: provider.type
        })}`, `${provider.gallery.name} Sample Explorer`);
    }
    async showSolutionDetail(configType, name, url) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'show gallery solution details' });
        await component
            .get(htmlPreviewerToolkit_1.HTMLPreviewerToolkit)
            .open(`vscodeai://authority/page/galleryDetailView?${querystring.stringify({
            configType,
            url
        })}`, `${name}`);
    }
    async createProjectFromGallery(configType, templateId, templateName, templateUri) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create project from gallery' });
        const provider = await this.configurationManager.getProvider(configType);
        this.channel.clear();
        this.channel.appendLine('=== Create Project From Gallery ===');
        try {
            const projectFullPath = await provider.gallery.createProjectFromUri(templateUri, templateName);
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectFullPath));
            this.channel.appendLine('Create project from gallery succeeded.');
            // send telemtry
            request
                .post('https://go.microsoft.com/fwlink/?linkid=864645')
                .type('json')
                .send({
                EntityId: templateId,
                UserId: '',
                Context: '',
                ActivityType: 4
            });
        }
        catch (e) {
            this.channel.appendLine(`Create project from gallery failed, ${e.message}`);
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], GalleryManager.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", configurationManager_1.ConfigurationManager)
], GalleryManager.prototype, "configurationManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], GalleryManager.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], GalleryManager.prototype, "telemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], GalleryManager.prototype, "logger", void 0);
GalleryManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton,
    __metadata("design:paramtypes", [])
], GalleryManager);
exports.GalleryManager = GalleryManager;
//# sourceMappingURL=galleryManager.js.map