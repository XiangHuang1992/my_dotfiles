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
describe('Should do documentSymbol', () => {
    const docUri = helper_1.getDocUri('client/documentSymbol/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows all documentSymbols for Basic.vue', () => __awaiter(this, void 0, void 0, function* () {
        yield testSymbol(docUri, [
            {
                name: '"Basic.vue"',
                kind: 1,
                // Todo: Fix this test
                containerName: '',
                location: util_1.location(docUri, 0, 0, 13, 0),
            },
            {
                name: 'template',
                location: util_1.location(docUri, 0, 0, 3, 11),
                containerName: '"Basic.vue"',
                kind: 7
            },
            {
                name: 'div.counter-wrapper',
                location: util_1.location(docUri, 1, 2, 2, 8),
                containerName: 'template',
                kind: 7
            },
            {
                name: 'script',
                location: util_1.location(docUri, 5, 0, 13, 9),
                containerName: '',
                kind: 7
            },
            {
                name: 'data',
                kind: 5,
                location: util_1.location(docUri, 7, 2, 11, 3),
                // Todo: Fix this test
                containerName: '"Basic.vue"'
            },
            {
                name: 'style',
                location: util_1.location(docUri, 15, 0, 19, 8),
                containerName: '',
                kind: 7
            },
            {
                name: '.counter-wrapper > *',
                kind: 4,
                containerName: 'style',
                location: util_1.location(docUri, 16, 0, 18, 1)
            }
        ]);
    }));
});
function testSymbol(docUri, expectedSymbols) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', docUri));
        expectedSymbols.forEach(es => {
            const rs = result.find(s => {
                return s.name === es.name && s.kind === es.kind && s.containerName === es.containerName;
            });
            assert.ok(rs);
            assertEqualSymbol(rs, es);
        });
        function assertEqualSymbol(h1, h2) {
            assert.deepEqual(h1, h2);
        }
    });
}
//# sourceMappingURL=basic.test.js.map