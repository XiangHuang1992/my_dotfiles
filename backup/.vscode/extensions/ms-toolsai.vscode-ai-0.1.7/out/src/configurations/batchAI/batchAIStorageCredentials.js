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
const Ajv = require("ajv"); // tslint:disable-line
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const progressToolkit_1 = require("uiToolkits/progressToolkit");
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Batch AI Storage Credentials
 */
let BatchAIStorageCredentials = class BatchAIStorageCredentials {
    constructor() {
        this.key = '50ed517e-fb68-49f6-b848-0d5772197db2';
        this.defaultConfig = {
            azureStorage: [
                {
                    name: 'contoso',
                    key: 'contosoKey'
                }
            ],
            linuxVM: [
                {
                    address: 'contoso.com',
                    port: 22,
                    account: {
                        username: 'contoso',
                        password: 'contosoPassword',
                        privateKeyFilePath: '/contoso/id_rsa',
                        privateKeyPassphrase: 'contoso'
                    }
                }
            ]
        };
        this.validate = this.validate.bind(this);
    }
    async register() {
        this.context.subscriptions.push(vscode.commands.registerCommand('vscodeai.batchai.editStorageCredentials', async () => {
            await progressToolkit_1.withProgress('BatchAI Edit Storage Credentials', async () => this.edit());
        }));
        const schema = await fs.readJSON(path.join(this.context.extensionPath, 'batchai_storage_credentials.schema.json'));
        this.ajvValidate = new Ajv().compile(schema);
    }
    async get() {
        let res = this.context.globalState.get(this.key);
        if (lodash_1.isNil(res)) {
            res = Object.assign({}, this.defaultConfig);
            await this.save(res);
        }
        return res;
    }
    async save(val) {
        await this.context.globalState.update(this.key, val);
    }
    async edit() {
        const list = await this.get();
        const res = await component.get(editorToolkit_1.EditorToolkit).editObject(list, 'batchai_storage_credentials.json', 'Save (press CTRL+S) to continue, close (press CTRL+W) to cancel.', this.validate);
        if (res.continue) {
            await this.save(res.object);
        }
        return res;
    }
    async validate(val) {
        if (!this.ajvValidate(val)) {
            const e = this.ajvValidate.errors[0];
            return {
                valid: false,
                reason: `${e.dataPath} ${e.message}`
            };
        }
        else {
            return {
                valid: true
            };
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], BatchAIStorageCredentials.prototype, "context", void 0);
BatchAIStorageCredentials = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton,
    __metadata("design:paramtypes", [])
], BatchAIStorageCredentials);
exports.BatchAIStorageCredentials = BatchAIStorageCredentials;
//# sourceMappingURL=batchAIStorageCredentials.js.map