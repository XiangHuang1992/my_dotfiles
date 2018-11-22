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
const assert = require("assert");
const helper_1 = require("../../helper");
describe('Should format', () => {
    const docUri = helper_1.getDocUri('client/formatting/Basic.vue');
    const expectedDocUri = helper_1.getDocUri('client/formatting/Basic.Expected.vue');
    const docUri2 = helper_1.getDocUri('client/formatting/VueHNUserView.vue');
    const expectedDocUri2 = helper_1.getDocUri('client/formatting/VueHNUserView.Expected.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.showFile(docUri2);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('formats', () => __awaiter(this, void 0, void 0, function* () {
        yield testFormat(docUri, expectedDocUri);
        yield testFormat(docUri2, expectedDocUri2);
    }));
});
function testFormat(docUri, expectedDocUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = yield helper_1.showFile(docUri);
        const oldContent = editor.document.getText();
        const result = (yield vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', docUri, {
            tabSize: 2,
            insertSpaces: true
        }));
        if (result) {
            yield editor.edit(b => result.forEach(f => b.replace(f.range, f.newText)));
        }
        const expected = yield helper_1.readFileAsync(expectedDocUri.fsPath);
        assert.equal(editor.document.getText(), expected);
        yield helper_1.setEditorContent(editor, oldContent);
    });
}
//# sourceMappingURL=basic.test.js.map