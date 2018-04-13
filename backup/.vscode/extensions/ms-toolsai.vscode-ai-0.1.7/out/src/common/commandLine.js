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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const inversify_1 = require("inversify");
const lodash_1 = require("lodash");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const telemetryManager_1 = require("common/telemetryManager");
const util_1 = require("common/util");
/**
 * Base class for command line
 * @class CommandLine
 */
let CommandLine = class CommandLine {
    constructor(name) {
        this.terminalStack = [];
        this.extensionContext.subscriptions.push(vscode.window.onDidCloseTerminal((terminal) => {
            this.killCli(terminal);
        }));
        this.terminalName = name;
        this.setupScriptPromise = this.setupScriptFile();
    }
    async setupScriptFile() {
        const lines = await this.getInitialScript();
        await this.writeScript(lines);
    }
    async openCli() {
        await this.setupScriptPromise;
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'open cli', terminalName: `${this.terminalName}` });
        const terminal = vscode.window.createTerminal(this.terminalName, this.terminalCmd, this.terminalArgs);
        this.terminalStack.push(terminal);
        terminal.show(false);
        // terminal display bug after vscode 1.17
        terminal.hide();
        terminal.show(false);
    }
    killCli(terminal) {
        this.telemetryManager.enqueueTelemetryMsg('ExecuteCommand', { Name: 'kill cli', terminalName: `${this.terminalName}` });
        const idx = this.terminalStack.indexOf(terminal);
        if (this.terminalStack.indexOf(terminal) >= 0) {
            this.terminalStack.splice(idx, 1);
        }
    }
    async sendToCli(text) {
        this.telemetryManager.enqueueTelemetryMsg('Execute', { Name: 'sendToCli', text: `${text}` });
        if (lodash_1.isEmpty(this.terminalStack)) {
            await this.openCli();
        }
        this.getLatestTerminal().sendText(text);
        this.getLatestTerminal().show(false);
    }
    getLatestTerminal() {
        return this.terminalStack[this.terminalStack.length - 1];
    }
    async runInProcess(command, workingFolder) {
        this.telemetryManager.enqueueTelemetryMsg('Execute', { Name: 'runInProcess', text: `${command}` });
        let ret = null;
        if (os.platform() === 'win32') {
            await this.setupScriptPromise;
            ret = await util_1.exec(`${this.scriptPath} ${command}`, {
                cwd: workingFolder
            });
        }
        else if (os.platform() === 'darwin' || os.platform() === 'linux') {
            ret = await util_1.exec(command, {
                env: Object.assign({}, process.env, await this.getEnv()),
                cwd: workingFolder
            });
        }
        else {
            throw Error('Not supported');
        }
        return ret;
    }
    async spawnInProcess(command, workingFolder) {
        this.telemetryManager.enqueueTelemetryMsg('Execute', { Name: 'spawnInProcess', text: `${command}` });
        let p = null;
        if (os.platform() === 'win32') {
            await this.setupScriptPromise;
            p = util_1.spawn(`${this.scriptPath} ${command}`, {
                shell: true,
                cwd: workingFolder
            });
        }
        else if (os.platform() === 'darwin') {
            p = util_1.spawn(command, {
                shell: true,
                env: Object.assign({}, process.env, await this.getEnv()),
                cwd: workingFolder
            });
        }
        else {
            throw Error('Not supported');
        }
        return p;
    }
    get scriptPath() {
        if (os.platform() === 'win32') {
            return path.join(this.extensionContext.extensionPath, 'out', 'scripts', `${this.scriptName}.cmd`);
        }
        else if (os.platform() === 'darwin' || os.platform() === 'linux') {
            return path.join(this.extensionContext.extensionPath, 'out', 'scripts', `${this.scriptName}.sh`);
        }
    }
    async getInitialScript() {
        let env = await this.getEnv();
        if (env === undefined) {
            env = {};
        }
        if (os.platform() === 'win32') {
            return [
                '@echo off',
                ...Object.keys(env).map((key) => `SET ${key}=${env[key]}`),
                '%*'
            ];
        }
        else if (os.platform() === 'darwin') {
            return [
                `env ${Object.keys(env).map((key) => `${key}=${env[key]}`).join(' ')} ${process.env.SHELL}`
            ];
        }
    }
    async writeScript(lines) {
        await fs.writeFile(this.scriptPath, lines.map((x) => `${x}\n`).join(''));
    }
    get terminalCmd() {
        if (os.platform() === 'win32') {
            return process.env.COMSPEC;
        }
        else if (os.platform() === 'darwin' || os.platform() === 'linux') {
            return process.env.SHELL;
        }
    }
    get terminalArgs() {
        if (os.platform() === 'win32') {
            return ['/K ', this.scriptPath];
        }
        else if (os.platform() === 'darwin' || os.platform() === 'linux') {
            return [this.scriptPath];
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], CommandLine.prototype, "logger", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], CommandLine.prototype, "extensionContext", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", telemetryManager_1.TelemetryManager)
], CommandLine.prototype, "telemetryManager", void 0);
CommandLine = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.unmanaged()),
    __metadata("design:paramtypes", [String])
], CommandLine);
exports.CommandLine = CommandLine;
//# sourceMappingURL=commandLine.js.map