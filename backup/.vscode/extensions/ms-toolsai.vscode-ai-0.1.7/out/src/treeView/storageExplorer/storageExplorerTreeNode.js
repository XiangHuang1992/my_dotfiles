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
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
/**
 * Storage Explorer Tree Node
 */
class StorageExplorerTreeNode {
    constructor(dir, isFolder) {
        this.path = dir;
        this.isFolder = isFolder;
        this.label = path.basename(this.path);
        if (this.isFolder) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            this.contextValue = 'StorageFolder';
            this.iconPath = {
                dark: path.join(this.context.extensionPath, 'icons', 'folder_dark.png'),
                light: path.join(this.context.extensionPath, 'icons', 'folder_light.png')
            };
        }
        else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
            this.contextValue = 'StorageFile';
            this.iconPath = {
                dark: path.join(this.context.extensionPath, 'icons', 'file_dark.png'),
                light: path.join(this.context.extensionPath, 'icons', 'file_light.png')
            };
        }
    }
}
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], StorageExplorerTreeNode.prototype, "context", void 0);
exports.StorageExplorerTreeNode = StorageExplorerTreeNode;
//# sourceMappingURL=storageExplorerTreeNode.js.map