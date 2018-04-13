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
const vscode = require("vscode");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const outputChannel_1 = require("uiToolkits/outputChannel");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Job properties manager
 */
let JobPropertiesManager = class JobPropertiesManager {
    constructor() {
        void this.logger.debug('JobPropertiesManager singleton created');
    }
    register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.editJobProperties', async () => {
            await progressToolkit_1.withProgress('Edit Job Properties', async () => this.editProperties());
        }));
    }
    get defaultProperties() {
        return {
            version: '0.0.1',
            job: {
                type: 'General',
                files: {
                    includes: [
                        '**/*.py'
                    ]
                },
                author: 'UserName',
                name: '',
                startupCommand: 'python',
                startupScript: '',
                arguments: '',
                workingDirectory: '.',
                batchArguments: []
            },
            platform: {}
        };
    }
    async getProperties() {
        if (lodash_1.isEmpty(vscode.workspace.rootPath)) {
            throw new Error('Please open a folder to edit job properties.');
        }
        const vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
        const propertiesFile = path.join(vscodeFolder, 'ai_job_properties.json');
        if (!await fs.pathExists(propertiesFile)) {
            return null;
        }
        return fs.readJson(propertiesFile);
    }
    async saveProperties(prop) {
        if (lodash_1.isEmpty(vscode.workspace.rootPath)) {
            throw new Error('Please open a folder to edit job properties.');
        }
        const vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
        await fs.ensureDir(vscodeFolder);
        const propertiesFileName = path.join(vscodeFolder, 'ai_job_properties.json');
        await fs.writeJson(propertiesFileName, prop, { spaces: 4 });
    }
    async editProperties(prop, validator) {
        if (lodash_1.isNil(prop)) {
            prop = await this.getProperties();
            if (lodash_1.isNil(prop)) {
                throw new Error('Job properties JSON file not found');
            }
        }
        return await component.get(editorToolkit_1.EditorToolkit).editObject(prop, 'ai_job_properties.json', 'Editing job properties... Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', validator);
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], JobPropertiesManager.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], JobPropertiesManager.prototype, "channel", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], JobPropertiesManager.prototype, "logger", void 0);
JobPropertiesManager = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton,
    __metadata("design:paramtypes", [])
], JobPropertiesManager);
exports.JobPropertiesManager = JobPropertiesManager;
/**
 * Default Job Properties Editor
 */
class DefaultJobPropertiesEditor {
    async process(startup) {
        let jobConfig;
        try {
            jobConfig = await this.init(startup);
        }
        catch (e) {
            this.channel.appendLine(e.message);
            throw e;
        }
        const mustEdit = vscode.workspace.getConfiguration('ai.submission').get('always-open-jobproperties');
        const validateResult = await this.validate(jobConfig);
        if (mustEdit || !validateResult.valid) {
            let hint = 'Please check the job properties...';
            if (!validateResult.valid && !lodash_1.isEmpty(validateResult.reason)) {
                hint = `${validateResult.reason} ${hint}`;
            }
            void vscode.window.showInformationMessage(hint);
            const result = await this.edit(jobConfig);
            if (!result.continue) {
                this.channel.appendLine('Submitting canceled...');
                return;
            }
            else {
                jobConfig = result.object;
            }
        }
        await this.manager.saveProperties(jobConfig);
        return jobConfig;
    }
    async init(startup) {
        let res = await this.manager.getProperties();
        if (lodash_1.isNil(res)) {
            res = this.manager.defaultProperties;
        }
        else {
            if (lodash_1.isNil(res.job) || typeof res.platform !== 'object') {
                res.job = this.manager.defaultProperties.job;
            }
            if (lodash_1.isNil(res.platform) || typeof res.platform !== 'object') {
                res.platform = this.manager.defaultProperties.platform;
            }
        }
        if (lodash_1.isEmpty(res.job.name)) {
            res.job.name = await vscode.window.showInputBox({ placeHolder: 'Please input a job name' });
        }
        if (!lodash_1.isEmpty(startup)) {
            if (path.isAbsolute(startup)) {
                startup = path.relative(vscode.workspace.rootPath, startup);
            }
            res.job.startupScript = startup;
        }
        return res;
    }
    async edit(prop) {
        return this.manager.editProperties(prop, this.validate);
    }
    async validate(prop) {
        if (lodash_1.isNil(prop.job) || lodash_1.isEmpty(prop.job.startupScript)) {
            return { valid: false, reason: 'No startup Script found.' };
        }
        return { valid: true };
    }
}
__decorate([
    component.Inject,
    __metadata("design:type", JobPropertiesManager)
], DefaultJobPropertiesEditor.prototype, "manager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], DefaultJobPropertiesEditor.prototype, "channel", void 0);
exports.DefaultJobPropertiesEditor = DefaultJobPropertiesEditor;
//# sourceMappingURL=jobPropertiesManager.js.map