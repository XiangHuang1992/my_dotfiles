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
const registerProvider_1 = require("interfaces/registerProvider");
/**
 * Editor toolkit
 */
let EditorToolkit = class EditorToolkit {
    constructor() {
        void this.logger.debug('ConfigurationsFileManager singleton created.');
        this.willSaveEvents = new Map();
        this.didSaveEvents = new Map();
        this.cleanUpEvents = new Map();
    }
    register() {
        this.context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(async (event) => {
            if (event.reason === vscode.TextDocumentSaveReason.Manual) {
                const fileName = normalizeFilePath(event.document.fileName);
                if (this.willSaveEvents.has(fileName)) {
                    await this.willSaveEvents.get(fileName)(event);
                }
            }
        }), vscode.workspace.onDidSaveTextDocument(async (doc) => {
            const fileName = normalizeFilePath(doc.fileName);
            if (this.didSaveEvents.has(fileName)) {
                await this.didSaveEvents.get(fileName)(doc);
            }
        }));
    }
    async cleanUp(name) {
        if (lodash_1.isNil(name)) {
            this.cleanUpEvents.forEach(async (func) => {
                await func();
            });
        }
        else {
            const func = this.cleanUpEvents.get(normalizeFilePath(name));
            if (!lodash_1.isNil(func)) {
                await func();
            }
        }
    }
    async editObject(object, tempFileName, prompt, validator) {
        await this.cleanUp(tempFileName);
        return new Promise(async (resolve, reject) => {
            const dirName = await fs.mkdtemp(path.join(os.tmpdir(), 'aitools_'));
            const fileName = path.join(dirName, tempFileName);
            await fs.writeJson(fileName, object, { spaces: 4 });
            const document = await vscode.workspace.openTextDocument(fileName);
            const editor = await vscode.window.showTextDocument(document, { preview: false });
            if (!lodash_1.isEmpty(prompt)) {
                prompt = `//${prompt.trim().replace(/\n/g, '\n//')}\n`;
            }
            await this.insertPrompt(editor, prompt);
            await editor.document.save();
            let valid;
            this.registerWillSaveEvent(fileName, async (event) => {
                valid = false;
                event.waitUntil(this.checkDocument(editor, prompt, validator).then((res) => {
                    valid = res;
                }));
            });
            this.registerDidSaveEvent(fileName, async (doc) => {
                if (!valid) {
                    return;
                }
                this.unregisterWillSaveEvent(fileName);
                this.unregisterDidSaveEvent(fileName);
                this.unregisterCleanUpEvent(tempFileName);
                resolve({
                    continue: true,
                    object: JSON.parse(doc.getText())
                });
                await fs.remove(path.dirname(fileName));
            });
            this.registerCleanUpEvent(tempFileName, async () => {
                this.unregisterWillSaveEvent(fileName);
                this.unregisterDidSaveEvent(fileName);
                this.unregisterCleanUpEvent(tempFileName);
                await this.deletePromptFromFile(fileName, prompt);
                resolve({
                    continue: false
                });
                await fs.remove(path.dirname(fileName));
            });
        });
    }
    async editFile(filePath, prompt, validator, autoClose) {
        await this.cleanUp(filePath.fsPath);
        return new Promise(async (resolve, reject) => {
            if (lodash_1.isEmpty(filePath.fsPath) || !await fs.pathExists(filePath.fsPath)) {
                reject('File not found');
                return;
            }
            const dirName = await fs.mkdtemp(path.join(os.tmpdir(), 'aitools_'));
            const tmpfilePath = path.join(dirName, path.basename(filePath.fsPath));
            await fs.writeFile(tmpfilePath, await fs.readFile(filePath.fsPath));
            const document = await vscode.workspace.openTextDocument(tmpfilePath);
            const editor = await vscode.window.showTextDocument(document, { preview: false });
            if (!lodash_1.isEmpty(prompt)) {
                prompt = `//${prompt.trim().replace(/\n/g, '\n//')}\n`;
            }
            await this.insertPrompt(editor, prompt);
            await editor.document.save();
            let valid;
            this.registerWillSaveEvent(tmpfilePath, async (event) => {
                valid = false;
                event.waitUntil(this.checkDocument(editor, prompt, validator).then((res) => {
                    valid = res;
                }));
            });
            this.registerDidSaveEvent(tmpfilePath, async (doc) => {
                if (!valid) {
                    return;
                }
                this.unregisterWillSaveEvent(tmpfilePath);
                this.unregisterDidSaveEvent(tmpfilePath);
                this.unregisterCleanUpEvent(filePath.fsPath);
                resolve({
                    continue: true
                });
                await fs.writeFile(filePath.fsPath, doc.getText(), 'utf8');
                await fs.remove(path.dirname(tmpfilePath));
            });
            this.registerCleanUpEvent(filePath.fsPath, async () => {
                this.unregisterWillSaveEvent(tmpfilePath);
                this.unregisterDidSaveEvent(tmpfilePath);
                this.unregisterCleanUpEvent(filePath.fsPath);
                resolve({
                    continue: false
                });
                await fs.remove(path.dirname(tmpfilePath));
            });
        });
    }
    registerWillSaveEvent(fileName, eventHandler) {
        this.willSaveEvents.set(normalizeFilePath(fileName), eventHandler);
    }
    unregisterWillSaveEvent(fileName) {
        this.willSaveEvents.delete(normalizeFilePath(fileName));
    }
    registerDidSaveEvent(fileName, eventHandler) {
        this.didSaveEvents.set(normalizeFilePath(fileName), eventHandler);
    }
    unregisterDidSaveEvent(fileName) {
        this.didSaveEvents.delete(normalizeFilePath(fileName));
    }
    registerCleanUpEvent(fileName, eventHandler) {
        this.cleanUpEvents.set(normalizeFilePath(fileName), eventHandler);
    }
    unregisterCleanUpEvent(fileName) {
        this.cleanUpEvents.delete(normalizeFilePath(fileName));
    }
    async checkDocument(editor, prompt, validator) {
        const document = editor.document;
        let text = document.getText();
        if (!lodash_1.isEmpty(text) && text.startsWith(prompt)) {
            text = text.slice(prompt.length);
        }
        const isjson = document.fileName.toLowerCase().endsWith('.json');
        if (isjson) {
            try {
                const content = JSON.parse(text);
            }
            catch (err) {
                await vscode.window.showWarningMessage(`Document parse failed, please edit again, message: ${err}`);
                return false;
            }
        }
        if (!lodash_1.isNil(validator)) {
            const ret = isjson ? await validator(JSON.parse(text)) : await validator(text);
            if (!ret.valid) {
                await vscode.window.showWarningMessage(`Document validate failed, please edit again, message: ${ret.reason}`);
                return false;
            }
        }
        await this.deletePrompt(editor, prompt);
        return true;
    }
    async insertPrompt(editor, prompt) {
        if (!lodash_1.isEmpty(prompt)) {
            await editor.edit((builder) => {
                builder.insert(new vscode.Position(0, 0), prompt);
            });
        }
    }
    async deletePrompt(editor, prompt) {
        if (!lodash_1.isEmpty(prompt)) {
            const text = editor.document.getText();
            if (text.startsWith(prompt)) {
                await editor.edit((builder) => {
                    builder.delete(new vscode.Range(0, 0, prompt.split('\n').length - 1, 0));
                });
            }
        }
    }
    async deletePromptFromFile(file, prompt) {
        const text = await fs.readFile(file, 'utf8');
        if (text.startsWith(prompt)) {
            await fs.writeFile(file, text.slice(prompt.length));
        }
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], EditorToolkit.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], EditorToolkit.prototype, "logger", void 0);
EditorToolkit = __decorate([
    component.Export(registerProvider_1.RegisterProvider),
    component.Singleton,
    __metadata("design:paramtypes", [])
], EditorToolkit);
exports.EditorToolkit = EditorToolkit;
function normalizeFilePath(filePath) {
    if (os.platform() === 'win32' || os.platform() === 'darwin') {
        return filePath.toLowerCase();
    }
    else {
        return filePath;
    }
}
//# sourceMappingURL=editorToolkit.js.map