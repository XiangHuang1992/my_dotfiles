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
const util_1 = require("../util");
describe('Should do documentLink', () => {
    const docUri = helper_1.getDocUri('client/documentLink/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows all documentLinks for Basic.vue', () => __awaiter(this, void 0, void 0, function* () {
        yield testLink(docUri, [
            { target: vscode.Uri.parse('https://vuejs.org/images/logo.png'), range: util_1.sameLineRange(2, 14, 47) },
            { target: helper_1.getDocUri('client/documentLink/Basic.vue/foo'), range: util_1.sameLineRange(3, 13, 18) }
        ]);
    }));
});
function testLink(docUri, expectedLinks) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeLinkProvider', docUri));
        expectedLinks.forEach(el => {
            assert.ok(result.some(l => isEqualLink(l, el)));
        });
        function isEqualLink(h1, h2) {
            return h1.target.path === h2.target.path && h1.range.isEqual(h2.range);
        }
    });
}
//# sourceMappingURL=basic.test.js.map