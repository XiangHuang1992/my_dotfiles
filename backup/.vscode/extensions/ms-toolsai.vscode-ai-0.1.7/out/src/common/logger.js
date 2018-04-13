/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
// tslint:disable:no-any
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
const moment = require("moment");
const os = require("os");
const path = require("path");
const winston = require("winston");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
/**
 * Logger
 */
let Logger = class Logger {
    /**
     * Logger
     */
    constructor() {
        this.logDebug = false;
    }
    async log(level, msg, meta) {
        if (lodash_1.isNil(this.initializePromise)) {
            this.initializePromise = this.initialize();
        }
        await this.initializePromise;
        if (!lodash_1.isNull(this.logger)) {
            this.logger.log(level, msg, meta);
        }
    }
    async error(err, meta) {
        if (typeof err === 'string') {
            await this.log('error', err, meta);
        }
        else {
            await this.log('error', err.message, { meta, stack: err.stack });
        }
    }
    async warn(msg, meta) {
        await this.log('warn', msg, meta);
    }
    async info(msg, meta) {
        await this.log('info', msg, meta);
    }
    async verbose(msg, meta) {
        await this.log('verbose', msg, meta);
    }
    /**
     * Debug message is only logged when logger.logDebug is true (default false).
     * @param msg message
     * @param meta metadata
     */
    async debug(msg, meta) {
        await this.log('debug', msg, meta);
    }
    async silly(msg, meta) {
        await this.log('silly', msg, meta);
    }
    async initialize() {
        const logPath = await this.getLogPath();
        if (!lodash_1.isNil(logPath)) {
            this.logger = new winston.Logger({
                transports: [
                    new winston.transports.File({
                        filename: logPath,
                        level: this.logDebug ? 'debug' : 'verbose'
                    })
                ]
            });
            this.logger.info(`VSCode Tools For AI ${await this.getVersion()}`);
            this.logger.info(`Platform: ${os.platform()}`);
        }
    }
    async getVersion() {
        const packageFile = path.join(this.context.extensionPath, 'package.json');
        return (await fs.readJson(packageFile)).version;
    }
    async getLogPath() {
        const dir = this.getLogDir();
        if (lodash_1.isEmpty(dir)) {
            return;
        }
        await fs.ensureDir(dir);
        const prefix = moment().format('YYYY-MM-DD[T]HHmmss');
        let filename = `${prefix}.log`;
        let cnt = 0;
        while (await fs.pathExists(path.join(dir, filename))) {
            cnt += 1;
            filename = `${prefix}-${cnt}.log`;
        }
        return path.join(dir, filename);
    }
    getLogDir() {
        if (os.platform() === 'win32') {
            return path.join(process.env.APPDATA, 'Microsoft', 'ToolsForAI', '.vscode');
        }
        else if (os.platform() === 'darwin') {
            return path.join(process.env.HOME, 'Library', 'Caches', 'AIToolsForVSCode');
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], Logger.prototype, "context", void 0);
Logger = __decorate([
    component.Singleton
], Logger);
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map