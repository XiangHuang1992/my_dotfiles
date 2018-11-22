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
const helper_1 = require("../../helper");
const util_1 = require("../util");
const helper_2 = require("./helper");
describe('Should find diagnostics using eslint-plugin-vue', () => {
    const docUri = helper_1.getDocUri('client/diagnostics/ESLint.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows diagnostic errors for template errors', () => __awaiter(this, void 0, void 0, function* () {
        const expectedDiagnostics = [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: "\n[vue/require-v-for-key]\nElements in iteration expect to have 'v-bind:key' directives.",
                range: util_1.sameLineRange(2, 4, 23),
                source: 'eslint-plugin-vue'
            },
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: "\n[vue/no-unused-vars]\n'i' is defined but never used.",
                range: util_1.sameLineRange(2, 15, 16),
                source: 'eslint-plugin-vue'
            },
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '\n[vue/valid-template-root]\nThe template root requires exactly one element.',
                range: util_1.sameLineRange(6, 2, 13),
                source: 'eslint-plugin-vue'
            }
        ];
        yield helper_2.testDiagnostics(docUri, util_1.position(2, 5), expectedDiagnostics);
    }));
});
//# sourceMappingURL=eslint.test.js.map