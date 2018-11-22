"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
exports.EXT_IDENTIFIER = 'octref.vetur';
exports.FILE_LOAD_SLEEP_TIME = 1500;
exports.ext = vscode.extensions.getExtension(exports.EXT_IDENTIFIER);
/**
 * Activate Extension and open a Vue file to make sure LS is running
 */
function activateLS() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.ext.activate();
        }
        catch (err) {
            console.error(err);
            console.log(`Failed to activate ${exports.EXT_IDENTIFIER}`);
            process.exit(1);
        }
    });
}
exports.activateLS = activateLS;
function showFile(docUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield vscode.workspace.openTextDocument(docUri);
        return yield vscode.window.showTextDocument(doc);
    });
}
exports.showFile = showFile;
exports.getDocPath = (p) => {
    return path.resolve(__dirname, '../../test/fixture', p);
};
exports.getDocUri = (p) => {
    return vscode.Uri.file(exports.getDocPath(p));
};
function setEditorContent(editor, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = editor.document;
        const all = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
        return editor.edit(eb => eb.replace(all, content));
    });
}
exports.setEditorContent = setEditorContent;
function readFileAsync(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
exports.readFileAsync = readFileAsync;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
//# sourceMappingURL=helper.js.map