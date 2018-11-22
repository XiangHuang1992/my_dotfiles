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
function testDiagnostics(docUri, position, expectedDiagnostics) {
    return __awaiter(this, void 0, void 0, function* () {
        // For diagnostics to show up
        yield helper_1.sleep(2000);
        const result = vscode.languages.getDiagnostics(docUri);
        expectedDiagnostics.forEach(ed => {
            assert.ok(result.some(d => {
                return isEqualDiagnostic(d, ed);
            }));
        });
        function isEqualDiagnostic(d1, d2) {
            const sourceIsEqual = d1.source
                ? d1.source === d2.source
                : true;
            return d1.severity === d2.severity &&
                d1.message === d2.message &&
                d1.range.isEqual(d2.range) &&
                sourceIsEqual;
        }
    });
}
exports.testDiagnostics = testDiagnostics;
//# sourceMappingURL=helper.js.map