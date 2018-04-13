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
const json = require("comment-json");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const localConfigurationProvider_1 = require("configurations/local/localConfigurationProvider");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Local Debugger Configuration
 */
let LocalDebuggerConfiguration = class LocalDebuggerConfiguration {
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.addDebuggerConfiguration', async () => {
            await progressToolkit_1.withProgress('Set Local Environment To Launch', async () => this.addLauncherConfiguration());
        }));
    }
    async getQuickPickItems() {
        if (lodash_1.isEmpty(vscode.workspace.rootPath)) {
            throw new Error('Please open a folder');
        }
        const configurations = await this.provider.getAllConfigurations();
        if (lodash_1.isEmpty(configurations)) {
            throw new Error(`No python configuration found for ${this.provider.description}, please add one in AI Explorer.`);
        }
        return configurations.filter((config) => config.properties.pythonPath).map((config) => ({
            label: config.name,
            description: config.description,
            context: config
        }));
    }
    async addLauncherConfiguration() {
        const configNode = await quickPickerToolkit_1.showQuickPick(this.getQuickPickItems(), 'Select configuration for Local');
        if (lodash_1.isNil(configNode)) {
            if (lodash_1.isUndefined(configNode)) {
                await vscode.window.showWarningMessage('No local configuration selected');
            }
            return;
        }
        this.channel.appendLine(`Configuration: ${configNode.label} selected`);
        const selectConfig = configNode.context;
        if (!path.isAbsolute(selectConfig.properties.pythonPath)) {
            await vscode.window.showWarningMessage('Absolute path is required, please edit the python path in configuration');
            return;
        }
        const launchFolder = path.join(vscode.workspace.rootPath, '.vscode');
        const launchPath = path.join(launchFolder, 'launch.json');
        try {
            await fs.ensureDir(launchFolder);
        }
        catch (e) {
            this.channel.appendLine(`No launch file found and can not create: ${e.message}`);
            return;
        }
        if (await fs.pathExists(launchPath)) {
            try {
                let launch;
                const content = await fs.readFile(launchPath, 'utf8');
                try {
                    launch = await json.parse(content);
                }
                catch (e) {
                    this.channel.appendLine(`Can not parse launch.json, please check: ${e.message}`);
                    await this.logger.error(e, content);
                    throw new Error('Can not parse launch.json');
                }
                // tslint:disable:no-invalid-template-strings
                launch.configurations.push({
                    name: `python - ${selectConfig.name}`,
                    type: 'python',
                    request: 'launch',
                    stopOnEntry: true,
                    pythonPath: `${selectConfig.properties.pythonPath}`,
                    program: '${file}',
                    cwd: '${workspaceRoot}',
                    env: {},
                    envFile: '${workspaceRoot}/.env',
                    debugOptions: [
                        'WaitOnAbnormalExit',
                        'WaitOnNormalExit',
                        'RedirectOutput'
                    ]
                });
                await fs.writeFile(launchPath, json.stringify(launch, null, 4));
            }
            catch (e) {
                await vscode.window.showWarningMessage(`Can not add the environemnt into launch, err: ${e.message}`);
            }
        }
        else {
            await vscode.window.showWarningMessage('No launch found, please use command \'Debug: Open Launch.json\' to create one');
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], LocalDebuggerConfiguration.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", localConfigurationProvider_1.LocalConfigurationProvider)
], LocalDebuggerConfiguration.prototype, "provider", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], LocalDebuggerConfiguration.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], LocalDebuggerConfiguration.prototype, "logger", void 0);
LocalDebuggerConfiguration = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], LocalDebuggerConfiguration);
exports.LocalDebuggerConfiguration = LocalDebuggerConfiguration;
//# sourceMappingURL=localDebuggerConfiguration.js.map