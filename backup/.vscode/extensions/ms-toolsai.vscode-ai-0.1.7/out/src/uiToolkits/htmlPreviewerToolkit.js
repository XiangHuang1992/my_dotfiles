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
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const lodash_1 = require("lodash");
const component = require("common/component");
/**
 * HTML previewer toolkit
 */
let HTMLPreviewerToolkit = class HTMLPreviewerToolkit {
    async open(uri, title, column) {
        await vscode.commands.executeCommand('vscode.previewHtml', uri, this.selectViewColumn(column), title);
    }
    selectViewColumn(column) {
        switch (column) {
            case 'current':
                return vscode.ViewColumn.Active;
            case 'end':
                return vscode.ViewColumn.Three;
            // default case where splitPaneSelection is next or anything else
            // It's not "next". It's just a workaround. see https://github.com/Microsoft/vscode/issues/14483
            default:
                if (!lodash_1.isNil(vscode.window.activeTextEditor) && vscode.window.activeTextEditor.viewColumn === vscode.ViewColumn.One) {
                    return vscode.ViewColumn.Two;
                }
                else {
                    return vscode.ViewColumn.Three;
                }
        }
    }
};
HTMLPreviewerToolkit = __decorate([
    component.Singleton
], HTMLPreviewerToolkit);
exports.HTMLPreviewerToolkit = HTMLPreviewerToolkit;
//# sourceMappingURL=htmlPreviewerToolkit.js.map