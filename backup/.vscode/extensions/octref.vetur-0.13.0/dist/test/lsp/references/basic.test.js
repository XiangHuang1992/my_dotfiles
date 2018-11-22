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
describe('Should find references', () => {
    const docUri = helper_1.getDocUri('client/references/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('finds references for this.msg', () => __awaiter(this, void 0, void 0, function* () {
        yield testReferences(docUri, util_1.position(33, 23), [
            util_1.sameLineLocation(docUri, 23, 6, 9),
            util_1.sameLineLocation(docUri, 33, 23, 26)
        ]);
    }));
    it('finds references for lodash', () => __awaiter(this, void 0, void 0, function* () {
        const lodashDtsUri = helper_1.getDocUri('node_modules/@types/lodash/index.d.ts');
        yield testReferences(docUri, util_1.position(16, 12), [
            util_1.location(docUri, 16, 12, 16, 13),
            util_1.sameLineLocation(lodashDtsUri, 243, 9, 10),
            util_1.sameLineLocation(lodashDtsUri, 246, 12, 13)
        ]);
    }));
    it('finds references for Vue#data', () => __awaiter(this, void 0, void 0, function* () {
        const vueOptionsDtsUri = helper_1.getDocUri('node_modules/vue/types/options.d.ts');
        yield testReferences(docUri, util_1.position(21, 2), [
            util_1.sameLineLocation(vueOptionsDtsUri, 58, 2, 6),
            util_1.sameLineLocation(docUri, 21, 2, 6)
        ]);
    }));
    it('finds references for imported Vue files', () => __awaiter(this, void 0, void 0, function* () {
        const itemUri = helper_1.getDocUri('client/references/Basic.Item.vue');
        yield testReferences(docUri, util_1.position(20, 16), [
            util_1.sameLineLocation(docUri, 17, 7, 11),
            util_1.sameLineLocation(itemUri, 5, 7, 14)
        ]);
    }));
});
function testReferences(docUri, position, expectedLocations) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeReferenceProvider', docUri, position));
        expectedLocations.forEach(el => {
            assert.ok(result.some(l => {
                return l.range.isEqual(el.range) && l.uri.path === el.uri.path;
            }));
        });
    });
}
//# sourceMappingURL=basic.test.js.map