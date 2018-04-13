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
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const util_1 = require("common/util");
const constants = require("extensionConstants");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Telemetry Manager
 * @class TelemetryManager
 */
let TelemetryManager = class TelemetryManager {
    /**
     * Telemetry Manager
     * @class TelemetryManager
     */
    constructor() {
        this.extensionId = constants.extensionName;
        this.defaultExtensionVesion = '0.1.0';
        this.key = constants.appInsightKey;
        this.enabled = false;
    }
    async register() {
        if (vscode.workspace.getConfiguration('ai.telemetry').get('enable') === true) {
            this.messageQueue = [];
            this.enabled = true;
            await this.initialize(this.context.extensionPath);
        }
    }
    enqueueTelemetryMsg(eventName, properties, measures) {
        if (this.enabled) {
            this.messageQueue.push({
                eventName: eventName,
                properties: properties,
                measures: measures
            });
        }
    }
    stop() {
        this.enabled = false;
    }
    async initialize(extensionPath) {
        const packageFile = path.join(extensionPath, 'package.json');
        const version = (await fs.readJson(packageFile)).version;
        this.extensionVersion = !lodash_1.isEmpty(version) ? version : this.defaultExtensionVesion;
        this.reporter = new vscode_extension_telemetry_1.default(this.extensionId, this.extensionVersion, this.key);
        void this.start();
    }
    async start() {
        while (this.enabled) {
            await util_1.delay(5000);
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.pop();
                this.reporter.sendTelemetryEvent(msg.eventName, msg.properties, msg.measures);
            }
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], TelemetryManager.prototype, "context", void 0);
TelemetryManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], TelemetryManager);
exports.TelemetryManager = TelemetryManager;
//# sourceMappingURL=telemetryManager.js.map