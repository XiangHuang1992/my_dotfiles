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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const lodash_1 = require("lodash");
const vscode = require("vscode");
const component = require("common/component");
const configurationManager_1 = require("configurationManager");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
/**
 * Base class for configuration provider
 * @class ConfigurationProvider
 */
let ConfigurationProvider = class ConfigurationProvider {
    async selectConfig() {
        const configNode = await quickPickerToolkit_1.showQuickPick(this.getAllConfigurations().then(async (res) => res.map((config) => ({
            label: config.name,
            description: config.description,
            context: config
        }))), `Select configuration for ${this.type}`);
        if (lodash_1.isNil(configNode)) {
            return;
        }
        const validateResult = await this.validateConfiguration(configNode.context);
        if (validateResult.state !== 'OK') {
            void vscode.window.showWarningMessage(`${validateResult.reason} Please check the configuration...`);
            return await component.get(configurationManager_1.ConfigurationManager).editConfiguration(this, configNode.context);
        }
        else {
            return configNode.context;
        }
    }
};
ConfigurationProvider = __decorate([
    inversify_1.injectable()
], ConfigurationProvider);
exports.ConfigurationProvider = ConfigurationProvider;
//# sourceMappingURL=configuration.js.map