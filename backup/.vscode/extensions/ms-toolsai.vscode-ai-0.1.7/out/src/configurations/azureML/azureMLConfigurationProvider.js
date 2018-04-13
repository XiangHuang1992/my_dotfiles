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
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const azureMLCli_1 = require("configurations/azureML/azureMLCli");
const azureMLConfigTreeView_1 = require("configurations/azureML/azureMLConfigTreeView");
const azureMLJobService_1 = require("configurations/azureML/azureMLJobService");
const azureMLRunConfigure_1 = require("configurations/azureML/azureMLRunConfigure");
const amlUtil = require("configurations/azureML/azureMLUtil");
const cc = require("configurations/azureML/compute-target");
const constants = require("extensionConstants");
const configuration_1 = require("interfaces/configuration");
const registerProvider_1 = require("interfaces/registerProvider");
const configExplorerTreeDataProvider_1 = require("treeView/configExplorer/configExplorerTreeDataProvider");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const openDialogToolkit_1 = require("uiToolkits/openDialogToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const globalStateKey = '4d0e9b7f-4518-47c3-8eea-2bb22dbe8f58';
const defaultPropertiesObject = {
    kind: 'object',
    object: {
        version: '0.0.1',
        azureMachineLearningPath: ''
    }
};
/**
 * TBC
 * @class AzureMLGalleryProvider
 */
let AzureMLGalleryProvider = class AzureMLGalleryProvider {
    get name() {
        return 'Azure Machine Learning';
    }
    get webAPIUri() {
        return vscode.Uri.parse('https://go.microsoft.com/fwlink/?linkid=866043');
    }
    async createProjectFromUri(uri, defaultName) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'create project from gallery', platform: 'Azure ML', url: `${uri}` });
        const projectName = await this.getProjectName(defaultName);
        if (lodash_1.isNil(projectName)) {
            throw new Error('Get project name failed');
        }
        const workspace = await this.getWorkSpaceInfo();
        if (lodash_1.isNil(workspace)) {
            throw new Error('Get workspace failed');
        }
        const installationFolder = await this.getInstallationFolder(path.join(os.homedir(), 'documents', 'amlworkbench'));
        if (lodash_1.isEmpty(installationFolder)) {
            throw new Error('Get installation folder failed');
        }
        this.outputChannel.appendLine('Creating project....');
        const args = [
            `-n "${projectName}"`,
            `-u ${uri}`,
            `-a "${workspace.accountName}"`,
            `-w "${workspace.workSpaceName}"`,
            `-g "${workspace.resourceGroup}"`,
            `-l "${workspace.location}"`,
            '-o json'
        ];
        await this.azureMLCLI.getJson(`az ml project create ${args.join(' ')}`, installationFolder);
        return path.join(installationFolder, projectName);
    }
    async getInstallationFolder(defaultPath) {
        this.outputChannel.appendLine('Please select the project installation folder');
        await fs.ensureDir(defaultPath);
        const res = await openDialogToolkit_1.showOpenDialog({
            defaultUri: vscode.Uri.file(path.join(os.homedir(), 'documents', 'amlworkbench')),
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false
        }, 'Please select the project installation folder');
        return lodash_1.isEmpty(res) ? undefined : res[0].fsPath;
    }
    async getProjectName(defaultName) {
        this.outputChannel.appendLine('Please input the project name');
        return await vscode.window.showInputBox({
            prompt: 'Please input the project name',
            value: defaultName.replace(/ /g, '').toLowerCase(),
            ignoreFocusOut: true
        });
    }
    async getWorkSpaceInfo() {
        this.outputChannel.appendLine('Getting account list....');
        const accountOutput = await quickPickerToolkit_1.showQuickPick(this.getAccounts().then((res) => res.filter((x) => !lodash_1.isNil(x)).map((element) => ({
            label: element.name,
            description: '',
            context: element
        }))), 'Select a account');
        if (lodash_1.isNil(accountOutput)) {
            return;
        }
        this.outputChannel.appendLine('Getting workspace list....');
        const accountName = accountOutput.context.name;
        const resourceGroup = accountOutput.context.resourceGroup;
        const location = accountOutput.context.location;
        const workspaceOutput = await quickPickerToolkit_1.showQuickPick(this.getWorkspaces(accountName, resourceGroup).then((res) => res.filter((x) => !lodash_1.isNil(x)).map((element) => ({
            label: element.name,
            description: '',
            context: element
        }))), 'Select a workspace');
        if (lodash_1.isNil(workspaceOutput)) {
            return;
        }
        return {
            accountName,
            location,
            resourceGroup,
            workSpaceName: workspaceOutput.context.name
        };
    }
    async getAccounts() {
        try {
            let accounts = [];
            const groups = await this.getResourceGroups();
            await Promise.all(groups.map(async (group) => this.azureMLCLI.getJsonCached(`az ml account experimentation list -g ${group.name} -o json`).then((x) => {
                accounts = accounts.concat(x);
            })));
            return accounts;
        }
        catch (e) {
            throw new Error(`List experimentation account failed: ${e.message}`);
        }
    }
    async getWorkspaces(account, resourceGroup) {
        try {
            return this.azureMLCLI.getJsonCached(`az ml workspace list -a ${account} -g ${resourceGroup} -o json`);
        }
        catch (e) {
            throw new Error(`List workspace failed: ${e.message}`);
        }
    }
    async getResourceGroups() {
        try {
            return this.azureMLCLI.getJsonCached('az group list -o json');
        }
        catch (e) {
            throw new Error(`List resource groups failed: ${e.message}`);
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", azureMLCli_1.AzureMLCLI)
], AzureMLGalleryProvider.prototype, "azureMLCLI", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLGalleryProvider.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], AzureMLGalleryProvider.prototype, "telemetryManager", void 0);
AzureMLGalleryProvider = __decorate([
    component.Singleton
], AzureMLGalleryProvider);
/**
 * TBD
 * @class AzureMLConfigurationEditor
 */
