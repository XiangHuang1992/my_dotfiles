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
const component = require("common/component");
const logger_1 = require("common/logger");
/**
 * Output channel
 */
let OutputChannel = class OutputChannel {
    constructor() {
        this.channel = vscode.window.createOutputChannel('AI Output');
        void this.logger.debug('OutputChannel singleton created');
    }
    append(text) {
        this.channel.show();
        this.channel.append(text);
    }
    appendLine(text) {
        this.channel.show();
        this.channel.appendLine(text);
    }
    clear() {
        this.channel.clear();
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], OutputChannel.prototype, "logger", void 0);
OutputChannel = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], OutputChannel);
exports.OutputChannel = OutputChannel;
//# sourceMappingURL=outputChannel.js.map