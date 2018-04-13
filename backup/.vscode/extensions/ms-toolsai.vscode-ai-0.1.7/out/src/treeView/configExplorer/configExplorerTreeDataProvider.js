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
const configurationManager_1 = require("configurationManager");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Config Explorer Tree Data Provider
 */
let ConfigExplorerTreeDataProvider = class ConfigExplorerTreeDataProvider {
    /**
     * Config Explorer Tree Data Provider
     */
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
    }
    get onDidChangeTreeData() {
        return this.onDidChangeEmitter.event;
    }
    register() {
        this.context.subscriptions.push(vscode.window.registerTreeDataProvider('AIConfigExplorer', this));
    }
    refresh(node) {
        this.onDidChangeEmitter.fire(node);
    }
    getTreeItem(node) {
        return node;
    }
    async getChildren(node) {
        if (lodash_1.isNil(node)) {
            const providers = await component.get(configurationManager_1.ConfigurationManager).getAllProviders();
            return providers.map((x) => x.treeView);
        }
        else {
            return node.getChildren();
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], ConfigExplorerTreeDataProvider.prototype, "context", void 0);
ConfigExplorerTreeDataProvider = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], ConfigExplorerTreeDataProvider);
exports.ConfigExplorerTreeDataProvider = ConfigExplorerTreeDataProvider;
//# sourceMappingURL=configExplorerTreeDataProvider.js.map