let AzureMLConfigurationEditor = class AzureMLConfigurationEditor {
    constructor() {
        void this.logger.debug('AzureMLConfigurationEditor created');
    }
    async addConfiguration(provider) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'add configuration', platform: 'Azure ML' });
        try {
            const configuration = await this.azureMLRunConfigure.createRunConfiguration();
            this.outputChannel.appendLine(`=== Configuration ${configuration} added ===`);
        }
        catch (e) {
            void vscode.window.showWarningMessage(e.message);
            this.outputChannel.appendLine('=== Add configuration canceled ===');
        }
    }
    async editConfiguration(provider, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'edit configuration', platform: 'Azure ML' });
        const configName = configuration.name;
        const fileName = configuration.fileName;
        const ret = await component.get(editorToolkit_1.EditorToolkit).editFile(fileName, 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', undefined, true);
        if (ret.continue) {
            this.outputChannel.appendLine(`=== Configuration ${configName} Saved ===`);
        }
        else {
            this.outputChannel.appendLine(`=== Edit ${configName} canceled ===`);
        }
    }
    async removeConfiguration(provider, configuration) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'remove configuration', platform: 'Azure ML' });
        const configName = configuration.name;
        const fileName = configuration.fileName;
        if (lodash_1.isNil(fileName) || lodash_1.isNil(fileName.fsPath)) {
            this.outputChannel.appendLine('Remove configuration failed: can not find the configuration file');
        }
        const configurationName = path.basename(fileName.fsPath, path.extname(fileName.fsPath));
        try {
            await this.azureMLRunConfigure.removeRunconfiguration(configurationName);
            await cc.getConfigurations(true, false);
            this.outputChannel.appendLine(`=== Configuration ${configName} removed ===`);
        }
        catch (e) {
            void vscode.window.showWarningMessage(e.message);
            this.outputChannel.appendLine(`=== Remove ${configName} failed ===`);
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", azureMLRunConfigure_1.AzureMLRunConfigure)
], AzureMLConfigurationEditor.prototype, "azureMLRunConfigure", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLConfigurationEditor.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], AzureMLConfigurationEditor.prototype, "telemetryManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], AzureMLConfigurationEditor.prototype, "logger", void 0);
AzureMLConfigurationEditor = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], AzureMLConfigurationEditor);
/**
 * TBC
 * @class AzureMLConfigurationProvider
 */
