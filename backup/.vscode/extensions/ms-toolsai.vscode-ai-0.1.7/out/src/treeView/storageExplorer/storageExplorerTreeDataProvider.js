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
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const telemetryManager_1 = require("common/telemetryManager");
const configurationManager_1 = require("configurationManager");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
const storageExplorerTreeNode_1 = require("treeView/storageExplorer/storageExplorerTreeNode");
/**
 * Storage Explorer Tree Data Provider
 */
let StorageExplorerTreeDataProvider = class StorageExplorerTreeDataProvider {
    /**
     * Storage Explorer Tree Data Provider
     */
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
    }
    get onDidChangeTreeData() {
        return this.onDidChangeEmitter.event;
    }
    async register() {
        this.context.subscriptions.push(vscode.window.registerTreeDataProvider('AIStorageExplorer', this), vscode.commands.registerCommand('vscodeai.openStorageExplorer', async (param = {}) => {
            await progressToolkit_1.withProgress('Open Storage Explorer', async () => {
                let provider;
                if (lodash_1.isNil(param.platform)) {
                    provider = await component.get(configurationManager_1.ConfigurationManager).selectProvider((x) => !lodash_1.isNil(x.getFileSystem));
                    if (lodash_1.isNil(provider)) {
                        return;
                    }
                }
                else {
                    provider = await component.get(configurationManager_1.ConfigurationManager).getProvider(param.platform);
                    if (lodash_1.isNil(provider.getFileSystem)) {
                        throw new Error('Invalid platform');
                    }
                }
                component.get(telemetryManager_1.TelemetryManager).enqueueTelemetryMsg('ExecuteCommand', { Name: 'Open Storage Explorer', platform: param.platform });
                this.setFileSystem(await provider.getFileSystem(param));
                await vscode.commands.executeCommand('setContext', 'enableStorageExplorer', true);
            });
        }), vscode.commands.registerCommand('vscodeai.view.common.openStorageExplorer', async (node) => {
            await vscode.commands.executeCommand('vscodeai.openStorageExplorer', {
                platform: node.provider.type,
                config: node.config.id
            });
        }), vscode.commands.registerCommand('vscodeai.view.storage.upload', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: Upload', async () => this.onUpload(node));
        }), vscode.commands.registerCommand('vscodeai.view.storage.uploadFolder', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: Upload Folder', async () => this.onUploadFolder(node));
        }), vscode.commands.registerCommand('vscodeai.view.storage.download', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: Download', async () => this.onDownload(node));
        }), vscode.commands.registerCommand('vscodeai.view.storage.mkdir', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: New Folder', async () => this.onMkdir(node));
        }), vscode.commands.registerCommand('vscodeai.view.storage.delete', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: Delete', async () => this.onDelete(node));
        }), vscode.commands.registerCommand('vscodeai.view.storage.refresh', async (node) => {
            await progressToolkit_1.withProgress('Storage Explorer: Refresh', async () => {
                this.refresh();
            });
        }));
    }
    setFileSystem(fileSystem) {
        this.fs = fileSystem;
        this.refresh();
    }
    refresh(node) {
        this.onDidChangeEmitter.fire(node);
    }
    getTreeItem(node) {
        return node;
    }
    async getChildren(node) {
        let dir = '';
        if (!lodash_1.isNil(node)) {
            dir = node.path;
            if (!node.isFolder) {
                return [];
            }
        }
        const list = await this.fs.list(dir);
        const folders = list.directories.map((x) => new storageExplorerTreeNode_1.StorageExplorerTreeNode(x, true));
        const files = list.files.map((x) => new storageExplorerTreeNode_1.StorageExplorerTreeNode(x, false));
        return folders.concat(files);
    }
    async onUpload(node) {
        const dest = node.isFolder ? node.path : path.posix.dirname(node.path);
        const srcs = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: true,
            defaultUri: !lodash_1.isNil(vscode.workspace.rootPath) ? vscode.Uri.file(vscode.workspace.rootPath) : null
        });
        if (lodash_1.isEmpty(srcs)) {
            return;
        }
        await Promise.all(srcs.map(async (src) => this.fs.upload_r(src.fsPath, dest)));
        this.refresh();
    }
    async onUploadFolder(node) {
        const dest = node.isFolder ? node.path : path.posix.dirname(node.path);
        const srcs = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: !lodash_1.isNil(vscode.workspace.rootPath) ? vscode.Uri.file(vscode.workspace.rootPath) : null
        });
        if (lodash_1.isEmpty(srcs)) {
            return;
        }
        await Promise.all(srcs.map(async (src) => this.fs.upload_r(src.fsPath, dest)));
        this.refresh();
    }
    async onDownload(node) {
        const folders = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: !lodash_1.isNil(vscode.workspace.rootPath) ? vscode.Uri.file(vscode.workspace.rootPath) : null,
            openLabel: 'Select Save Folder'
        });
        if (lodash_1.isEmpty(folders)) {
            return;
        }
        const dest = folders[0].fsPath;
        await this.fs.download_r(node.path, dest, node.isFolder);
    }
    async onMkdir(node) {
        const name = await vscode.window.showInputBox({
            prompt: 'Please input the folder name'
        });
        if (lodash_1.isEmpty(name)) {
            return;
        }
        const parent = node.isFolder ? node.path : path.posix.dirname(node.path);
        await this.fs.mkdir(path.posix.join(parent, name));
        this.refresh();
    }
    async onDelete(node) {
        if (node.isFolder) {
            await this.fs.rmdir_r(node.path);
        }
        else {
            await this.fs.remove(path.dirname(node.path), path.basename(node.path));
        }
        this.refresh();
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], StorageExplorerTreeDataProvider.prototype, "context", void 0);
StorageExplorerTreeDataProvider = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], StorageExplorerTreeDataProvider);
exports.StorageExplorerTreeDataProvider = StorageExplorerTreeDataProvider;
//# sourceMappingURL=storageExplorerTreeDataProvider.js.map