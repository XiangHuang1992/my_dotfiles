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
describe('Should do hover', () => {
    const docUri = helper_1.getDocUri('client/hover/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows hover for <img> tag', () => __awaiter(this, void 0, void 0, function* () {
        yield testHover(docUri, util_1.position(4, 7), {
            contents: [
                '\n```html\n<img>\n```\n',
                'An img element represents an image\\.'
            ],
            range: util_1.sameLineRange(4, 7, 10)
        });
    }));
    it('shows hover for this.msg', () => __awaiter(this, void 0, void 0, function* () {
        yield testHover(docUri, util_1.position(33, 23), {
            contents: [
                '\n```ts\n(property) msg: string\n```\n'
            ],
            range: util_1.sameLineRange(33, 23, 26)
        });
    }));
    it('shows hover for `width` in <style>', () => __awaiter(this, void 0, void 0, function* () {
        yield testHover(docUri, util_1.position(47, 3), {
            contents: [
                // tslint:disable-next-line
                `Specifies the width of the content area, padding area or border area \\(depending on 'box\\-sizing'\\) of certain boxes\\.`,
            ],
            range: util_1.sameLineRange(47, 2, 14)
        });
    }));
});
function testHover(docUri, position, expectedHover) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeHoverProvider', docUri, position));
        if (!result[0]) {
            throw Error('Hover failed');
        }
        const contents = result[0].contents;
        contents.forEach((c, i) => {
            const val = c.value;
            assert.equal(val, expectedHover.contents[i]);
        });
        if (result[0] && result[0].range) {
            assert.ok(result[0].range.isEqual(expectedHover.range));
        }
    });
}
//# sourceMappingURL=basic.test.js.map