let AzureMLConfigurationProvider = class AzureMLConfigurationProvider extends configuration_1.ConfigurationProvider {
    /**
     * TBC
     * @class AzureMLConfigurationProvider
     */
    constructor() {
        super(...arguments);
        this.treeView = new azureMLConfigTreeView_1.AzureMLPlatformTreeNode(this);
    }
    async register() {
        vscode.workspace.onDidChangeConfiguration(async () => {
            await this.onConfigChange();
        });
        await this.onConfigChange();
    }
    get type() {
        return 'AzureML';
    }
    get description() {
        return 'Azure Machine Learning';
    }
    get configurationEditor() {
        return this.azureMLConfigurationEditor;
    }
    get jobService() {
        return this.ujobService;
    }
    get gallery() {
        return this.galleryProvider;
    }
    get enabled() {
        return this.uEnabled;
    }
    get exclusive() {
        return this.uExclusive;
    }
    async getAllConfigurations() {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('Please open an Azure ML project folder first.');
        }
        const configurations = await cc.getConfigurations(true, true);
        if (lodash_1.isEmpty(configurations)) {
            return [];
        }
        return configurations.map((configuration) => ({
            kind: 'file',
            fileName: vscode.Uri.file(path.join(vscode.workspace.rootPath, 'aml_config', `${configuration}.runconfig`)),
            type: this.type,
            id: configuration,
            name: configuration
        }));
    }
    async getConfiguration(id) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath) || !await fs.pathExists(path.join(vscode.workspace.rootPath, 'aml_config'))) {
            throw new Error('Please open an Azure ML project folder first.');
        }
        if (id === constants.azureMLDefaultConfigurationID) {
            return {
                kind: 'file',
                type: this.type,
                id: constants.azureMLDefaultConfigurationID,
                fileName: undefined
            };
        }
        else {
            const configurations = await cc.getConfigurations(false, true);
            for (const configuration of configurations) {
                if (id === configuration) {
                    return {
                        type: this.type,
                        id: configuration,
                        name: configuration,
                        kind: 'file',
                        fileName: vscode.Uri.file(path.join(vscode.workspace.rootPath, 'aml_config', `${configuration}.runconfig`))
                    };
                }
            }
        }
    }
    async createConfiguration() {
        throw new Error('Not supported');
    }
    async addOrUpdateConfiguration(configuration) {
        return;
    }
    async removeConfiguration(id) {
        return;
    }
    async validateConfiguration(configuration) {
        return {
            state: 'OK'
        };
    }
    async onConfigChange() {
        const config = vscode.workspace.getConfiguration('ai.azureml');
        const enabled = await this.checkAzureMLWorkbenchExisting() && config.get('enable');
        const exclusive = enabled && config.get('exclusive-mode');
        this.uExclusive = exclusive;
        this.uEnabled = enabled;
        await this.setShowAmlCommandContext(enabled);
        component.get(configExplorerTreeDataProvider_1.ConfigExplorerTreeDataProvider).refresh();
    }
    async checkAzureMLWorkbenchExisting() {
        const amlwbPath = amlUtil.getAzureMLWorkbenchPath();
        const pythonPath = amlUtil.getAzureMLWorkbenchPythonPath();
        const installed = await fs.pathExists(amlwbPath) && await fs.pathExists(pythonPath);
        if (!installed) {
            return false;
        }
        if (os.platform() === 'win32') {
            const amlwbLocation = path.join(process.env.APPDATA, 'AmlWorkbench', 'amlwbLocation');
            const actived = await fs.pathExists(amlwbLocation);
            if (!actived) {
                void vscode.window.showWarningMessage('Please active your AzureML workbench first.');
                return false;
            }
        }
        return true;
    }
    async setShowAmlCommandContext(show) {
        await vscode.commands.executeCommand('setContext', 'azuremlEnable', show ? 1 : 0);
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], AzureMLConfigurationProvider.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", azureMLJobService_1.AzureMLJobService)
], AzureMLConfigurationProvider.prototype, "ujobService", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", azureMLCli_1.AzureMLCLI)
], AzureMLConfigurationProvider.prototype, "azureMLCLI", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", AzureMLGalleryProvider)
], AzureMLConfigurationProvider.prototype, "galleryProvider", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLConfigurationProvider.prototype, "outputChannel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", AzureMLConfigurationEditor)
], AzureMLConfigurationProvider.prototype, "azureMLConfigurationEditor", void 0);
AzureMLConfigurationProvider = __decorate([
    component.Export(configuration_1.ConfigurationProvider),
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton
], AzureMLConfigurationProvider);
exports.AzureMLConfigurationProvider = AzureMLConfigurationProvider;
//# sourceMappingURL=azureMLConfigurationProvider.js.map