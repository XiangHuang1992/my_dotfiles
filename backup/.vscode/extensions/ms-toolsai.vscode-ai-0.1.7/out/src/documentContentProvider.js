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
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const registerProvider_1 = require("interfaces/registerProvider");
const webServer_1 = require("webServer");
/**
 * TBD
 * @class ConfigurationManager
 */
let DocumentContentProvider = class DocumentContentProvider {
    /**
     * TBD
     * @class ConfigurationManager
     */
    constructor() {
        this.scheme = 'vscodeai';
    }
    register() {
        this.context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(this.scheme, this));
    }
    provideTextDocumentContent(uri) {
        const port = this.webServer.port;
        return `<script>window.location.href="${this.getUrlString(uri)}"</script>`;
    }
    getUrlString(uri) {
        return `http://localhost:${this.webServer.port}${uri.path}?${uri.query}`;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], DocumentContentProvider.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", webServer_1.WebServer)
], DocumentContentProvider.prototype, "webServer", void 0);
DocumentContentProvider = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], DocumentContentProvider);
exports.DocumentContentProvider = DocumentContentProvider;
//# sourceMappingURL=documentContentProvider.js.map