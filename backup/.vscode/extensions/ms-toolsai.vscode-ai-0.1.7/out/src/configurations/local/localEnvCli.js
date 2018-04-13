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
const os = require("os");
const path = require("path");
const commandLine_1 = require("common/commandLine");
const component = require("common/component");
/**
 * Local Enviroment CLI
 */
let LocalEnvCLI = class LocalEnvCLI extends commandLine_1.CommandLine {
    constructor() {
        super('AI Local CLI');
        void this.logger.debug('AI Local CLI singleton created');
    }
    get scriptName() {
        return 'pythonTerminal';
    }
    async getEnv() {
        if (!lodash_1.isEmpty(this.pythonPath)) {
            const pythonPath = this.pythonPath;
            const pythonScriptPath = path.join(pythonPath, 'Scripts');
            if (os.platform() === 'win32') {
                return {
                    PATH: `${pythonScriptPath}${path.delimiter}${pythonPath}${path.delimiter}${process.env.PATH}`,
                    PYTHON_BIN_PATH: pythonPath,
                    PYTHON_EXEC_PATH: path.join(pythonPath, 'python.exe')
                };
            }
            else if (os.platform() === 'darwin' || os.platform() === 'linux') {
                return {
                    PATH: `${pythonScriptPath}${path.delimiter}${pythonPath}${path.delimiter}${process.env.PATH}`,
                    PWD: `${pythonPath}`
                };
            }
        }
        else {
            return {
                PATH: `${process.env.PATH}`
            };
        }
    }
};
LocalEnvCLI = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], LocalEnvCLI);
exports.LocalEnvCLI = LocalEnvCLI;
//# sourceMappingURL=localEnvCli.js.map