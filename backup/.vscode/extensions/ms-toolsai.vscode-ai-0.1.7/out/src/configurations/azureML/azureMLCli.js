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
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const commandLine_1 = require("common/commandLine");
const component = require("common/component");
const amlUtil = require("configurations/azureML/azureMLUtil");
const outputChannel_1 = require("uiToolkits/outputChannel");
/**
 *  Azure ML CommandLine
 *  @class AzureMLCLI
 */
let AzureMLCLI = class AzureMLCLI extends commandLine_1.CommandLine {
    constructor() {
        super('AI Azure ML CLI');
        this.cache = new Map();
        void this.logger.debug('AzureMLCLI singleton created');
    }
    async checkCommand(command, workingFolder) {
        return (await super.runInProcess(command, workingFolder)).code === 0;
    }
    async runInProcess(command, workingFolder) {
        const ret = await super.runInProcess(command, workingFolder);
        if (ret.code !== 0) {
            const emsg = this.getErrorMessage(ret.stderr);
            let e = null;
            if (lodash_1.isEmpty(emsg)) {
                e = new Error(`Execute ${command} failed, exitcode: ${ret.code}`);
            }
            else {
                e = new Error(`Execute ${command} failed, ${emsg}`);
            }
            this.channel.appendLine(`Execute ${command} failed, exitcode: ${ret.code}`);
            if (!lodash_1.isEmpty(ret.stdout)) {
                this.channel.appendLine(`stdout: ${ret.stderr}`);
            }
            if (!lodash_1.isEmpty(ret.stderr)) {
                this.channel.appendLine(`stderr: ${ret.stderr}`);
            }
            await this.logger.error(e, ret);
            throw e;
        }
        return ret;
    }
    async spawnInProcess(command, workingFolder) {
        const p = await super.spawnInProcess(command, workingFolder);
        p.on('exit', (code) => {
            let buffer;
            let stderr = null;
            let stdout = null;
            buffer = p.stderr.read();
            if (!lodash_1.isNil(buffer)) {
                stderr = buffer.toString('utf8');
            }
            buffer = p.stdout.read();
            if (!lodash_1.isNil(buffer)) {
                stdout = buffer.toString('utf8');
            }
            if (code !== 0) {
                this.channel.appendLine(`Execute ${command} failed`);
                if (!lodash_1.isEmpty(stdout)) {
                    this.channel.append(stdout);
                }
                const emsg = this.getErrorMessage(stderr);
                if (!lodash_1.isEmpty(emsg)) {
                    void vscode.window.showErrorMessage(emsg);
                }
                void this.logger.error(`Spawn ${command} failed`, { code, stderr, stdout });
            }
        });
        return p;
    }
    async getJson(command, workingFolder) {
        const ret = await this.runInProcess(command, workingFolder);
        if (lodash_1.isEmpty(ret.stdout)) {
            return null;
        }
        try {
            return JSON.parse(ret.stdout);
        }
        catch (e) {
            void this.logger.error(e, ret);
            this.channel.appendLine(`Execute ${command} failed`);
            if (!lodash_1.isEmpty(ret.stdout)) {
                this.channel.append(ret.stdout);
                throw new Error('Please check output for more information');
            }
            else {
                throw new Error('Parse JSON failed.');
            }
        }
    }
    async getJsonCached(command, workingFolder, force) {
        let res = null;
        const key = `${command}$$${workingFolder}`;
        if (this.cache.has(key) && force !== true) {
            res = this.cache.get(key);
            this.cache.set(key, this.getJson(command, workingFolder));
        }
        else {
            this.cache.set(key, this.getJson(command, workingFolder));
            res = this.cache.get(key);
        }
        return res;
    }
    clearCache() {
        this.cache.clear();
    }
    get scriptName() {
        return 'azMlTerminal';
    }
    async getEnv() {
        const pythonPath = amlUtil.getAzureMLWorkbenchPythonPath();
        const azureCliPath = amlUtil.getAzureMLWorkbenchCLIPath();
        if (os.platform() === 'win32') {
            return {
                PATH: `${azureCliPath}${path.delimiter}${pythonPath}${path.delimiter}${process.env.PATH}`,
                PYTHON_BIN_PATH: pythonPath,
                PYTHON_EXEC_PATH: path.join(pythonPath, 'python.exe'),
                AML_WORKBENCH_CLI_CALLER: 'AMLvscode'
            };
        }
        else if (os.platform() === 'darwin') {
            return {
                PATH: `${pythonPath}${path.delimiter}${process.env.PATH}`,
                PWD: `${pythonPath}`,
                AML_WORKBENCH_CLI_CALLER: 'AMLvscode'
            };
        }
    }
    getErrorMessage(stderr) {
        if (lodash_1.isEmpty(stderr)) {
            return;
        }
        let matches;
        matches = stderr.match(/^ERROR\:.*$/m);
        if (!lodash_1.isEmpty(matches)) {
            return matches[0];
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", outputChannel_1.OutputChannel)
], AzureMLCLI.prototype, "channel", void 0);
AzureMLCLI = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], AzureMLCLI);
exports.AzureMLCLI = AzureMLCLI;
//# sourceMappingURL=azureMLCli.js.map