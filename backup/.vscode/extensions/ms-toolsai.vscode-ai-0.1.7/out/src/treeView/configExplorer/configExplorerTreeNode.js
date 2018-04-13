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
const logger_1 = require("common/logger");
/**
 * Config Explorer Tree Node
 */
class ConfigExplorerTreeNode extends vscode.TreeItem {
}
exports.ConfigExplorerTreeNode = ConfigExplorerTreeNode;
/**
 * Common Platform Config Tree Node
 */
class BaseConfigTreeNode {
    constructor(provider, config) {
        this.contextValue = 'BaseConfig';
        this.provider = provider;
        this.config = config;
    }
    get label() {
        return this.config.name;
    }
    get iconPath() {
        return {
            dark: path.join(this.context.extensionPath, 'icons', 'config_dark.png'),
            light: path.join(this.context.extensionPath, 'icons', 'config_light.png')
        };
    }
    async getChildren() {
        return [];
    }
}
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], BaseConfigTreeNode.prototype, "context", void 0);
exports.BaseConfigTreeNode = BaseConfigTreeNode;
/**
 * Common Platform Tree Node
 */
class BasePlatformTreeNode {
    constructor(provider) {
        this.contextValue = 'BasePlatform';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.provider = provider;
    }
    get label() {
        return this.provider.description;
    }
    get iconPath() {
        return {
            dark: path.join(this.context.extensionPath, 'icons', `${this.provider.type}_dark.png`),
            light: path.join(this.context.extensionPath, 'icons', `${this.provider.type}_light.png`)
        };
    }
    async getChildren() {
        try {
            const configs = await this.provider.getAllConfigurations();
            return configs.map((x) => this.getChild(x));
        }
        catch (e) {
            void this.logger.error(e);
            return [];
        }
    }
    getChild(config) {
        return new BaseConfigTreeNode(this.provider, config);
    }
}
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], BasePlatformTreeNode.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], BasePlatformTreeNode.prototype, "logger", void 0);
exports.BasePlatformTreeNode = BasePlatformTreeNode;
//# sourceMappingURL=configExplorerTreeNode.js.map