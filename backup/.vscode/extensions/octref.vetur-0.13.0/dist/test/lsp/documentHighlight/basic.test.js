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
describe('Should do documentHighlight', () => {
    const docUri = helper_1.getDocUri('client/documentHighlight/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows highlights for <div> tags', () => __awaiter(this, void 0, void 0, function* () {
        yield testHighlight(docUri, util_1.position(2, 5), [
            { kind: vscode.DocumentHighlightKind.Read, range: util_1.sameLineRange(2, 5, 8) },
            { kind: vscode.DocumentHighlightKind.Read, range: util_1.sameLineRange(2, 20, 23) }
        ]);
    }));
    it('shows highlights for this.msg', () => __awaiter(this, void 0, void 0, function* () {
        yield testHighlight(docUri, util_1.position(23, 6), [
            { kind: vscode.DocumentHighlightKind.Write, range: util_1.sameLineRange(23, 6, 9) },
            { kind: vscode.DocumentHighlightKind.Text, range: util_1.sameLineRange(33, 23, 26) }
        ]);
    }));
    it('shows highlights for Item', () => __awaiter(this, void 0, void 0, function* () {
        yield testHighlight(docUri, util_1.position(20, 16), [
            { kind: vscode.DocumentHighlightKind.Write, range: util_1.sameLineRange(17, 7, 11) },
            { kind: vscode.DocumentHighlightKind.Write, range: util_1.sameLineRange(20, 16, 20) }
        ]);
    }));
});
function testHighlight(docUri, position, expectedHighlights) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeDocumentHighlights', docUri, position));
        expectedHighlights.forEach(eh => {
            assert.ok(result.some(h => isEqualHighlight(h, eh)));
        });
        function isEqualHighlight(h1, h2) {
            return h1.kind === h2.kind && h1.range.isEqual(h2.range);
        }
    });
}
//# sourceMappingURL=basic.test.js.map