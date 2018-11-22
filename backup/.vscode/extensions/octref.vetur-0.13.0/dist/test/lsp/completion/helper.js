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
function testCompletion(docUri, position, expectedItems) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.showFile(docUri);
        const result = (yield vscode.commands.executeCommand('vscode.executeCompletionItemProvider', docUri, position));
        expectedItems.forEach(ei => {
            assert.ok(result.items.some(i => {
                return i.label === ei;
            }));
        });
    });
}
exports.testCompletion = testCompletion;
//# sourceMappingURL=helper.js.map