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
describe('Should find definition', () => {
    const docUri = helper_1.getDocUri('client/definition/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('finds definition for this.msg', () => __awaiter(this, void 0, void 0, function* () {
        yield testDefinition(docUri, util_1.position(32, 23), util_1.sameLineLocation(docUri, 22, 6, 9));
    }));
    it('finds definition for lodash', () => __awaiter(this, void 0, void 0, function* () {
        const lodashDtsUri = helper_1.getDocUri('node_modules/@types/lodash/index.d.ts');
        yield testDefinition(docUri, util_1.position(16, 12), util_1.sameLineLocation(lodashDtsUri, 246, 12, 13));
    }));
    it('finds definition for Vue#data', () => __awaiter(this, void 0, void 0, function* () {
        const vueOptionsDtsUri = helper_1.getDocUri('node_modules/vue/types/options.d.ts');
        yield testDefinition(docUri, util_1.position(20, 2), util_1.sameLineLocation(vueOptionsDtsUri, 58, 2, 6));
    }));
    it('finds definition for imported Vue files', () => __awaiter(this, void 0, void 0, function* () {
        const itemUri = helper_1.getDocUri('client/definition/Basic.Item.vue');
        yield testDefinition(docUri, util_1.position(17, 7), util_1.location(itemUri, 5, 0, 7, 1));
    }));
});
function testDefinition(docUri, position, expectedLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeDefinitionProvider', docUri, position));
        assert.ok(result[0].range.isEqual(expectedLocation.range));
        assert.equal(result[0].uri.path, expectedLocation.uri.path);
    });
}
//# sourceMappingURL=basic.test.js.map